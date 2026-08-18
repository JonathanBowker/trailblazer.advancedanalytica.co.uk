import validGuidList from '../data/trailblazer-valid-guids.json';

export const trailblazerEmbedFormPath = '/forms/brand-readiness-assessment/embed';
export const trailblazerStandardFormPath = '/forms/brand-readiness-assessment';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const validGuidSet = new Set((validGuidList as string[]).map((guid) => guid.toLowerCase()));

export type TrailblazerEmbedSession = {
  isValid: boolean;
  uid: string;
  token: string;
  name: string;
  email: string;
  company: string;
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

export function getTrailblazerEmbedSession(source: URLSearchParams | FormData): TrailblazerEmbedSession {
  const uid = cleanText(readParam(source, 'uid'), 128);
  const token = normalizeToken(readParam(source, 'token'));
  const email = cleanEmail(readParam(source, 'email'));
  const name = cleanText(readParam(source, 'name'), 120) || (email ? email.split('@')[0] : uid);
  const company = cleanText(readParam(source, 'company'), 120);

  return {
    isValid: Boolean(uid && token && validGuidSet.has(token)),
    uid,
    token,
    name,
    email,
    company,
  };
}
