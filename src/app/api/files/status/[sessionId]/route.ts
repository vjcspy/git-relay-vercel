import { NextRequest, NextResponse } from 'next/server';
import { authorizeFileRequest } from '@/lib/file-route';
import { forwardFileJson } from '@/lib/forward';

export async function GET(req: NextRequest, context: { params: Promise<{ sessionId: string }> }): Promise<NextResponse> {
  const denied = authorizeFileRequest(req);
  if (denied) return denied;
  const { sessionId } = await context.params;
  return forwardFileJson(req, `/api/data/status/${encodeURIComponent(sessionId)}`, 'GET');
}
