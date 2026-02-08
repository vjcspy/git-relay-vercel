import { type NextRequest } from 'next/server';

import { forwardToServer } from '@/lib/forward';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;
  return forwardToServer(req, `/api/patches/status/${sessionId}`, 'GET');
}
