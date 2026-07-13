import { NextRequest, NextResponse } from 'next/server';
import { authorizeFileRequest } from '@/lib/file-route';
import { forwardFileJson } from '@/lib/forward';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const denied = authorizeFileRequest(req, true);
  return denied || forwardFileJson(req, '/api/data/complete', 'POST');
}
