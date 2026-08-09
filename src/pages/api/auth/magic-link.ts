import type { APIRoute } from 'astro';
import { promises as dns } from 'node:dns';
import { isLocalHostname } from '../../../lib/hosts';
import { recordPrototypePilotConsent } from '../../../lib/prototypePilotConsent';
import { prototypePilotPolicyUrl, prototypePilotPolicyVersion } from '../../../lib/prototypePilotPolicy';
import { getPublicSiteOrigin, trailblazerFormPath } from '../../../lib/site';
import { createSupabaseServerClient, isSupabaseConfigured } from '../../../lib/supabaseServer';

export const prerender = false;

const mxLookupTimeoutMs = 5_000;
const allowSelfSignup = true;

const freeEmailDomains = new Set([
  'aol.com',
  'fastmail.com',
  'gmail.com',
  'googlemail.com',
  'gmx.co.uk',
  'gmx.com',
  'hey.com',
  'hotmail.co.uk',
  'hotmail.com',
  'icloud.com',
  'live.co.uk',
  'live.com',
  'mac.com',
  'mail.com',
  'me.com',
  'msn.com',
  'outlook.com',
  'pm.me',
  'proton.me',
  'protonmail.com',
  'qq.com',
  'tutanota.com',
  'yahoo.co.uk',
  'yahoo.com',
  'yandex.com',
  'yandex.ru',
  'zoho.com',
  '163.com',
  '126.com',
]);

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getEmailDomain(email: string) {
  return email.split('@').pop()?.toLowerCase() || '';
}

async function hasMxRecords(email: string) {
  const domain = getEmailDomain(email);
  if (!domain) return false;

  try {
    const records = await Promise.race([
      dns.resolveMx(domain),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('mx_timeout')), mxLookupTimeoutMs);
      }),
    ]);
    return records.length > 0;
  } catch {
    return false;
  }
}

function isLocalDevelopmentRequest(request: Request) {
  return isLocalHostname(new URL(request.url).hostname);
}

export const POST: APIRoute = async ({ request, cookies }) => {
  if (!isSupabaseConfigured) {
    return new Response(JSON.stringify({ error: 'Supabase is not configured.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }

  try {
    const body = await request.json();
    const email = String(body?.email || '').trim().toLowerCase();
    const nextUrl = String(body?.nextUrl || trailblazerFormPath).trim();
    const shouldCreateUser = allowSelfSignup && Boolean(body?.shouldCreateUser);
    const consentAccepted = Boolean(body?.prototypePilotConsentAccepted);
    const submittedPolicyUrl = String(body?.prototypePilotPolicyUrl || '').trim();
    const submittedPolicyVersion = String(body?.prototypePilotPolicyVersion || '').trim();
    const engagement = String(body?.prototypePilotEngagement || '').trim();

    if (!isValidEmail(email)) {
      return new Response(JSON.stringify({ error: 'Enter a valid email address.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      });
    }

    if (freeEmailDomains.has(getEmailDomain(email))) {
      return new Response(JSON.stringify({ error: 'Use your work email address.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      });
    }

    if (
      !consentAccepted ||
      submittedPolicyUrl !== prototypePilotPolicyUrl ||
      submittedPolicyVersion !== prototypePilotPolicyVersion
    ) {
      return new Response(
        JSON.stringify({ error: 'Please acknowledge the prototype and pilot terms before we send the magic link.' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
        },
      );
    }

    const isLocalDevelopment = isLocalDevelopmentRequest(request);
    if (!isLocalDevelopment && !(await hasMxRecords(email))) {
      return new Response(JSON.stringify({ error: 'That email domain cannot receive mail.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      });
    }

    const consent = await recordPrototypePilotConsent({
      email,
      request,
      engagement,
      flow: 'trailblazer-magic-link',
      nextUrl,
    });

    if (!consent.ok) {
      return new Response(JSON.stringify({ error: consent.error }), {
        status: consent.status,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      });
    }

    const redirectTo = new URL('/auth/callback', getPublicSiteOrigin(request));
    redirectTo.searchParams.set('next', nextUrl.startsWith('/') ? nextUrl : trailblazerFormPath);

    const supabase = createSupabaseServerClient({ request, cookies });
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo.toString(),
        shouldCreateUser,
      },
    });

    if (error) {
      return new Response(
        JSON.stringify({
          error: error.message || 'Failed to send magic link.',
          code: error.code || '',
        }),
        {
          status: error.status || 400,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
        },
      );
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: getErrorMessage(error, 'Failed to send magic link.') }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }
};
