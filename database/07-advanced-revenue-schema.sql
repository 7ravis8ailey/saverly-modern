-- =====================================================
-- SAVERLY ADVANCED REVENUE MODEL - DATABASE SCHEMA
-- =====================================================
-- This file contains the enhanced database schema for multi-stream revenue architecture
-- Apply this AFTER the base schema (01-schema.sql) via Supabase Dashboard > SQL Editor

-- =====================================================
-- SUBSCRIPTION MANAGEMENT TABLES
-- =====================================================

-- Enhanced Subscription Plans
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  uid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  tier_level INTEGER NOT NULL DEFAULT 1, -- 0=Free, 1=Basic, 2=Premium, 3=Family
  price_monthly DECIMAL(10,2) DEFAULT 0.00,
  price_yearly DECIMAL(10,2) DEFAULT 0.00,
  annual_discount_percent INTEGER DEFAULT 0, -- e.g., 20 for 20% discount
  
  -- Feature Configuration
  features JSONB NOT NULL DEFAULT '{}',
  limitations JSONB NOT NULL DEFAULT '{}',
  max_redemptions_per_month INTEGER DEFAULT 0, -- 0 = unlimited
  max_location_radius INTEGER DEFAULT 25, -- miles
  max_favorite_businesses INTEGER DEFAULT 10,
  
  -- Premium Features
  priority_support BOOLEAN DEFAULT false,
  early_access_hours INTEGER DEFAULT 0, -- hours before public
  exclusive_coupons_access BOOLEAN DEFAULT false,
  analytics_access BOOLEAN DEFAULT false,
  group_purchasing BOOLEAN DEFAULT false,
  family_accounts INTEGER DEFAULT 1, -- number of accounts included
  
  -- System Configuration
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Business Subscription Plans
CREATE TABLE IF NOT EXISTS public.business_subscription_plans (
  uid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  tier_level INTEGER NOT NULL DEFAULT 1, -- 0=Free, 1=Professional, 2=Enterprise
  price_monthly DECIMAL(10,2) DEFAULT 0.00,
  
  -- Commission and Fee Structure
  base_commission_rate DECIMAL(5,4) NOT NULL DEFAULT 0.1500, -- 15%
  processing_fee_discount DECIMAL(5,4) DEFAULT 0.0000, -- discount on processing fees
  transaction_fee_monthly DECIMAL(10,2) DEFAULT 0.00, -- flat monthly transaction fee
  
  -- Feature Limits
  max_active_coupons INTEGER DEFAULT 2, -- unlimited = -1
  max_locations INTEGER DEFAULT 1,
  max_staff_accounts INTEGER DEFAULT 1,
  max_monthly_transactions INTEGER DEFAULT 100,
  
  -- Analytics and Reporting
  analytics_level TEXT CHECK (analytics_level IN ('basic', 'advanced', 'enterprise')) DEFAULT 'basic',
  custom_reports BOOLEAN DEFAULT false,
  api_access BOOLEAN DEFAULT false,
  webhook_support BOOLEAN DEFAULT false,
  
  -- Premium Features
  priority_support BOOLEAN DEFAULT false,
  dedicated_account_manager BOOLEAN DEFAULT false,
  white_label_available BOOLEAN DEFAULT false,
  multi_location_management BOOLEAN DEFAULT false,
  advanced_targeting BOOLEAN DEFAULT false,
  a_b_testing BOOLEAN DEFAULT false,
  
  -- Marketing Features
  featured_listing BOOLEAN DEFAULT false,
  priority_search_placement BOOLEAN DEFAULT false,
  social_media_integration BOOLEAN DEFAULT false,
  email_marketing_tools BOOLEAN DEFAULT false,
  
  -- System Configuration
  is_active BOOLEAN DEFAULT true,
  stripe_price_id TEXT,
  setup_fee DECIMAL(10,2) DEFAULT 0.00,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Commission Tier Structure for Volume Discounts
CREATE TABLE IF NOT EXISTS public.commission_tiers (
  uid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_uid UUID REFERENCES public.businesses(uid) ON DELETE CASCADE,
  plan_uid UUID REFERENCES public.business_subscription_plans(uid),
  
  -- Volume Thresholds
  min_monthly_volume INTEGER NOT NULL DEFAULT 0, -- minimum monthly transactions
  max_monthly_volume INTEGER, -- null = no maximum
  min_monthly_revenue DECIMAL(10,2), -- minimum monthly revenue
  
  -- Commission Rates
  commission_rate DECIMAL(5,4) NOT NULL, -- actual rate for this tier
  processing_fee_rate DECIMAL(5,4) DEFAULT 0.0290, -- 2.9%
  processing_fee_fixed DECIMAL(5,2) DEFAULT 0.30, -- $0.30
  
  -- Performance Bonuses/Penalties
  rating_bonus_threshold DECIMAL(3,2) DEFAULT 4.50, -- 4.5 stars
  rating_bonus_rate DECIMAL(5,4) DEFAULT 0.0050, -- 0.5% bonus
  completion_rate_threshold DECIMAL(5,4) DEFAULT 0.80, -- 80% completion
  completion_rate_bonus DECIMAL(5,4) DEFAULT 0.0030, -- 0.3% bonus
  
  -- Validity Period
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expires_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- REVENUE TRACKING AND ANALYTICS
-- =====================================================

-- Comprehensive Revenue Transaction Logging
CREATE TABLE IF NOT EXISTS public.revenue_transactions (
  uid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Transaction Classification
  transaction_type TEXT CHECK (transaction_type IN (
    'consumer_subscription', 'business_subscription', 'commission', 'processing_fee',
    'advertising', 'sponsored_content', 'enterprise_license', 'setup_fee',
    'loan_origination', 'insurance_commission', 'affiliate_commission',
    'payment_processing', 'chargeback', 'refund', 'adjustment'
  )) NOT NULL,
  
  -- Entity References
  business_uid UUID REFERENCES public.businesses(uid),
  user_uid UUID REFERENCES public.users(uid),
  coupon_uid UUID REFERENCES public.coupons(uid),
  redemption_uid UUID REFERENCES public.redemptions(uid),
  
  -- Financial Details
  gross_amount DECIMAL(10,2) NOT NULL, -- before fees and commissions
  net_amount DECIMAL(10,2) NOT NULL,   -- after fees (what we receive)
  fee_amount DECIMAL(10,2) DEFAULT 0.00, -- processing fees
  commission_amount DECIMAL(10,2) DEFAULT 0.00, -- commission paid to us
  currency TEXT DEFAULT 'USD',
  
  -- Payment Processing Details
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  stripe_transfer_id TEXT,
  payment_method TEXT, -- credit_card, bank_transfer, crypto, etc.
  
  -- Metadata and Tracking
  description TEXT,
  metadata JSONB DEFAULT '{}',
  accounting_period TEXT, -- YYYY-MM format
  tax_category TEXT,
  
  -- Status and Timing
  status TEXT CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'disputed')) DEFAULT 'pending',
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  settled_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ADVERTISING AND MARKETING REVENUE
-- =====================================================

-- Advertising Products and Pricing
CREATE TABLE IF NOT EXISTS public.advertising_products (
  uid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT CHECK (type IN (
    'sponsored_coupon', 'banner_ad', 'featured_listing', 'category_takeover',
    'search_placement', 'push_notification', 'email_inclusion', 'native_content'
  )) NOT NULL,
  
  -- Pricing Structure
  price_per_day DECIMAL(10,2),
  price_per_week DECIMAL(10,2),
  price_per_month DECIMAL(10,2),
  price_per_campaign DECIMAL(10,2),
  price_per_click DECIMAL(6,4),
  price_per_impression DECIMAL(6,6),
  
  -- Placement Configuration
  max_active_campaigns INTEGER DEFAULT 1,
  geographic_targeting BOOLEAN DEFAULT false,
  demographic_targeting BOOLEAN DEFAULT false,
  time_based_scheduling BOOLEAN DEFAULT false,
  
  -- Performance Tracking
  click_tracking BOOLEAN DEFAULT true,
  impression_tracking BOOLEAN DEFAULT true,
  conversion_tracking BOOLEAN DEFAULT false,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Active Advertising Campaigns
CREATE TABLE IF NOT EXISTS public.advertising_campaigns (
  uid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_uid UUID REFERENCES public.businesses(uid) ON DELETE CASCADE,
  product_uid UUID REFERENCES public.advertising_products(uid),
  
  -- Campaign Details
  name TEXT NOT NULL,
  description TEXT,
  creative_url TEXT, -- image/video URL
  target_url TEXT,   -- landing page URL
  call_to_action TEXT,
  
  -- Targeting Configuration
  target_locations JSONB DEFAULT '[]', -- array of cities/states
  target_categories JSONB DEFAULT '[]', -- business categories
  target_demographics JSONB DEFAULT '{}', -- age, gender, etc.
  
  -- Schedule and Budget
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  daily_budget DECIMAL(10,2),
  total_budget DECIMAL(10,2),
  
  -- Performance Metrics
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  cost_per_click DECIMAL(6,4),
  cost_per_impression DECIMAL(6,6),
  
  -- Status
  status TEXT CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled')) DEFAULT 'draft',
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES public.users(uid),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ENTERPRISE AND WHITE-LABEL SOLUTIONS
-- =====================================================

-- Enterprise Client Configuration
CREATE TABLE IF NOT EXISTS public.enterprise_clients (
  uid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Client Information
  company_name TEXT NOT NULL,
  primary_contact_name TEXT NOT NULL,
  primary_contact_email TEXT NOT NULL,
  billing_contact_email TEXT,
  
  -- Contract Details
  contract_type TEXT CHECK (contract_type IN ('white_label', 'franchise', 'enterprise_license')) NOT NULL,
  monthly_license_fee DECIMAL(10,2) NOT NULL,
  setup_fee DECIMAL(10,2) DEFAULT 0.00,
  revenue_share_percentage DECIMAL(5,4) DEFAULT 0.0000, -- for franchise model
  
  -- Platform Configuration
  custom_domain TEXT,
  custom_branding JSONB DEFAULT '{}',
  feature_overrides JSONB DEFAULT '{}',
  api_access_level TEXT CHECK (api_access_level IN ('read', 'write', 'admin')) DEFAULT 'read',
  
  -- Geographic and Operational
  territory_exclusivity JSONB DEFAULT '[]', -- array of cities/states
  max_businesses INTEGER DEFAULT -1, -- -1 = unlimited
  max_users INTEGER DEFAULT -1,
  
  -- Status and Dates
  status TEXT CHECK (status IN ('active', 'suspended', 'cancelled', 'pending')) DEFAULT 'pending',
  contract_start_date DATE NOT NULL,
  contract_end_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- FINANCIAL SERVICES INTEGRATION
-- =====================================================

-- Merchant Financing Applications
CREATE TABLE IF NOT EXISTS public.merchant_financing (
  uid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_uid UUID REFERENCES public.businesses(uid) ON DELETE CASCADE,
  
  -- Application Details
  loan_type TEXT CHECK (loan_type IN ('working_capital', 'equipment', 'merchant_advance', 'line_of_credit')) NOT NULL,
  requested_amount DECIMAL(12,2) NOT NULL,
  approved_amount DECIMAL(12,2),
  
  -- Terms and Rates
  interest_rate DECIMAL(6,4), -- annual percentage rate
  factor_rate DECIMAL(4,2), -- for merchant advances (e.g., 1.20 = 20% factor)
  term_months INTEGER,
  origination_fee_percentage DECIMAL(5,4),
  origination_fee_amount DECIMAL(10,2),
  
  -- Business Metrics at Application
  monthly_revenue DECIMAL(12,2),
  credit_score INTEGER,
  years_in_business DECIMAL(4,1),
  saverly_monthly_volume DECIMAL(12,2),
  saverly_account_age_months INTEGER,
  
  -- Partner Integration
  lending_partner TEXT, -- partner institution name
  partner_application_id TEXT,
  partner_decision_date DATE,
  
  -- Revenue Share
  saverly_commission_percentage DECIMAL(5,4) DEFAULT 0.5000, -- 50% of interest income
  expected_commission_amount DECIMAL(10,2),
  
  -- Status Tracking
  application_status TEXT CHECK (application_status IN (
    'submitted', 'under_review', 'approved', 'rejected', 'funded', 'defaulted'
  )) DEFAULT 'submitted',
  
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  decision_at TIMESTAMPTZ,
  funded_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PAYMENT PROCESSING ENHANCEMENTS
-- =====================================================

-- Payment Method Analytics
CREATE TABLE IF NOT EXISTS public.payment_method_analytics (
  uid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Payment Method Details
  payment_method TEXT NOT NULL, -- credit_card, debit_card, digital_wallet, bank_transfer, crypto
  payment_subtype TEXT, -- visa, mastercard, apple_pay, bitcoin, etc.
  
  -- Transaction Metrics
  transaction_count INTEGER DEFAULT 0,
  total_volume DECIMAL(15,2) DEFAULT 0.00,
  average_transaction DECIMAL(10,2) DEFAULT 0.00,
  success_rate DECIMAL(5,4) DEFAULT 1.0000, -- percentage successful
  
  -- Fee Analysis
  total_processing_fees DECIMAL(12,2) DEFAULT 0.00,
  average_processing_fee DECIMAL(8,4) DEFAULT 0.00,
  chargeback_count INTEGER DEFAULT 0,
  chargeback_amount DECIMAL(12,2) DEFAULT 0.00,
  
  -- Time Period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================

-- Subscription and Revenue Indexes
CREATE INDEX IF NOT EXISTS idx_subscription_plans_tier ON public.subscription_plans(tier_level, is_active);
CREATE INDEX IF NOT EXISTS idx_business_plans_tier ON public.business_subscription_plans(tier_level, is_active);
CREATE INDEX IF NOT EXISTS idx_revenue_transactions_type_date ON public.revenue_transactions(transaction_type, processed_at);
CREATE INDEX IF NOT EXISTS idx_revenue_transactions_business ON public.revenue_transactions(business_uid, processed_at);
CREATE INDEX IF NOT EXISTS idx_revenue_transactions_user ON public.revenue_transactions(user_uid, processed_at);
CREATE INDEX IF NOT EXISTS idx_revenue_transactions_accounting ON public.revenue_transactions(accounting_period, transaction_type);

-- Commission and Performance Indexes
CREATE INDEX IF NOT EXISTS idx_commission_tiers_business ON public.commission_tiers(business_uid, effective_date);
CREATE INDEX IF NOT EXISTS idx_commission_tiers_volume ON public.commission_tiers(min_monthly_volume, max_monthly_volume);

-- Advertising Campaign Indexes
CREATE INDEX IF NOT EXISTS idx_advertising_campaigns_business ON public.advertising_campaigns(business_uid, status);
CREATE INDEX IF NOT EXISTS idx_advertising_campaigns_dates ON public.advertising_campaigns(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_advertising_campaigns_performance ON public.advertising_campaigns(clicks DESC, impressions DESC);

-- Enterprise and Financing Indexes
CREATE INDEX IF NOT EXISTS idx_enterprise_clients_status ON public.enterprise_clients(status, contract_end_date);
CREATE INDEX IF NOT EXISTS idx_merchant_financing_business ON public.merchant_financing(business_uid, application_status);
CREATE INDEX IF NOT EXISTS idx_merchant_financing_partner ON public.merchant_financing(lending_partner, submitted_at);

-- =====================================================
-- MATERIALIZED VIEWS FOR ANALYTICS
-- =====================================================

-- Daily Revenue Summary
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_daily_revenue_summary AS
SELECT 
  DATE_TRUNC('day', processed_at)::DATE as date,
  transaction_type,
  COUNT(*) as transaction_count,
  SUM(gross_amount) as gross_revenue,
  SUM(net_amount) as net_revenue,
  SUM(fee_amount) as total_fees,
  SUM(commission_amount) as total_commissions,
  AVG(net_amount) as avg_transaction_amount
FROM public.revenue_transactions 
WHERE status = 'completed'
GROUP BY DATE_TRUNC('day', processed_at), transaction_type;

-- Business Revenue Performance
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_business_revenue_performance AS
SELECT 
  b.uid as business_uid,
  b.name as business_name,
  b.category,
  COUNT(rt.uid) as total_transactions,
  SUM(rt.commission_amount) as total_commission_generated,
  AVG(rt.gross_amount) as avg_transaction_value,
  DATE_TRUNC('month', MAX(rt.processed_at)) as last_transaction_month,
  -- Calculate commission tier eligibility
  COUNT(rt.uid) FILTER (WHERE rt.processed_at >= CURRENT_DATE - INTERVAL '30 days') as monthly_transaction_count
FROM public.businesses b
LEFT JOIN public.revenue_transactions rt ON rt.business_uid = b.uid
WHERE rt.status = 'completed' OR rt.uid IS NULL
GROUP BY b.uid, b.name, b.category;

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Revenue Transactions - Admin and Business Owner Access
ALTER TABLE public.revenue_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "revenue_transactions_admin_access" ON public.revenue_transactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE uid = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "revenue_transactions_business_access" ON public.revenue_transactions
  FOR SELECT USING (
    business_uid IN (
      SELECT uid FROM public.businesses 
      WHERE owner_uid = auth.uid()
    )
  );

-- Commission Tiers - Business Owner Access
ALTER TABLE public.commission_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "commission_tiers_business_access" ON public.commission_tiers
  FOR ALL USING (
    business_uid IN (
      SELECT uid FROM public.businesses 
      WHERE owner_uid = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE uid = auth.uid() AND is_admin = true
    )
  );

-- Enterprise Clients - Admin Only
ALTER TABLE public.enterprise_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "enterprise_clients_admin_only" ON public.enterprise_clients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE uid = auth.uid() AND is_admin = true
    )
  );

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to calculate dynamic commission rate
CREATE OR REPLACE FUNCTION calculate_dynamic_commission(
  p_business_uid UUID,
  p_monthly_volume INTEGER DEFAULT NULL,
  p_monthly_revenue DECIMAL DEFAULT NULL
)
RETURNS DECIMAL AS $$
DECLARE
  v_base_rate DECIMAL;
  v_volume_discount DECIMAL := 0;
  v_performance_bonus DECIMAL := 0;
  v_business_rating DECIMAL;
  v_completion_rate DECIMAL;
BEGIN
  -- Get business subscription plan base rate
  SELECT bsp.base_commission_rate INTO v_base_rate
  FROM public.businesses b
  JOIN public.business_subscription_plans bsp ON bsp.uid = b.subscription_plan_uid
  WHERE b.uid = p_business_uid;
  
  -- Apply volume discounts
  IF p_monthly_volume IS NOT NULL THEN
    SELECT commission_rate INTO v_volume_discount
    FROM public.commission_tiers ct
    WHERE ct.business_uid = p_business_uid
      AND ct.min_monthly_volume <= p_monthly_volume
      AND (ct.max_monthly_volume IS NULL OR ct.max_monthly_volume > p_monthly_volume)
      AND ct.effective_date <= CURRENT_DATE
      AND (ct.expires_date IS NULL OR ct.expires_date > CURRENT_DATE)
    ORDER BY ct.min_monthly_volume DESC
    LIMIT 1;
  END IF;
  
  -- Apply performance bonuses
  SELECT avg_rating INTO v_business_rating FROM public.businesses WHERE uid = p_business_uid;
  
  -- Calculate completion rate (successful redemptions / total redemptions)
  SELECT 
    COALESCE(
      COUNT(*) FILTER (WHERE status = 'redeemed')::DECIMAL / NULLIF(COUNT(*), 0),
      0
    ) INTO v_completion_rate
  FROM public.redemptions 
  WHERE business_uid = p_business_uid 
    AND created_at >= CURRENT_DATE - INTERVAL '30 days';
  
  -- Apply bonuses based on performance
  IF v_business_rating >= 4.5 THEN
    v_performance_bonus := v_performance_bonus + 0.005; -- 0.5% bonus
  END IF;
  
  IF v_completion_rate >= 0.80 THEN
    v_performance_bonus := v_performance_bonus + 0.003; -- 0.3% bonus
  END IF;
  
  -- Return final calculated rate
  RETURN COALESCE(v_volume_discount, v_base_rate) + v_performance_bonus;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record revenue transaction
CREATE OR REPLACE FUNCTION record_revenue_transaction(
  p_transaction_type TEXT,
  p_business_uid UUID DEFAULT NULL,
  p_user_uid UUID DEFAULT NULL,
  p_coupon_uid UUID DEFAULT NULL,
  p_redemption_uid UUID DEFAULT NULL,
  p_gross_amount DECIMAL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_transaction_uid UUID;
  v_commission_rate DECIMAL;
  v_processing_fee DECIMAL;
  v_net_amount DECIMAL;
  v_commission_amount DECIMAL;
BEGIN
  v_transaction_uid := uuid_generate_v4();
  
  -- Calculate fees and commissions based on transaction type
  CASE p_transaction_type
    WHEN 'commission' THEN
      v_commission_rate := calculate_dynamic_commission(p_business_uid);
      v_commission_amount := p_gross_amount * v_commission_rate;
      v_processing_fee := p_gross_amount * 0.029 + 0.30; -- Stripe fees
      v_net_amount := v_commission_amount - v_processing_fee;
    
    WHEN 'consumer_subscription', 'business_subscription' THEN
      v_processing_fee := p_gross_amount * 0.029 + 0.30;
      v_commission_amount := 0;
      v_net_amount := p_gross_amount - v_processing_fee;
    
    ELSE
      v_processing_fee := 0;
      v_commission_amount := 0;
      v_net_amount := p_gross_amount;
  END CASE;
  
  -- Insert the transaction record
  INSERT INTO public.revenue_transactions (
    uid, transaction_type, business_uid, user_uid, coupon_uid, redemption_uid,
    gross_amount, net_amount, fee_amount, commission_amount, metadata
  ) VALUES (
    v_transaction_uid, p_transaction_type, p_business_uid, p_user_uid, 
    p_coupon_uid, p_redemption_uid, p_gross_amount, v_net_amount, 
    v_processing_fee, v_commission_amount, p_metadata
  );
  
  RETURN v_transaction_uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-refresh materialized views daily
SELECT cron.schedule(
  'refresh-revenue-views',
  '0 2 * * *', -- 2 AM daily
  $$
    REFRESH MATERIALIZED VIEW public.mv_daily_revenue_summary;
    REFRESH MATERIALIZED VIEW public.mv_business_revenue_performance;
  $$
);

-- =====================================================
-- INITIAL DATA SETUP
-- =====================================================

-- Insert default consumer subscription plans
INSERT INTO public.subscription_plans (name, slug, tier_level, price_monthly, price_yearly, annual_discount_percent, features, limitations, max_redemptions_per_month, max_location_radius) VALUES
('Saverly Free', 'free', 0, 0.00, 0.00, 0, 
 '{"basic_directory": true, "limited_coupons": true}',
 '{"premium_coupons": false, "early_access": false, "analytics": false}',
 1, 5),
('Saverly Basic', 'basic', 1, 4.99, 47.90, 20,
 '{"unlimited_views": true, "standard_coupons": true, "email_support": true}',
 '{"premium_coupons": false, "early_access": false, "analytics": false}',
 10, 25),
('Saverly Premium', 'premium', 2, 19.99, 191.90, 20,
 '{"unlimited_redemptions": true, "premium_coupons": true, "early_access": true, "priority_support": true, "analytics": true}',
 '{}',
 0, 100),
('Saverly Family', 'family', 3, 29.99, 287.90, 20,
 '{"family_accounts": 6, "shared_tracker": true, "parental_controls": true, "bulk_redemptions": true}',
 '{}',
 0, 100)
ON CONFLICT (slug) DO UPDATE SET
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  features = EXCLUDED.features;

-- Insert business subscription plans
INSERT INTO public.business_subscription_plans (name, slug, tier_level, price_monthly, base_commission_rate, max_active_coupons, analytics_level) VALUES
('Business Basic', 'business-free', 0, 0.00, 0.1500, 2, 'basic'),
('Business Professional', 'business-pro', 1, 99.99, 0.1200, -1, 'advanced'),
('Business Enterprise', 'business-enterprise', 2, 299.99, 0.0800, -1, 'enterprise')
ON CONFLICT (slug) DO UPDATE SET
  price_monthly = EXCLUDED.price_monthly,
  base_commission_rate = EXCLUDED.base_commission_rate,
  max_active_coupons = EXCLUDED.max_active_coupons;

-- Insert default advertising products
INSERT INTO public.advertising_products (name, type, price_per_week, price_per_month) VALUES
('Featured Homepage Coupon', 'sponsored_coupon', 299.99, 999.99),
('Category Page Banner', 'banner_ad', 149.99, 499.99),
('Search Results Top Placement', 'search_placement', 199.99, 649.99),
('Push Notification Campaign', 'push_notification', NULL, 99.99)
ON CONFLICT DO NOTHING;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant access to authenticated users for subscription plans
GRANT SELECT ON public.subscription_plans TO authenticated, anon;
GRANT SELECT ON public.business_subscription_plans TO authenticated, anon;
GRANT SELECT ON public.advertising_products TO authenticated, anon;

-- Grant access to materialized views
GRANT SELECT ON public.mv_daily_revenue_summary TO authenticated;
GRANT SELECT ON public.mv_business_revenue_performance TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION calculate_dynamic_commission TO authenticated;
GRANT EXECUTE ON FUNCTION record_revenue_transaction TO authenticated;

-- =====================================================
-- SCHEMA VALIDATION
-- =====================================================

-- Validate that all required tables exist
DO $$
DECLARE
  missing_tables TEXT[];
  table_name TEXT;
BEGIN
  FOR table_name IN VALUES 
    ('subscription_plans'), ('business_subscription_plans'), ('commission_tiers'),
    ('revenue_transactions'), ('advertising_products'), ('advertising_campaigns'),
    ('enterprise_clients'), ('merchant_financing'), ('payment_method_analytics')
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = table_name
    ) THEN
      missing_tables := array_append(missing_tables, table_name);
    END IF;
  END LOOP;
  
  IF array_length(missing_tables, 1) > 0 THEN
    RAISE EXCEPTION 'Missing required tables: %', array_to_string(missing_tables, ', ');
  ELSE
    RAISE NOTICE 'Advanced Revenue Schema: All required tables created successfully';
  END IF;
END $$;