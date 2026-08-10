const localHostnames = new Set(['localhost', '127.0.0.1', '127.0.0.1.nip.io', '::1', '0.0.0.0']);

export function normalizeHostname(rawHost: string) {
  return rawHost.trim().toLowerCase().replace(/:\d+$/, '');
}

export function isLocalHostname(rawHost: string) {
  const hostname = normalizeHostname(rawHost);
  return localHostnames.has(hostname) || hostname.endsWith('.localhost');
}
