import { createClient } from '@supabase/supabase-js';

function resolveEnvValue(publicValue: string | undefined, fallbackValue: string | undefined) {
  const value = String(publicValue || '').trim();
  if (value && !value.startsWith('${')) return value;

  return String(fallbackValue || '').trim();
}

const supabaseUrl = resolveEnvValue(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.SUPABASE_URL || process.env.SUPABASE_URL,
);
const serviceRoleKey = String(import.meta.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

export const isSupabaseAdminConfigured = Boolean(supabaseUrl && serviceRoleKey);

export function createSupabaseAdminClient() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase admin client is not configured');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
