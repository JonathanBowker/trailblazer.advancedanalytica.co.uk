/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_SITE_URL?: string;
  readonly PUBLIC_SUPABASE_URL?: string;
  readonly PUBLIC_SUPABASE_ANON_KEY?: string;
  readonly SUPABASE_URL?: string;
  readonly SUPABASE_ANON_KEY?: string;
  readonly SUPABASE_SERVICE_ROLE_KEY?: string;
  readonly DISNEY_PIPELINE_INBOX_DIR?: string;
  readonly DISNEY_PIPELINE_INGEST_URL?: string;
  readonly DISNEY_IMAGE_MATCHER_URL?: string;
  readonly DISNEY_IMAGE_MATCHER_SCAN_URL?: string;
  readonly DISNEY_IMAGE_MATCHER_UPLOAD_URL?: string;
  readonly DISNEY_IMAGE_MATCHER_API_KEY?: string;
  readonly DISNEY_COMPLIANCE_API_URL?: string;
  readonly DISNEY_COMPLIANCE_AUDIT_URL?: string;
  readonly DISNEY_COMPLIANCE_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace App {
  interface Locals {
    user: import('@supabase/supabase-js').User | null;
  }
}
