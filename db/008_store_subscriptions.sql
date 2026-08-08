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

CREATE OR REPLACE FUNCTION preserve_active_store_plan()
RETURNS TRIGGER AS $$
DECLARE
  active_provider TEXT;
BEGIN
  SELECT provider INTO active_provider
  FROM store_entitlements
  WHERE user_id = NEW.id
    AND entitlement_id = 'pro'
    AND status IN ('active', 'canceled', 'billing_issue')
    AND (expires_at IS NULL OR expires_at > NOW())
  ORDER BY expires_at DESC NULLS FIRST
  LIMIT 1;

  IF NEW.plan_code = 'free' AND active_provider IS NOT NULL THEN
    NEW.plan_code := 'pro';
    NEW.plan_source := active_provider;
  ELSIF NEW.plan_code = 'pro' AND NEW.plan_source IS NULL THEN
    IF NEW.subscription_status = 'beta' THEN
      NEW.plan_source := 'beta';
    ELSIF NEW.stripe_subscription_id IS NOT NULL THEN
      NEW.plan_source := 'stripe';
    ELSIF active_provider IS NOT NULL THEN
      NEW.plan_source := active_provider;
    ELSE
      NEW.plan_source := 'manual';
    END IF;
  ELSIF NEW.plan_code = 'free' THEN
    NEW.plan_source := NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_preserve_active_store_plan ON app_users;
CREATE TRIGGER trg_preserve_active_store_plan
BEFORE UPDATE OF plan_code, plan_source, subscription_status, stripe_subscription_id
ON app_users
FOR EACH ROW
EXECUTE FUNCTION preserve_active_store_plan();
