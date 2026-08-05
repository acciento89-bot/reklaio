ALTER TABLE app_users
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS admin_note TEXT;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS ai_document_limit_override INTEGER;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS ai_letter_limit_override INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='app_users_role_check') THEN
    ALTER TABLE app_users ADD CONSTRAINT app_users_role_check CHECK(role IN ('user','admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='app_users_ai_document_limit_override_check') THEN
    ALTER TABLE app_users ADD CONSTRAINT app_users_ai_document_limit_override_check CHECK(ai_document_limit_override IS NULL OR ai_document_limit_override>=-1);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='app_users_ai_letter_limit_override_check') THEN
    ALTER TABLE app_users ADD CONSTRAINT app_users_ai_letter_limit_override_check CHECK(ai_letter_limit_override IS NULL OR ai_letter_limit_override>=-1);
  END IF;
END $$;

ALTER TABLE ai_usage_events ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'completed';
ALTER TABLE ai_usage_events ADD COLUMN IF NOT EXISTS error_code TEXT;
ALTER TABLE ai_usage_events ADD COLUMN IF NOT EXISTS input_bytes BIGINT;
ALTER TABLE ai_usage_events ADD COLUMN IF NOT EXISTS estimated_cost_micros BIGINT;
ALTER TABLE ai_usage_events ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='ai_usage_events_status_check') THEN
    ALTER TABLE ai_usage_events ADD CONSTRAINT ai_usage_events_status_check CHECK(status IN ('reserved','completed','failed'));
  END IF;
END $$;
UPDATE ai_usage_events SET completed_at=created_at WHERE status='completed' AND completed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_ai_usage_events_quota ON ai_usage_events(user_id,operation,created_at DESC) WHERE status IN ('reserved','completed');

ALTER TABLE billing_webhook_events ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'processed';
ALTER TABLE billing_webhook_events ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE billing_webhook_events ADD COLUMN IF NOT EXISTS payload_summary JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'open';
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS resolved_by UUID REFERENCES app_users(id) ON DELETE SET NULL;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='contact_messages_status_check') THEN
    ALTER TABLE contact_messages ADD CONSTRAINT contact_messages_status_check CHECK(status IN ('open','resolved','spam'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS billing_checkout_intents(
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
 stripe_session_id TEXT UNIQUE,stripe_price_id TEXT NOT NULL,displayed_price TEXT NOT NULL,
 terms_version TEXT NOT NULL,privacy_version TEXT NOT NULL,withdrawal_version TEXT NOT NULL,
 terms_accepted_at TIMESTAMPTZ NOT NULL,withdrawal_acknowledged_at TIMESTAMPTZ NOT NULL,
 immediate_start_requested_at TIMESTAMPTZ,status TEXT NOT NULL DEFAULT 'created',completed_at TIMESTAMPTZ,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='billing_checkout_intents_status_check') THEN
  ALTER TABLE billing_checkout_intents ADD CONSTRAINT billing_checkout_intents_status_check CHECK(status IN ('created','redirected','completed','cancelled','failed'));
 END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_billing_checkout_intents_user_created ON billing_checkout_intents(user_id,created_at DESC);

CREATE TABLE IF NOT EXISTS withdrawal_requests(
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
 name TEXT NOT NULL,email TEXT NOT NULL,contract_reference TEXT,declaration TEXT NOT NULL,
 submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),confirmed_at TIMESTAMPTZ,processed_at TIMESTAMPTZ,
 processed_by UUID REFERENCES app_users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_submitted ON withdrawal_requests(submitted_at DESC);

CREATE TABLE IF NOT EXISTS admin_audit_events(
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),admin_user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
 target_user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,action TEXT NOT NULL,
 details_json JSONB NOT NULL DEFAULT '{}'::jsonb,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_admin_audit_events_created ON admin_audit_events(created_at DESC);

CREATE TABLE IF NOT EXISTS rate_limit_buckets(bucket_key TEXT PRIMARY KEY,window_started_at TIMESTAMPTZ NOT NULL,request_count INTEGER NOT NULL DEFAULT 0,updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS system_incidents(id UUID PRIMARY KEY DEFAULT gen_random_uuid(),source TEXT NOT NULL,severity TEXT NOT NULL DEFAULT 'warning',title TEXT NOT NULL,details TEXT,resolved_at TIMESTAMPTZ,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='system_incidents_severity_check') THEN
  ALTER TABLE system_incidents ADD CONSTRAINT system_incidents_severity_check CHECK(severity IN ('info','warning','critical'));
 END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_system_incidents_open_created ON system_incidents(resolved_at,created_at DESC);

CREATE TABLE IF NOT EXISTS backup_requests(id UUID PRIMARY KEY DEFAULT gen_random_uuid(),requested_by UUID REFERENCES app_users(id) ON DELETE SET NULL,status TEXT NOT NULL DEFAULT 'pending',started_at TIMESTAMPTZ,completed_at TIMESTAMPTZ,error_message TEXT,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='backup_requests_status_check') THEN
  ALTER TABLE backup_requests ADD CONSTRAINT backup_requests_status_check CHECK(status IN ('pending','running','completed','failed'));
 END IF;
END $$;
CREATE TABLE IF NOT EXISTS backup_runs(id UUID PRIMARY KEY DEFAULT gen_random_uuid(),request_id UUID REFERENCES backup_requests(id) ON DELETE SET NULL,database_file TEXT,uploads_file TEXT,database_bytes BIGINT,uploads_bytes BIGINT,status TEXT NOT NULL,error_message TEXT,started_at TIMESTAMPTZ NOT NULL,completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='backup_runs_status_check') THEN
  ALTER TABLE backup_runs ADD CONSTRAINT backup_runs_status_check CHECK(status IN ('completed','failed'));
 END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_backup_runs_completed ON backup_runs(completed_at DESC);
