CREATE TABLE IF NOT EXISTS case_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 2 AND 180),
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'completed')),
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'assistant', 'provider_response', 'email')),
  due_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_case_tasks_case_status_due
  ON case_tasks(case_id, status, due_at, created_at DESC);

CREATE TABLE IF NOT EXISTS provider_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  response_received_at TIMESTAMPTZ NOT NULL,
  outcome TEXT NOT NULL CHECK (outcome IN ('accepted', 'rejected', 'question', 'partial_offer', 'other')),
  promised_amount_cents BIGINT CHECK (promised_amount_cents IS NULL OR promised_amount_cents >= 0),
  promised_due_at TIMESTAMPTZ,
  summary TEXT NOT NULL CHECK (char_length(summary) BETWEEN 2 AND 5000),
  document_id UUID REFERENCES case_documents(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_provider_responses_case_received
  ON provider_responses(case_id, response_received_at DESC, created_at DESC);

CREATE TABLE IF NOT EXISTS case_escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  stage TEXT NOT NULL CHECK (stage IN ('reminder', 'final_deadline', 'payment_provider', 'mediation', 'consumer_center', 'closed')),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_case_escalations_case_created
  ON case_escalations(case_id, created_at DESC);

CREATE TABLE IF NOT EXISTS letter_email_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  letter_id UUID NOT NULL REFERENCES generated_letters(id) ON DELETE CASCADE,
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  attachment_count INTEGER NOT NULL DEFAULT 0 CHECK (attachment_count >= 0),
  reply_deadline_id UUID REFERENCES case_deadlines(id) ON DELETE SET NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_letter_email_deliveries_letter_sent
  ON letter_email_deliveries(letter_id, sent_at DESC);

CREATE TABLE IF NOT EXISTS letter_email_delivery_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID NOT NULL REFERENCES letter_email_deliveries(id) ON DELETE CASCADE,
  document_id UUID REFERENCES case_documents(id) ON DELETE SET NULL,
  original_name TEXT NOT NULL,
  size_bytes BIGINT NOT NULL CHECK (size_bytes >= 0),
  UNIQUE (delivery_id, document_id)
);
