import { isLocalHostname, normalizeHostname } from './hosts';

export const trailblazerHost = 'trailblazer.advancedanalytica.co.uk';
export const trailblazerFormPath = '/forms/brand-readiness-assessment';

const trustedHosts = new Set([
  trailblazerHost,
  'trailblazer.localhost',
  'localhost',
  '127.0.0.1',
  '127.0.0.1.nip.io',
  '0.0.0.0',
  '::1',
]);

export function getConfiguredSiteOrigin() {
  return String(import.meta.env.PUBLIC_SITE_URL || `https://${trailblazerHost}`)
    .trim()
    .replace(/\/+$/, '');
}

export function getRequestOrigin(request: Request) {
  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  const host = forwardedHost || request.headers.get('host')?.trim() || new URL(request.url).host;
  const protocol = forwardedProto || new URL(request.url).protocol.replace(':', '');
  return `${protocol}://${host.toLowerCase()}`;
}

export function getPublicSiteOrigin(request?: Request) {
  const configured = getConfiguredSiteOrigin();
  if (!request) return configured;

  const origin = getRequestOrigin(request);

  try {
    const parsed = new URL(origin);
    const hostname = normalizeHostname(parsed.hostname);
    if (trustedHosts.has(hostname) || isLocalHostname(hostname)) return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return configured;
  }

  return configured;
}
