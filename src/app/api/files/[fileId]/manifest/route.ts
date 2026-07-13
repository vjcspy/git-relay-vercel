import { NextRequest, NextResponse } from 'next/server';
import { authorizeFileRequest } from '@/lib/file-route';
import { forwardFileJson } from '@/lib/forward';

export async function GET(req: NextRequest, context: { params: Promise<{ fileId: string }> }): Promise<NextResponse> {
  const denied = authorizeFileRequest(req);
  if (denied) return denied;
  const { fileId } = await context.params;
  return forwardFileJson(req, `/api/file/${encodeURIComponent(fileId)}/manifest`, 'GET');
}
