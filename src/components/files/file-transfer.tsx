'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Download, FileUp, LockKeyhole, LogOut, RefreshCw } from 'lucide-react';
import {
  assertX25519Support,
  type BrowserTransportConfig,
  encryptPayloadV2,
  sha256Hex,
} from '@/lib/file-transfer-crypto';

const UPLOAD_CHUNK_SIZE = 2.5 * 1024 * 1024;
const MAX_FILE_SIZE = 100 * 1024 * 1024;
const MAX_RETRIES = 3;

interface StoredFile {
  id: string;
  name: string;
  size: number;
  sha256: string;
  storedAt: string;
}

interface Manifest extends StoredFile {
  chunkSize: number;
  totalChunks: number;
}

interface StatusPayload {
  status: 'receiving' | 'complete' | 'processing' | 'stored' | 'failed';
  message: string;
  details?: { error?: string };
}

export function FileTransfer({ initialAuthenticated }: { initialAuthenticated: boolean }) {
  const [authenticated, setAuthenticated] = useState(initialAuthenticated);
  const [password, setPassword] = useState('');
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [cryptoError, setCryptoError] = useState<string | null>(null);
  const [transportConfig, setTransportConfig] = useState<BrowserTransportConfig | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadFiles = useCallback(async (append = false, nextCursor?: string | null) => {
    const query = new URLSearchParams({ limit: '20' });
    if (nextCursor) query.set('cursor', nextCursor);
    const response = await fetch(`/api/files?${query}`, { cache: 'no-store' });
    if (response.status === 401) {
      setAuthenticated(false);
      return;
    }
    const payload = await readJson<{ files: StoredFile[]; nextCursor: string | null }>(response);
    setAuthenticated(true);
    setFiles((current) => append ? [...current, ...payload.files] : payload.files);
    setCursor(payload.nextCursor);
  }, []);

  const loadTransportConfig = useCallback(async () => {
    const response = await fetch('/api/files/transport-config', { cache: 'no-store' });
    if (response.status === 401) {
      setAuthenticated(false);
      return;
    }
    const config = await readJson<BrowserTransportConfig>(response);
    await assertX25519Support(config);
    setTransportConfig(config);
    setCryptoError(null);
  }, []);

  useEffect(() => {
    if (!initialAuthenticated) return;
    const initialize = async () => {
      await loadFiles();
      await loadTransportConfig();
    };
    initialize().catch((error) => {
      setAuthenticated(false);
      setCryptoError('This browser cannot load or use the required X25519/AWR2 transport configuration. Upload is disabled; no plaintext fallback is available.');
      setMessage(errorMessage(error));
    });
  }, [initialAuthenticated, loadFiles, loadTransportConfig]);

  async function login(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      await readJson(await fetch('/api/files/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      }));
      setPassword('');
      await loadFiles();
      await loadTransportConfig();
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    try {
      await fetch('/api/files/logout', { method: 'POST' });
    } finally {
      setAuthenticated(false);
      setFiles([]);
      setSelected(null);
      setTransportConfig(null);
    }
  }

  async function upload(file: File) {
    if (cryptoError) return setMessage(cryptoError);
    if (!transportConfig) return setMessage('Upload transport configuration is not available.');
    if (file.size <= 0 || file.size >= MAX_FILE_SIZE) {
      return setMessage('Choose a non-empty file smaller than 100 MiB.');
    }
    setBusy(true);
    setProgress(0);
    setMessage('Hashing file…');
    const sessionId = crypto.randomUUID();
    try {
      const wholeFile = await file.arrayBuffer();
      const sha256 = await sha256Hex(wholeFile);
      const totalChunks = Math.ceil(file.size / UPLOAD_CHUNK_SIZE);
      let nextIndex = 0;
      let completed = 0;
      setMessage('Uploading encrypted chunks…');

      const worker = async () => {
        while (true) {
          const chunkIndex = nextIndex++;
          if (chunkIndex >= totalChunks) return;
          const start = chunkIndex * UPLOAD_CHUNK_SIZE;
          const chunk = wholeFile.slice(start, Math.min(start + UPLOAD_CHUNK_SIZE, file.size));
          await retry(async () => {
            const gameData = await encryptPayloadV2(
              { sessionId, chunkIndex, totalChunks },
              transportConfig,
              chunk,
            );
            await postEncrypted('/api/files/chunk', gameData);
          });
          completed += 1;
          setProgress(Math.round(completed / totalChunks * 85));
        }
      };
      await Promise.all([worker(), worker()]);

      await postEncrypted('/api/files/complete', await encryptPayloadV2({ sessionId }, transportConfig));
      setProgress(90);
      const storeResult = await postEncrypted<{ status?: string }>('/api/files/store', await encryptPayloadV2({
        sessionId,
        fileName: file.name,
        size: file.size,
        sha256,
      }, transportConfig));
      setMessage('Finalizing durable storage…');
      if (storeResult.status !== 'stored') await waitUntilStored(sessionId);
      setProgress(100);
      setMessage(`Uploaded and verified: ${file.name}`);
      await loadFiles();
    } catch (error) {
      setMessage(`Upload stopped: ${errorMessage(error)}. Select the same file to retry with a new session.`);
    } finally {
      setBusy(false);
    }
  }

  async function download() {
    if (!selected) return;
    setBusy(true);
    setProgress(0);
    setMessage('Downloading verified chunks…');
    try {
      const manifest = await readJson<Manifest>(await fetch(`/api/files/${encodeURIComponent(selected)}/manifest`));
      if (manifest.size >= MAX_FILE_SIZE) throw new Error('Manifest exceeds the browser download ceiling');
      const chunks: Uint8Array[] = [];
      let received = 0;
      for (let index = 0; index < manifest.totalChunks; index++) {
        const response = await fetch(`/api/files/${encodeURIComponent(selected)}/chunks/${index}`);
        if (!response.ok) throw new Error(await responseError(response));
        const chunk = new Uint8Array(await response.arrayBuffer());
        chunks.push(chunk);
        received += chunk.length;
        setProgress(Math.round(received / manifest.size * 90));
      }
      if (received !== manifest.size) throw new Error('Downloaded byte count does not match the manifest');
      const combined = new Uint8Array(received);
      let offset = 0;
      for (const chunk of chunks) { combined.set(chunk, offset); offset += chunk.length; }
      if (await sha256Hex(combined.buffer) !== manifest.sha256) throw new Error('Downloaded SHA-256 does not match the manifest');
      await saveFile(manifest.name, combined);
      setProgress(100);
      setMessage(`Downloaded and verified: ${manifest.name}`);
    } catch (error) {
      setMessage(`Download stopped: ${errorMessage(error)}`);
    } finally {
      setBusy(false);
    }
  }

  if (authenticated === false) {
    return (
      <main className="min-h-screen grid place-items-center p-6 bg-zinc-950 text-zinc-100">
        <form onSubmit={login} className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-7 shadow-2xl">
          <LockKeyhole className="mb-5 h-8 w-8 text-indigo-400" />
          <h1 className="text-2xl font-semibold">Private file relay</h1>
          <p className="mt-2 text-sm text-zinc-400">Authenticate to transfer files through this origin.</p>
          <input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="mt-6 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 outline-none focus:border-indigo-500" placeholder="Password" />
          <button disabled={busy} className="mt-3 w-full rounded-lg bg-indigo-500 px-4 py-2.5 font-medium hover:bg-indigo-400 disabled:opacity-50">Unlock</button>
          {message && <p role="alert" className="mt-4 text-sm text-amber-300">{message}</p>}
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 p-5 text-zinc-100 md:p-10">
      <div className="mx-auto max-w-5xl">
        <header className="flex items-center justify-between gap-4">
          <div><p className="text-xs font-medium uppercase tracking-[0.3em] text-indigo-400">Same-origin relay</p><h1 className="mt-1 text-3xl font-semibold">File transfer</h1></div>
          <button onClick={logout} className="flex items-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-sm hover:bg-zinc-900"><LogOut className="h-4 w-4" /> Logout</button>
        </header>

        <section
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => { event.preventDefault(); const file = event.dataTransfer.files[0]; if (file) upload(file); }}
          className="mt-8 rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/70 p-10 text-center"
        >
          <FileUp className="mx-auto h-10 w-10 text-indigo-400" />
          <h2 className="mt-4 text-lg font-medium">Drop a file here</h2>
          <p className="mt-1 text-sm text-zinc-400">Encrypted AWR2 upload, files smaller than 100 MiB</p>
          <input ref={inputRef} type="file" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) upload(file); event.currentTarget.value = ''; }} />
          <button onClick={() => inputRef.current?.click()} disabled={busy || Boolean(cryptoError) || !transportConfig} className="mt-5 rounded-lg bg-indigo-500 px-4 py-2.5 font-medium hover:bg-indigo-400 disabled:opacity-50">Choose file</button>
          {cryptoError && <p role="alert" className="mx-auto mt-4 max-w-xl text-sm text-rose-300">{cryptoError}</p>}
        </section>

        {(busy || message) && <section className="mt-5 rounded-xl border border-zinc-800 bg-zinc-900 p-4"><div className="h-2 overflow-hidden rounded bg-zinc-800"><div className="h-full bg-indigo-500 transition-all" style={{ width: `${progress}%` }} /></div><p className="mt-2 text-sm text-zinc-300">{message || 'Working…'}</p></section>}

        <section className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/70">
          <div className="flex items-center justify-between border-b border-zinc-800 p-4"><h2 className="font-medium">Stored files</h2><button onClick={() => loadFiles()} disabled={busy} aria-label="Refresh files" className="rounded-lg p-2 hover:bg-zinc-800"><RefreshCw className="h-4 w-4" /></button></div>
          <div className="divide-y divide-zinc-800">
            {files.map((file) => <label key={file.id} className="flex cursor-pointer items-center gap-3 p-4 hover:bg-zinc-800/50"><input type="radio" name="file" checked={selected === file.id} onChange={() => setSelected(file.id)} /><span className="min-w-0 flex-1"><span className="block truncate font-medium">{file.name}</span><span className="text-xs text-zinc-500">{formatBytes(file.size)} · {new Date(file.storedAt).toLocaleString()}</span></span></label>)}
            {authenticated === true && files.length === 0 && <p className="p-6 text-center text-sm text-zinc-500">No cataloged files.</p>}
          </div>
          <div className="flex items-center justify-between p-4">
            <button onClick={() => loadFiles(true, cursor)} disabled={!cursor || busy} className="text-sm text-zinc-400 disabled:opacity-40">Load more</button>
            <button onClick={download} disabled={!selected || busy} className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium hover:bg-emerald-500 disabled:opacity-40"><Download className="h-4 w-4" /> Download selected</button>
          </div>
        </section>
      </div>
    </main>
  );
}

async function postEncrypted<T = unknown>(path: string, gameData: string): Promise<T> {
  return readJson<T>(await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ gameData }) }));
}

async function waitUntilStored(sessionId: string): Promise<void> {
  for (let attempt = 0; attempt < 60; attempt++) {
    const status = await readJson<StatusPayload>(await fetch(`/api/files/status/${encodeURIComponent(sessionId)}`, { cache: 'no-store' }));
    if (status.status === 'stored') return;
    if (status.status === 'failed') throw new Error(status.details?.error || status.message);
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  throw new Error('Storage finalization timed out; status can be checked by retrying the upload');
}

async function retry(action: () => Promise<void>): Promise<void> {
  let lastError: unknown;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try { await action(); return; } catch (error) { lastError = error; if (attempt + 1 < MAX_RETRIES) await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt)); }
  }
  throw lastError;
}

async function readJson<T = unknown>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => ({})) as { message?: string; error?: string };
  if (!response.ok) throw new Error(payload.message || payload.error || `Request failed (${response.status})`);
  return payload as T;
}

async function responseError(response: Response): Promise<string> {
  const payload = await response.json().catch(() => null) as { message?: string; error?: string } | null;
  return payload?.message || payload?.error || `Request failed (${response.status})`;
}

async function saveFile(name: string, data: Uint8Array): Promise<void> {
  const picker = (window as Window & { showSaveFilePicker?: (options: { suggestedName: string }) => Promise<{ createWritable(): Promise<{ write(data: Blob): Promise<void>; close(): Promise<void> }> }> }).showSaveFilePicker;
  const copy = new Uint8Array(data.byteLength);
  copy.set(data);
  const blob = new Blob([copy.buffer], { type: 'application/octet-stream' });
  if (picker) {
    const handle = await picker({ suggestedName: name });
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
    return;
  }
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MiB`;
}
function errorMessage(error: unknown): string { return error instanceof Error ? error.message : String(error); }
