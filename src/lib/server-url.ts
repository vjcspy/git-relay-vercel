const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

export function getValidatedServerUrl(): string {
  const raw = process.env.SERVER_URL;
  if (!raw) throw new Error('SERVER_URL is not configured');
  const url = new URL(raw);
  const loopbackDevelopment =
    process.env.NODE_ENV !== 'production' &&
    url.protocol === 'http:' &&
    LOOPBACK_HOSTS.has(url.hostname);
  const insecureHttpOptIn =
    url.protocol === 'http:' &&
    process.env.FILES_ALLOW_INSECURE_SERVER_URL === 'true';
  if (url.protocol !== 'https:' && !loopbackDevelopment && !insecureHttpOptIn) {
    throw new Error(
      'SERVER_URL must use HTTPS (set FILES_ALLOW_INSECURE_SERVER_URL=true to explicitly allow a plaintext HTTP origin)',
    );
  }
  url.pathname = url.pathname.replace(/\/$/, '');
  return url.toString().replace(/\/$/, '');
}
