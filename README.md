# git-relay-vercel (Relay Edge Env Guide)

This repository is the public relay edge (Next.js on Vercel) for the git relay flow:

`CLI -> Vercel -> git-relay-server`

Important:
- Vercel does **not** decrypt relay payloads
- Vercel only authenticates and forwards opaque JSON (`{"gameData":"..."}`)
- Transport encryption v2 (`X25519` + AES-GCM) is handled by CLI and `git-relay-server`, not by Vercel

## Required Environment Variables

Defined in `workspaces/k/misc/git-relay-vercel/.env.example`:

### `RELAY_API_KEY`

Purpose:
- Authenticates incoming requests from CLI to Vercel relay
- Compared against request header `X-Relay-Key`

Used in:
- `src/lib/forward.ts` to reject unauthorized relay requests before forwarding

If incorrect/missing:
- CLI requests to Vercel relay return `401 UNAUTHORIZED`

### `SERVER_URL`

Purpose:
- Base URL of the private backend `git-relay-server`
- Vercel forwards relay API requests to this server

Used in:
- `src/lib/forward.ts` as upstream target: `${SERVER_URL}${serverPath}`

If incorrect/missing:
- Vercel relay returns `502 RELAY_ERROR` when it cannot reach backend server

Production file routes require an HTTPS origin by default. If the backend is intentionally exposed as a plaintext
HTTP IP address, set `FILES_ALLOW_INSECURE_SERVER_URL=true`. This is an explicit security downgrade: upload payloads
remain protected by AWR2, but unencrypted download bytes are visible on the Vercel-to-server network path.

### `SERVER_API_KEY`

Purpose:
- Authenticates Vercel relay to `git-relay-server`
- Sent as header `X-Server-Key` on forwarded requests

Used in:
- `src/lib/forward.ts` when forwarding to server

If incorrect/missing:
- Backend server returns `401 UNAUTHORIZED` for forwarded `/api/*` requests

## V2 Transport Encryption Note (No Additional Vercel Env Needed)

When migrating transport encryption to `v2`:
- CLI encrypts request payload into `gameData`
- Vercel forwards `gameData` unchanged
- `git-relay-server` decrypts and validates anti-replay metadata

Therefore, Vercel does **not** need these server-side crypto envs:
- `TRANSPORT_CRYPTO_MODE`
- `TRANSPORT_KEY_ID`
- `TRANSPORT_PRIVATE_KEY_PEM`
- `TRANSPORT_REPLAY_TTL_MS`
- `TRANSPORT_CLOCK_SKEW_MS`

These belong to `git-relay-server` only.

## Minimal Verification Checklist (Vercel)

1. `RELAY_API_KEY` matches CLI config (`X-Relay-Key`)
2. `SERVER_URL` points to reachable `git-relay-server`
3. `SERVER_API_KEY` matches server `API_KEY`
4. Relay endpoints return backend responses as expected (`/api/game/chunk`, `/api/game/chunk/complete`, `/api/game/gr`, `/api/game/chunk/status/:sessionId`)
