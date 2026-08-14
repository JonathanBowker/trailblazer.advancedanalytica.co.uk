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
  readonly PREFECT_TRIGGER_API_URL?: string;
  readonly PREFECT_DISNEY_PROMPT_APPROVER_RUN_URL?: string;
  readonly PREFECT_DISNEY_COMPLIANCE_RUN_URL?: string;
  readonly PREFECT_TRIGGER_API_KEY?: string;
  readonly DISNEY_SUBMITTED_ARTIFACTS_BUCKET?: string;
  readonly DISNEY_SUBMITTED_ARTIFACTS_ENDPOINT_URL?: string;
  readonly DISNEY_SUBMITTED_ARTIFACTS_REGION?: string;
  readonly DISNEY_SUBMITTED_ARTIFACTS_ACCESS_KEY_ID?: string;
  readonly DISNEY_SUBMITTED_ARTIFACTS_SECRET_ACCESS_KEY?: string;
  readonly DISNEY_SUBMITTED_ARTIFACTS_KEY_PREFIX?: string;
  readonly PREFECT_DOCUMENT_SOURCE_BLOCK_NAME?: string;
  readonly TRAILBLAZER_RECEIVED_EMAIL_ENABLED?: string;
  readonly TRAILBLAZER_RECEIVED_EMAIL_RECIPIENTS?: string;
  readonly TRAILBLAZER_RECEIVED_EMAIL_CC?: string;
  readonly TRAILBLAZER_RECEIVED_EMAIL_FROM?: string;
  readonly TRAILBLAZER_RECEIVED_EMAIL_FROM_NAME?: string;
  readonly TRAILBLAZER_RECEIVED_EMAIL_AWS_REGION?: string;
  readonly TRAILBLAZER_RECEIVED_EMAIL_AWS_ACCESS_KEY_ID?: string;
  readonly TRAILBLAZER_RECEIVED_EMAIL_AWS_SECRET_ACCESS_KEY?: string;
  readonly TRAILBLAZER_RECEIVED_EMAIL_AWS_SESSION_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace App {
  interface Locals {
    user: import('@supabase/supabase-js').User | null;
  }
}

declare module 'pdfjs-dist/build/pdf.mjs';
