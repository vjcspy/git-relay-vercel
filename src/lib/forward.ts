import { NextRequest, NextResponse } from 'next/server';
import { getValidatedServerUrl } from './server-url';

const SERVER_URL = process.env.SERVER_URL!;
const SERVER_KEY = process.env.SERVER_API_KEY!;
const RELAY_KEY = process.env.RELAY_API_KEY!;

/**
 * Shared forward-to-server logic.
 * All relay routes follow the same pattern:
 * 1. Validate API key from request header (X-Relay-Key)
 * 2. Forward request body to server (add X-Server-Key header)
 * 3. Return server response as-is
 */
export async function forwardToServer(
  req: NextRequest,
  serverPath: string,
  method: 'GET' | 'POST' = 'POST',
): Promise<NextResponse> {
  // 1. Auth — validate relay key from CLI
  if (req.headers.get('X-Relay-Key') !== RELAY_KEY) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  // 2. Forward to server
  const fetchOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Server-Key': SERVER_KEY,
    },
  };

  if (method === 'POST') {
    fetchOptions.body = await req.text();
  }

  try {
    const res = await fetch(`${SERVER_URL}${serverPath}`, fetchOptions);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: 'RELAY_ERROR', message: `Failed to reach server: ${message}` },
      { status: 502 },
    );
  }
}

export async function forwardFileJson(
  req: NextRequest,
  serverPath: string,
  method: 'GET' | 'POST',
): Promise<NextResponse> {
  try {
    const options: RequestInit = {
      method,
      headers: { 'Content-Type': 'application/json', 'X-Server-Key': process.env.SERVER_API_KEY! },
      cache: 'no-store',
    };
    if (method === 'POST') options.body = await req.text();
    const upstream = await fetch(`${getValidatedServerUrl()}${serverPath}`, options);
    const text = await upstream.text();
    if (!(upstream.headers.get('content-type') || '').includes('application/json')) {
      return NextResponse.json({ error: 'INVALID_UPSTREAM_RESPONSE' }, { status: 502 });
    }
    return new NextResponse(text, {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    return relayFailure(error);
  }
}

export async function forwardFileBinary(serverPath: string): Promise<NextResponse> {
  try {
    const upstream = await fetch(`${getValidatedServerUrl()}${serverPath}`, {
      headers: { 'X-Server-Key': process.env.SERVER_API_KEY! },
      cache: 'no-store',
    });
    if (!upstream.ok) {
      const body = await upstream.text();
      return new NextResponse(body, {
        status: upstream.status,
        headers: { 'Content-Type': upstream.headers.get('content-type') || 'application/json' },
      });
    }
    const headers = new Headers({ 'Cache-Control': 'private, no-store' });
    for (const name of ['content-type', 'content-length', 'content-disposition', 'x-file-id', 'x-chunk-index', 'x-total-chunks']) {
      const value = upstream.headers.get(name);
      if (value) headers.set(name, value);
    }
    return new NextResponse(upstream.body, { status: upstream.status, headers });
  } catch (error) {
    return relayFailure(error);
  }
}

function relayFailure(error: unknown): NextResponse {
  const message = error instanceof Error ? error.message : 'Unknown relay failure';
  console.error(`File relay failure: ${message}`);
  return NextResponse.json({ error: 'RELAY_ERROR', message: 'The storage server is unavailable' }, { status: 502 });
}
