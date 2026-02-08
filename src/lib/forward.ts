import { NextRequest, NextResponse } from 'next/server';

const SERVER_URL = process.env.SERVER_URL!;
const SERVER_KEY = process.env.SERVER_API_KEY!;
const RELAY_KEY = process.env.RELAY_API_KEY!;

/**
 * Shared forward-to-server logic.
 * All relay routes follow the same pattern:
 * 1. Validate API key from request header (X-Relay-Key)
 * 2. Forward request body to server (add X-Server-Key header)
 * 3. Return server response as-is
 */
export async function forwardToServer(
  req: NextRequest,
  serverPath: string,
  method: 'GET' | 'POST' = 'POST',
): Promise<NextResponse> {
  // 1. Auth — validate relay key from CLI
  if (req.headers.get('X-Relay-Key') !== RELAY_KEY) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  // 2. Forward to server
  const fetchOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Server-Key': SERVER_KEY,
    },
  };

  if (method === 'POST') {
    fetchOptions.body = await req.text();
  }

  try {
    const res = await fetch(`${SERVER_URL}${serverPath}`, fetchOptions);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: 'RELAY_ERROR', message: `Failed to reach server: ${message}` },
      { status: 502 },
    );
  }
}
