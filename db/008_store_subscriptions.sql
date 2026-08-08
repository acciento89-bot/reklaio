ALTER TABLE app_users
  ADD COLUMN IF NOT EXISTS plan_source TEXT;

UPDATE app_users
SET plan_source = CASE
  WHEN plan_code = 'free' THEN NULL
  WHEN subscription_status = 'beta' THEN 'beta'
  WHEN stripe_subscription_id IS NOT NULL THEN 'stripe'
  ELSE COALESCE(plan_source, 'manual')
END
WHERE plan_source IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'app_users_plan_source_check'
  ) THEN
    ALTER TABLE app_users
      ADD CONSTRAINT app_users_plan_source_check
      CHECK (
        plan_source IS NULL OR
        plan_source IN ('beta', 'stripe', 'app_store', 'google_play', 'manual', 'admin')
      );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS store_entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  entitlement_id TEXT NOT NULL,
  product_id TEXT,
  status TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  management_url TEXT,
  environment TEXT,
  last_event_id TEXT,
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, provider, entitlement_id)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'store_entitlements_provider_check'
  ) THEN
    ALTER TABLE store_entitlements
      ADD CONSTRAINT store_entitlements_provider_check
      CHECK (provider IN ('app_store', 'google_play'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'store_entitlements_status_check'
  ) THEN
    ALTER TABLE store_entitlements
      ADD CONSTRAINT store_entitlements_status_check
      CHECK (status IN ('active', 'canceled', 'billing_issue', 'expired', 'unknown'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_store_entitlements_user_active
  ON store_entitlements(user_id, expires_at DESC);

CREATE INDEX IF NOT EXISTS idx_store_entitlements_provider_product
  ON store_entitlements(provider, product_id);
