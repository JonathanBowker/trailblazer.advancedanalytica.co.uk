const localHostnames = new Set(['localhost', '127.0.0.1', '::1', '0.0.0.0']);

export function normalizeHostname(rawHost: string) {
  return rawHost.trim().toLowerCase().replace(/:\d+$/, '');
}

export function isLocalHostname(rawHost: string) {
  return localHostnames.has(normalizeHostname(rawHost));
}
