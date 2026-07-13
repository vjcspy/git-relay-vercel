const encoder = new TextEncoder();
const MAGIC = encoder.encode('AWR2');
const VERSION = 2;
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

export interface BrowserTransportConfig {
  keyId: string;
  publicKeyPem: string;
}

export async function assertX25519Support(config: BrowserTransportConfig): Promise<void> {
  await importServerPublicKey(config.publicKeyPem);
  const pair = await crypto.subtle.generateKey({ name: 'X25519' }, true, ['deriveBits']) as CryptoKeyPair;
  await crypto.subtle.exportKey('spki', pair.publicKey);
}

export async function encryptPayloadV2(
  metadata: Record<string, unknown>,
  config: BrowserTransportConfig,
  binaryData?: ArrayBuffer,
): Promise<string> {
  const keyId = config.keyId.trim();
  const kid = encoder.encode(keyId);
  if (!keyId || kid.length > 255) throw new Error('Invalid transport key id');

  const serverPublicKeyDer = pemToDer(config.publicKeyPem);
  const serverPublicKey = await importServerPublicKey(config.publicKeyPem);
  const ephemeral = await crypto.subtle.generateKey({ name: 'X25519' }, true, ['deriveBits']) as CryptoKeyPair;
  const ephemeralPublicKeyDer = new Uint8Array(await crypto.subtle.exportKey('spki', ephemeral.publicKey));
  if (ephemeralPublicKeyDer.length > 65535) throw new Error('Ephemeral public key is too large');

  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const sharedSecret = await crypto.subtle.deriveBits(
    { name: 'X25519', public: serverPublicKey },
    ephemeral.privateKey,
    256,
  );
  const info = concatBytes(
    encoder.encode('relay-transport-v2'),
    new Uint8Array([0]), kid,
    new Uint8Array([0]), ephemeralPublicKeyDer,
    new Uint8Array([0]), serverPublicKeyDer,
  );
  const hkdfKey = await crypto.subtle.importKey('raw', sharedSecret, 'HKDF', false, ['deriveKey']);
  const contentKey = await crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: toArrayBuffer(iv), info: toArrayBuffer(info) },
    hkdfKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt'],
  );

  const header = new Uint8Array(4 + 1 + 1 + 2 + IV_LENGTH + kid.length + ephemeralPublicKeyDer.length);
  let offset = 0;
  header.set(MAGIC, offset); offset += 4;
  header[offset++] = VERSION;
  header[offset++] = kid.length;
  new DataView(header.buffer).setUint16(offset, ephemeralPublicKeyDer.length, false); offset += 2;
  header.set(iv, offset); offset += IV_LENGTH;
  header.set(kid, offset); offset += kid.length;
  header.set(ephemeralPublicKeyDer, offset);

  const enrichedMetadata = {
    ...metadata,
    timestamp: Date.now(),
    nonce: base64Url(crypto.getRandomValues(new Uint8Array(18))),
  };
  const metadataBytes = encoder.encode(JSON.stringify(enrichedMetadata));
  const lengthPrefix = new Uint8Array(4);
  new DataView(lengthPrefix.buffer).setUint32(0, metadataBytes.length, false);
  const plaintext = concatBytes(
    lengthPrefix,
    metadataBytes,
    binaryData ? new Uint8Array(binaryData) : new Uint8Array(),
  );
  const encrypted = new Uint8Array(await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: toArrayBuffer(iv), additionalData: toArrayBuffer(header), tagLength: 128 },
    contentKey,
    toArrayBuffer(plaintext),
  ));
  const ciphertext = encrypted.subarray(0, encrypted.length - TAG_LENGTH);
  const authTag = encrypted.subarray(encrypted.length - TAG_LENGTH);
  return base64(concatBytes(header, authTag, ciphertext));
}

export async function sha256Hex(data: ArrayBuffer): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', data));
  return [...digest].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function importServerPublicKey(pem: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('spki', toArrayBuffer(pemToDer(pem)), { name: 'X25519' }, false, []);
}

function pemToDer(pem: string): Uint8Array {
  const raw = pem.replace(/\\n/g, '\n').replace(/-----BEGIN PUBLIC KEY-----|-----END PUBLIC KEY-----|\s/g, '');
  if (!raw) throw new Error('Transport public key is not configured');
  const binary = atob(raw);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function concatBytes(...parts: Uint8Array[]): Uint8Array {
  const result = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let offset = 0;
  for (const part of parts) { result.set(part, offset); offset += part.length; }
  return result;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.length);
  copy.set(bytes);
  return copy.buffer;
}

function base64(bytes: Uint8Array): string {
  let binary = '';
  const stride = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += stride) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + stride));
  }
  return btoa(binary);
}

function base64Url(bytes: Uint8Array): string {
  return base64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
