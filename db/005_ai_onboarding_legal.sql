ALTER TABLE app_users
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

ALTER TABLE app_users
  ADD COLUMN IF NOT EXISTS onboarding_dismissed_at TIMESTAMPTZ;

ALTER TABLE app_users
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;

ALTER TABLE app_users
  ADD COLUMN IF NOT EXISTS terms_version TEXT;

ALTER TABLE app_users
  ADD COLUMN IF NOT EXISTS privacy_acknowledged_at TIMESTAMPTZ;

ALTER TABLE generated_letters
  ADD COLUMN IF NOT EXISTS generation_mode TEXT NOT NULL DEFAULT 'template';

ALTER TABLE generated_letters
  ADD COLUMN IF NOT EXISTS ai_response_id TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'generated_letters_generation_mode_check'
  ) THEN
    ALTER TABLE generated_letters
      ADD CONSTRAINT generated_letters_generation_mode_check
      CHECK (generation_mode IN ('template', 'manual', 'ai', 'duplicate'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS document_ai_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES case_documents(id) ON DELETE CASCADE,
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'openai',
  model_name TEXT NOT NULL,
  response_id TEXT,
  consent_at TIMESTAMPTZ NOT NULL,
  result_json JSONB NOT NULL,
  applied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_document_ai_analyses_document_created
  ON document_ai_analyses(document_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_document_ai_analyses_case_created
  ON document_ai_analyses(case_id, created_at DESC);

CREATE TABLE IF NOT EXISTS ai_usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  document_id UUID REFERENCES case_documents(id) ON DELETE SET NULL,
  operation TEXT NOT NULL CHECK (operation IN ('document_analysis', 'letter_draft')),
  provider TEXT NOT NULL DEFAULT 'openai',
  model_name TEXT NOT NULL,
  response_id TEXT,
  consent_at TIMESTAMPTZ NOT NULL,
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_events_user_created
  ON ai_usage_events(user_id, created_at DESC);
