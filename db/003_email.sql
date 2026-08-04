CREATE TABLE IF NOT EXISTS auth_email_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL CHECK (purpose IN ('verify_email', 'reset_password')),
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_email_tokens_lookup
  ON auth_email_tokens(token_hash, purpose, expires_at)
  WHERE used_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_auth_email_tokens_user
  ON auth_email_tokens(user_id, purpose, created_at DESC);

CREATE TABLE IF NOT EXISTS deadline_email_reminders (
  deadline_id UUID NOT NULL REFERENCES case_deadlines(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('soon', 'overdue')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  PRIMARY KEY (deadline_id, reminder_type)
);

ALTER TABLE generated_letters
  ADD COLUMN IF NOT EXISTS recipient_email TEXT;

ALTER TABLE generated_letters
  ADD COLUMN IF NOT EXISTS last_sent_at TIMESTAMPTZ;
