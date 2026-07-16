import { NextRequest, NextResponse } from 'next/server';
import { authorizeFileRequest } from '@/lib/file-route';
import { forwardFileJson } from '@/lib/forward';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const denied = authorizeFileRequest(req);
  if (denied) return denied;
  const query = new URLSearchParams();
  const limit = req.nextUrl.searchParams.get('limit');
  const cursor = req.nextUrl.searchParams.get('cursor');
  if (limit) query.set('limit', limit);
  if (cursor) query.set('cursor', cursor);
  return forwardFileJson(req, `/api/file${query.size ? `?${query}` : ''}`, 'GET');
}
