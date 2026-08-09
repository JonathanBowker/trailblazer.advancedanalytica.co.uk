import { createServerClient, parseCookieHeader } from '@supabase/ssr';
import type { AstroCookies } from 'astro';
import type { CookieOptionsWithName } from '@supabase/ssr';

function resolveEnvValue(publicValue: string | undefined, fallbackValue: string | undefined) {
  const value = String(publicValue || '').trim();
  if (value && !value.startsWith('${')) return value;
  return String(fallbackValue || '').trim();
}

const supabaseUrl = resolveEnvValue(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.SUPABASE_URL || process.env.SUPABASE_URL,
);
const supabaseAnonKey = resolveEnvValue(
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
  import.meta.env.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY,
);

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export function createSupabaseServerClient({
  request,
  cookies,
}: {
  request: Request;
  cookies: AstroCookies;
}) {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase is not configured');
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return parseCookieHeader(request.headers.get('Cookie') ?? '').flatMap(({ name, value }) =>
          value ? [{ name, value }] : [],
        );
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptionsWithName }[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookies.set(name, value, options);
        });
      },
    },
  });
}
