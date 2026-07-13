import { NextRequest, NextResponse } from 'next/server';
import { deploymentReadinessError, hasValidFileSession, isSameOriginMutation } from './file-auth';

export function authorizeFileRequest(req: NextRequest, mutation = false): NextResponse | null {
  const readiness = deploymentReadinessError();
  if (readiness) return NextResponse.json({ error: 'FILES_UNAVAILABLE', message: readiness }, { status: 503 });
  if (!hasValidFileSession(req)) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  if (mutation && !isSameOriginMutation(req)) return NextResponse.json({ error: 'INVALID_ORIGIN' }, { status: 403 });
  return null;
}
