import { NextRequest, NextResponse } from 'next/server';
import {
  createSessionToken,
  deploymentReadinessError,
  isSameOriginMutation,
  passwordMatches,
  setSessionCookie,
} from '@/lib/file-auth';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const readiness = deploymentReadinessError();
  if (readiness) return NextResponse.json({ error: 'FILES_UNAVAILABLE', message: readiness }, { status: 503 });
  if (!isSameOriginMutation(req)) return NextResponse.json({ error: 'INVALID_ORIGIN' }, { status: 403 });
  let password: unknown;
  try {
    password = (await req.json() as { password?: unknown }).password;
  } catch {
    password = undefined;
  }
  if (!passwordMatches(password)) {
    console.warn('File login rejected');
    return NextResponse.json({ error: 'INVALID_CREDENTIALS' }, { status: 401 });
  }
  const response = NextResponse.json({ success: true });
  setSessionCookie(response, createSessionToken());
  console.info('File login accepted');
  return response;
}
