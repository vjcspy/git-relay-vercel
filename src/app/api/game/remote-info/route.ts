import { NextRequest } from 'next/server';

import { forwardToServer } from '@/lib/forward';

export async function GET(req: NextRequest) {
  return forwardToServer(req, `/api/gr/remote-info${req.nextUrl.search}`, 'GET');
}
