import { NextRequest, NextResponse } from 'next/server';
import { authorizeFileRequest } from '@/lib/file-route';
import { forwardFileJson } from '@/lib/forward';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const denied = authorizeFileRequest(req);
  if (denied) return denied;
  return forwardFileJson(req, '/api/file/transport-config', 'GET');
}
