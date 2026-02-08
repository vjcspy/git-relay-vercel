import { type NextRequest } from 'next/server';

import { forwardToServer } from '@/lib/forward';

export async function POST(req: NextRequest) {
  return forwardToServer(req, '/api/patches/complete', 'POST');
}
