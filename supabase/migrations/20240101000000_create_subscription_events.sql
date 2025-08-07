-- Create subscription_events table for webhook audit trail
CREATE TABLE IF NOT EXISTS subscription_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  event_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS subscription_events_user_id_idx ON subscription_events(user_id);
CREATE INDEX IF NOT EXISTS subscription_events_stripe_subscription_id_idx ON subscription_events(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS subscription_events_created_at_idx ON subscription_events(created_at);

-- Add RLS policies
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;

-- Users can only see their own subscription events
CREATE POLICY subscription_events_user_policy ON subscription_events
  FOR SELECT
  USING (user_id = auth.uid());

-- Only service role can insert/update subscription events (webhooks)
CREATE POLICY subscription_events_service_policy ON subscription_events
  FOR ALL
  TO service_role
  USING (true);

-- Add additional columns to users table if they don't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Create indexes for Stripe IDs
CREATE INDEX IF NOT EXISTS users_stripe_customer_id_idx ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS users_stripe_subscription_id_idx ON users(stripe_subscription_id);