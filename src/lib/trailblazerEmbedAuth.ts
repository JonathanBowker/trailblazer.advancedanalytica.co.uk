import type { AstroCookies } from 'astro';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import validGuidListSeed from '../data/trailblazer-valid-guids.json';

export const trailblazerEmbedFormPath = '/forms/brand-readiness-assessment/embed';
export const trailblazerStandardFormPath = '/forms/brand-readiness-assessment';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const defaultRuntimeGuidFilePath = '/tmp/trailblazer-valid-guids.json';
const embedCookieName = 'trailblazer_embed_access';
const embedCookieMaxAgeSeconds = 60 * 60 * 8;
const initialValidGuidList = (validGuidListSeed as string[]).map((value) => value.toLowerCase());

type TrailblazerEmbedClaims = {
  uid: string;
  token: string;
  name: string;
  email: string;
  company: string;
};

export type TrailblazerEmbedSession = TrailblazerEmbedClaims & {
  isValid: boolean;
};

function cleanText(value: unknown, maxLength = 180) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, maxLength);
}

function cleanEmail(value: unknown) {
  const email = cleanText(value, 254).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
}

function readParam(source: URLSearchParams | FormData, key: string) {
  return source.get(key);
}

function normalizeToken(value: unknown) {
  const token = cleanText(value, 64).toLowerCase();
  return uuidPattern.test(token) ? token : '';
}

function toClaims(source: URLSearchParams | FormData): TrailblazerEmbedClaims {
  const uid = cleanText(readParam(source, 'uid'), 128);
  const token = normalizeToken(readParam(source, 'token'));
  const email = cleanEmail(readParam(source, 'email'));
  const name = cleanText(readParam(source, 'name'), 120) || (email ? email.split('@')[0] : uid);
  const company = cleanText(readParam(source, 'company'), 120);

  return {
    uid,
    token,
    name,
    email,
    company,
  };
}

function invalidSession(claims?: Partial<TrailblazerEmbedClaims>): TrailblazerEmbedSession {
  return {
    isValid: false,
    uid: claims?.uid || '',
    token: claims?.token || '',
    name: claims?.name || '',
    email: claims?.email || '',
    company: claims?.company || '',
  };
}

function getCookieSecret() {
  const env = import.meta.env as Record<string, string | undefined>;
  return (
    env.TRAILBLAZER_EMBED_COOKIE_SECRET ||
    process.env.TRAILBLAZER_EMBED_COOKIE_SECRET ||
    env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'trailblazer-dev-cookie-secret'
  );
}

function createSignature(payload: string) {
  return createHmac('sha256', getCookieSecret()).update(payload).digest('base64url');
}

function encodeCookieValue(claims: TrailblazerEmbedClaims) {
  const payload = Buffer.from(JSON.stringify(claims)).toString('base64url');
  return `${payload}.${createSignature(payload)}`;
}

function decodeCookieValue(value: string | undefined): TrailblazerEmbedClaims | null {
  if (!value || !value.includes('.')) return null;

  const [payload, providedSignature] = value.split('.', 2);
  const expectedSignature = createSignature(payload);

  const providedBuffer = Buffer.from(providedSignature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    providedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as Partial<TrailblazerEmbedClaims>;
    const claims = {
      uid: cleanText(parsed.uid, 128),
      token: normalizeToken(parsed.token),
      name: cleanText(parsed.name, 120),
      email: cleanEmail(parsed.email),
      company: cleanText(parsed.company, 120),
    };

    return claims.uid && claims.token ? claims : null;
  } catch {
    return null;
  }
}

async function readValidGuidList() {
  try {
    const raw = await readFile(getRuntimeGuidFilePath(), 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((value) => String(value).toLowerCase()) : [];
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code !== 'ENOENT') throw error;
    await writeValidGuidList(initialValidGuidList);
    return [...initialValidGuidList];
  }
}

async function writeValidGuidList(list: string[]) {
  const filePath = getRuntimeGuidFilePath();
  const tempPath = `${filePath}.tmp`;
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(tempPath, `${JSON.stringify(list)}\n`, 'utf8');
  await rename(tempPath, filePath);
}

function getRuntimeGuidFilePath() {
  const env = import.meta.env as Record<string, string | undefined>;
  return (
    env.TRAILBLAZER_VALID_GUIDS_FILE ||
    process.env.TRAILBLAZER_VALID_GUIDS_FILE ||
    defaultRuntimeGuidFilePath
  );
}

async function consumeValidGuid(token: string) {
  const validGuidList = await readValidGuidList();
  const tokenIndex = validGuidList.indexOf(token);
  if (tokenIndex === -1) return false;

  validGuidList.splice(tokenIndex, 1);
  await writeValidGuidList(validGuidList);
  return true;
}

function claimsMatch(left: TrailblazerEmbedClaims | null, right: TrailblazerEmbedClaims) {
  return Boolean(left && left.uid === right.uid && left.token === right.token);
}

export function getTrailblazerEmbedSession(source: URLSearchParams | FormData): TrailblazerEmbedSession {
  return invalidSession(toClaims(source));
}

export function readTrailblazerEmbedSessionCookie(cookies: AstroCookies): TrailblazerEmbedSession {
  const claims = decodeCookieValue(cookies.get(embedCookieName)?.value);
  return claims ? { isValid: true, ...claims } : invalidSession();
}

export function storeTrailblazerEmbedSessionCookie(
  cookies: AstroCookies,
  claims: TrailblazerEmbedClaims,
  requestUrl?: URL,
) {
  cookies.set(embedCookieName, encodeCookieValue(claims), {
    httpOnly: true,
    maxAge: embedCookieMaxAgeSeconds,
    path: trailblazerStandardFormPath,
    sameSite: 'lax',
    secure: requestUrl ? requestUrl.protocol === 'https:' : true,
  });
}

export function clearTrailblazerEmbedSessionCookie(cookies: AstroCookies, requestUrl?: URL) {
  cookies.delete(embedCookieName, {
    httpOnly: true,
    path: trailblazerStandardFormPath,
    sameSite: 'lax',
    secure: requestUrl ? requestUrl.protocol === 'https:' : true,
  });
}

export async function consumeTrailblazerEmbedSession(
  source: URLSearchParams | FormData,
  cookies: AstroCookies,
  requestUrl?: URL,
): Promise<TrailblazerEmbedSession> {
  const claims = toClaims(source);
  if (!claims.uid || !claims.token) return invalidSession(claims);

  const cookieSession = readTrailblazerEmbedSessionCookie(cookies);
  if (claimsMatch(cookieSession.isValid ? cookieSession : null, claims)) {
    return {
      isValid: true,
      uid: claims.uid,
      token: claims.token,
      name: cookieSession.name || claims.name,
      email: cookieSession.email || claims.email,
      company: cookieSession.company || claims.company,
    };
  }

  const consumed = await consumeValidGuid(claims.token);
  if (!consumed) return invalidSession(claims);

  storeTrailblazerEmbedSessionCookie(cookies, claims, requestUrl);
  return {
    isValid: true,
    ...claims,
  };
}

export function verifyTrailblazerEmbedSessionFromCookie(
  source: URLSearchParams | FormData,
  cookies: AstroCookies,
): TrailblazerEmbedSession {
  const claims = toClaims(source);
  if (!claims.uid || !claims.token) return invalidSession(claims);

  const cookieSession = readTrailblazerEmbedSessionCookie(cookies);
  if (!claimsMatch(cookieSession.isValid ? cookieSession : null, claims)) {
    return invalidSession(claims);
  }

  return {
    isValid: true,
    uid: claims.uid,
    token: claims.token,
    name: cookieSession.name || claims.name,
    email: cookieSession.email || claims.email,
    company: cookieSession.company || claims.company,
  };
}
