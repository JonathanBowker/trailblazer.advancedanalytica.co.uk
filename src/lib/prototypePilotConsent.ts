import { createSupabaseAdminClient, isSupabaseAdminConfigured } from './supabaseAdmin';
import {
  defaultPrototypePilotEngagement,
  prototypePilotPolicyUrl,
  prototypePilotPolicyVersion,
} from './prototypePilotPolicy';

const maxStoredConsentEvents = 20;

type ConsentInput = {
  email: string;
  request: Request;
  engagement?: string;
  flow?: string;
  nextUrl?: string;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function cleanMetadataText(value: unknown, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

async function findUserByEmail(email: string) {
  const admin = createSupabaseAdminClient();
  const target = normalizeEmail(email);
  let page = 1;
  const perPage = 200;

  while (page <= 25) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const user = data.users.find((candidate) => normalizeEmail(candidate.email || '') === target);
    if (user) return user;
    if (data.users.length < perPage) break;
    page += 1;
  }

  return null;
}

export async function recordPrototypePilotConsent({
  email,
  request,
  engagement,
  flow = 'magic-link',
  nextUrl,
}: ConsentInput) {
  if (!isSupabaseAdminConfigured) {
    throw new Error('Supabase service-role admin client is not configured.');
  }

  const user = await findUserByEmail(email);
  if (!user) {
    return {
      ok: false,
      error: 'This email is not yet provisioned for Trailblazer access.',
      status: 403,
    };
  }

  const now = new Date().toISOString();
  const url = new URL(request.url);
  const userMetadata = user.user_metadata || {};
  const existingEvents = Array.isArray(userMetadata.prototype_pilot_consents)
    ? userMetadata.prototype_pilot_consents
    : [];

  const event = {
    accepted: true,
    accepted_at: now,
    policy_url: prototypePilotPolicyUrl,
    policy_version: prototypePilotPolicyVersion,
    engagement: cleanMetadataText(engagement, defaultPrototypePilotEngagement),
    flow,
    source_host: url.host,
    next_url: cleanMetadataText(nextUrl),
  };

  const admin = createSupabaseAdminClient();
  const { error } = await admin.auth.admin.updateUserById(user.id, {
    user_metadata: {
      ...userMetadata,
      prototype_pilot_consent: event,
      prototype_pilot_consents: [...existingEvents, event].slice(-maxStoredConsentEvents),
    },
  });

  if (error) throw error;

  return { ok: true, userId: user.id };
}
