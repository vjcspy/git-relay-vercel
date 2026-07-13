export function getValidatedServerUrl(): string {
  const raw = process.env.SERVER_URL;
  if (!raw) throw new Error('SERVER_URL is not configured');
  const url = new URL(raw);
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('SERVER_URL must use HTTP or HTTPS');
  }
  url.pathname = url.pathname.replace(/\/$/, '');
  return url.toString().replace(/\/$/, '');
}
