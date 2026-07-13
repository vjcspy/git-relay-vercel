import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { NextRequest, NextResponse } from 'next/server';
import { getValidatedServerUrl } from './server-url';

export const FILE_SESSION_COOKIE = '__Host-file-session';
const SESSION_VERSION = 'v1';
const SESSION_TTL_SECONDS = 60 * 60 * 8;

export function deploymentReadinessError(): string | null {
  if (!process.env.FILES_PASSWORD || process.env.FILES_PASSWORD.length < 24) {
    return 'FILES_PASSWORD must be configured with at least 24 characters';
  }
  if (!process.env.FILES_SESSION_SECRET || process.env.FILES_SESSION_SECRET.length < 32) {
    return 'FILES_SESSION_SECRET must be configured with at least 32 characters';
  }
  if (process.env.NODE_ENV === 'production' && process.env.FILES_LOGIN_WAF_CONFIRMED !== 'true') {
    return 'The required Vercel WAF rate-limit rule has not been confirmed';
  }
  if (!process.env.SERVER_API_KEY) return 'SERVER_API_KEY is not configured';
  if (!process.env.FILE_TRANSPORT_KEY_ID || !process.env.FILE_TRANSPORT_PUBLIC_KEY_PEM) {
    return 'Browser transport-v2 public key configuration is missing';
  }
  try {
    getValidatedServerUrl();
  } catch (error) {
    return error instanceof Error ? error.message : 'SERVER_URL is invalid';
  }
  return null;
}

export function passwordMatches(candidate: unknown): boolean {
  if (typeof candidate !== 'string' || !process.env.FILES_PASSWORD) return false;
  const expected = Buffer.from(process.env.FILES_PASSWORD, 'utf8');
  const supplied = Buffer.from(candidate, 'utf8');
  const comparable = supplied.length === expected.length ? supplied : Buffer.alloc(expected.length);
  const matches = timingSafeEqual(expected, comparable);
  return matches && supplied.length === expected.length;
}

export function createSessionToken(now = Date.now()): string {
  const expiresAt = Math.floor(now / 1000) + SESSION_TTL_SECONDS;
  const payload = `${SESSION_VERSION}.${expiresAt}.${randomBytes(18).toString('base64url')}`;
  return `${payload}.${sign(payload)}`;
}

export function hasValidFileSession(req: NextRequest, now = Date.now()): boolean {
  const token = req.cookies.get(FILE_SESSION_COOKIE)?.value;
  if (!token || deploymentReadinessError()) return false;
  const parts = token.split('.');
  if (parts.length !== 4 || parts[0] !== SESSION_VERSION) return false;
  const payload = parts.slice(0, 3).join('.');
  const expected = Buffer.from(sign(payload));
  const supplied = Buffer.from(parts[3]);
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return false;
  const expiresAt = Number(parts[1]);
  return Number.isSafeInteger(expiresAt) && expiresAt > Math.floor(now / 1000);
}

export function isSameOriginMutation(req: NextRequest): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return false;
  try {
    return new URL(origin).origin === req.nextUrl.origin;
  } catch {
    return false;
  }
}

export function setSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set(FILE_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(FILE_SESSION_COOKIE, '', {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });
}

function sign(payload: string): string {
  return createHmac('sha256', process.env.FILES_SESSION_SECRET!).update(payload).digest('base64url');
}
