import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/file-auth';
import { authorizeFileRequest } from '@/lib/file-route';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const denied = authorizeFileRequest(req, true);
  if (denied) return denied;
  const response = NextResponse.json({ success: true });
  clearSessionCookie(response);
  return response;
}
