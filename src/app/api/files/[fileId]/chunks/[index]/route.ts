import { NextRequest, NextResponse } from 'next/server';
import { authorizeFileRequest } from '@/lib/file-route';
import { forwardFileBinary } from '@/lib/forward';

export async function GET(req: NextRequest, context: { params: Promise<{ fileId: string; index: string }> }): Promise<NextResponse> {
  const denied = authorizeFileRequest(req);
  if (denied) return denied;
  const { fileId, index } = await context.params;
  return forwardFileBinary(`/api/file/${encodeURIComponent(fileId)}/chunks/${encodeURIComponent(index)}`);
}
