import type { APIRoute } from 'astro';
import { trailblazerFormPath } from '../../../lib/site';
import { createSupabaseServerClient, isSupabaseConfigured } from '../../../lib/supabaseServer';

export const prerender = false;

const securityCodeLength = 6;

function safeNextPath(value: unknown) {
  const nextPath = String(value || trailblazerFormPath).trim();
  return nextPath.startsWith('/') && !nextPath.startsWith('//') ? nextPath : trailblazerFormPath;
}

function normalizeCode(value: unknown) {
  return String(value || '').replace(/\D/g, '');
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
    const token = normalizeCode(body?.code);
    const nextUrl = safeNextPath(body?.nextUrl);

    if (!email || token.length !== securityCodeLength) {
      return new Response(JSON.stringify({ error: 'Enter the security code from your email.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      });
    }

    const supabase = createSupabaseServerClient({ request, cookies });
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });

    if (error) {
      return new Response(JSON.stringify({ error: 'That security code could not be verified.' }), {
        status: error.status || 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      });
    }

    return new Response(JSON.stringify({ ok: true, nextUrl }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'That security code could not be verified.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }
};
