const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

export function getValidatedServerUrl(): string {
  const raw = process.env.SERVER_URL;
  if (!raw) throw new Error('SERVER_URL is not configured');
  const url = new URL(raw);
  const loopbackDevelopment =
    process.env.NODE_ENV !== 'production' &&
    url.protocol === 'http:' &&
    LOOPBACK_HOSTS.has(url.hostname);
  if (url.protocol !== 'https:' && !loopbackDevelopment) {
    throw new Error('SERVER_URL must use HTTPS (plain HTTP is allowed only for loopback development)');
  }
  url.pathname = url.pathname.replace(/\/$/, '');
  return url.toString().replace(/\/$/, '');
}
