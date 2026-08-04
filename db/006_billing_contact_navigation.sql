ALTER TABLE app_users
  ADD COLUMN IF NOT EXISTS plan_code TEXT NOT NULL DEFAULT 'free';

ALTER TABLE app_users
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

ALTER TABLE app_users
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

ALTER TABLE app_users
  ADD COLUMN IF NOT EXISTS subscription_status TEXT;

ALTER TABLE app_users
  ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMPTZ;

ALTER TABLE app_users
  ADD COLUMN IF NOT EXISTS subscription_cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'app_users_plan_code_check'
  ) THEN
    ALTER TABLE app_users
      ADD CONSTRAINT app_users_plan_code_check
      CHECK (plan_code IN ('free', 'pro'));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_app_users_stripe_customer_unique
  ON app_users(stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_app_users_stripe_subscription_unique
  ON app_users(stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS billing_webhook_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  ip_hash TEXT,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_created
  ON contact_messages(created_at DESC);

CREATE TABLE IF NOT EXISTS app_migration_markers (
  marker_key TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM app_migration_markers WHERE marker_key = 'existing_accounts_beta_pro_v1'
  ) THEN
    UPDATE app_users
    SET plan_code = 'pro',
        subscription_status = COALESCE(subscription_status, 'beta')
    WHERE plan_code = 'free';

    INSERT INTO app_migration_markers (marker_key)
    VALUES ('existing_accounts_beta_pro_v1');
  END IF;
END $$;
