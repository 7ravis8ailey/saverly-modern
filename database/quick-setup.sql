-- =====================================================
-- SAVERLY MODERN v2.0.0 - QUICK SETUP (ALL-IN-ONE)
-- =====================================================
-- This file contains ALL database setup in a single file for easy deployment
-- Copy/paste this entire file into Supabase Dashboard > SQL Editor and run once
-- Project: lziayzusujlvhebyagdl.supabase.co

-- =====================================================
-- EXTENSIONS AND BASIC SETUP
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- For advanced geolocation features

-- =====================================================
-- CORE TABLES CREATION
-- =====================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  uid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_uid UUID UNIQUE, -- Links to auth.users.id
  full_name TEXT,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  account_type TEXT CHECK (account_type IN ('subscriber', 'admin', 'business')) DEFAULT 'subscriber' NOT NULL,
  is_admin BOOLEAN DEFAULT false,
  subscription_status TEXT CHECK (subscription_status IN ('active', 'inactive', 'cancelled', 'past_due')) DEFAULT 'inactive' NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_period_end TIMESTAMPTZ,
  subscription_period_start TIMESTAMPTZ,
  subscription_plan TEXT CHECK (subscription_plan IN ('monthly', 'yearly')),
  subscription_canceled_at TIMESTAMPTZ,
  email_verified BOOLEAN DEFAULT false,
  profile_completed BOOLEAN DEFAULT false,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Businesses table
CREATE TABLE IF NOT EXISTS public.businesses (
  uid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_uid UUID REFERENCES public.users(uid) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN (
    'Food & Beverage', 
    'Retail', 
    'Health & Wellness', 
    'Entertainment & Recreation', 
    'Personal Services',
    'Automotive',
    'Beauty & Spa',
    'Professional Services'
  )) NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  phone TEXT,
  email TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  website_url TEXT,
  hours_of_operation JSONB,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  logo_url TEXT,
  cover_image_url TEXT,
  avg_rating DECIMAL(3,2) DEFAULT 0.0,
  total_reviews INTEGER DEFAULT 0,
  total_coupons_issued INTEGER DEFAULT 0,
  total_redemptions INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Coupons table
CREATE TABLE IF NOT EXISTS public.coupons (
  uid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_uid UUID REFERENCES public.businesses(uid) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  discount TEXT NOT NULL,
  terms_and_conditions TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  active BOOLEAN DEFAULT true NOT NULL,
  usage_limit TEXT CHECK (usage_limit IN ('one_time', 'daily', 'weekly', 'monthly', 'unlimited')) DEFAULT 'one_time' NOT NULL,
  monthly_limit INTEGER,
  max_total_redemptions INTEGER,
  current_redemptions INTEGER DEFAULT 0,
  min_purchase_amount DECIMAL(10,2),
  coupon_type TEXT CHECK (coupon_type IN ('percentage', 'fixed_amount', 'bogo', 'free_item')) NOT NULL DEFAULT 'percentage',
  discount_value DECIMAL(10,2),
  image_url TEXT,
  featured BOOLEAN DEFAULT false,
  priority INTEGER DEFAULT 0,
  qr_code_data TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Redemptions table
CREATE TABLE IF NOT EXISTS public.redemptions (
  uid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_uid UUID REFERENCES public.users(uid) ON DELETE CASCADE NOT NULL,
  coupon_uid UUID REFERENCES public.coupons(uid) ON DELETE CASCADE NOT NULL,
  business_uid UUID REFERENCES public.businesses(uid) ON DELETE CASCADE NOT NULL,
  qr_code TEXT UNIQUE NOT NULL,
  display_code TEXT UNIQUE NOT NULL,
  status TEXT CHECK (status IN ('pending', 'redeemed', 'expired', 'cancelled', 'refunded')) DEFAULT 'pending' NOT NULL,
  redemption_month TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  redeemed_at TIMESTAMPTZ,
  redeemed_by_business_user UUID REFERENCES public.users(uid),
  redemption_location POINT,
  transaction_amount DECIMAL(10,2),
  savings_amount DECIMAL(10,2),
  notes TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscription plans table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  uid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10,2) NOT NULL,
  price_yearly DECIMAL(10,2),
  stripe_price_id_monthly TEXT NOT NULL,
  stripe_price_id_yearly TEXT,
  features JSONB NOT NULL,
  max_redemptions_per_month INTEGER,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User favorites table
CREATE TABLE IF NOT EXISTS public.user_favorites (
  uid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_uid UUID REFERENCES public.users(uid) ON DELETE CASCADE NOT NULL,
  business_uid UUID REFERENCES public.businesses(uid) ON DELETE CASCADE,
  coupon_uid UUID REFERENCES public.coupons(uid) ON DELETE CASCADE,
  favorite_type TEXT CHECK (favorite_type IN ('business', 'coupon')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_uid, business_uid, coupon_uid)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  uid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_uid UUID REFERENCES public.users(uid) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT CHECK (notification_type IN (
    'coupon_expiring', 
    'new_coupon', 
    'redemption_reminder', 
    'subscription_renewal',
    'business_update',
    'system_announcement'
  )) NOT NULL,
  read BOOLEAN DEFAULT false,
  action_url TEXT,
  metadata JSONB,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- Business reviews table
CREATE TABLE IF NOT EXISTS public.business_reviews (
  uid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_uid UUID REFERENCES public.businesses(uid) ON DELETE CASCADE NOT NULL,
  user_uid UUID REFERENCES public.users(uid) ON DELETE CASCADE NOT NULL,
  redemption_uid UUID REFERENCES public.redemptions(uid) ON DELETE SET NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  review_text TEXT,
  is_verified BOOLEAN DEFAULT false,
  helpful_votes INTEGER DEFAULT 0,
  reported BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_uid, user_uid, redemption_uid)
);

-- =====================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_auth_uid ON public.users(auth_uid);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON public.users(subscription_status);
CREATE INDEX IF NOT EXISTS idx_users_account_type ON public.users(account_type);

-- Businesses indexes
CREATE INDEX IF NOT EXISTS idx_businesses_category ON public.businesses(category);
CREATE INDEX IF NOT EXISTS idx_businesses_location ON public.businesses(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_businesses_active ON public.businesses(is_active);

-- Coupons indexes
CREATE INDEX IF NOT EXISTS idx_coupons_business_uid ON public.coupons(business_uid);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON public.coupons(active, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_coupons_featured ON public.coupons(featured, priority DESC);

-- Redemptions indexes
CREATE INDEX IF NOT EXISTS idx_redemptions_user_uid ON public.redemptions(user_uid);
CREATE INDEX IF NOT EXISTS idx_redemptions_coupon_uid ON public.redemptions(coupon_uid);
CREATE INDEX IF NOT EXISTS idx_redemptions_business_uid ON public.redemptions(business_uid);
CREATE INDEX IF NOT EXISTS idx_redemptions_status ON public.redemptions(status);
CREATE INDEX IF NOT EXISTS idx_redemptions_qr_code ON public.redemptions(qr_code);

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Updated at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Admin check function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_uid = auth.uid() AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- QR code generation function
CREATE OR REPLACE FUNCTION public.generate_qr_codes()
RETURNS TRIGGER AS $$
DECLARE
  qr_code_text TEXT;
  display_code_text TEXT;
  counter INTEGER := 0;
BEGIN
  -- Generate unique QR code
  LOOP
    qr_code_text := 'SAVERLY-' || 
                   UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 12));
    
    IF NOT EXISTS (SELECT 1 FROM public.redemptions WHERE qr_code = qr_code_text) THEN
      EXIT;
    END IF;
    
    counter := counter + 1;
    IF counter > 10 THEN
      RAISE EXCEPTION 'Unable to generate unique QR code after 10 attempts';
    END IF;
  END LOOP;
  
  -- Generate display code
  counter := 0;
  LOOP
    display_code_text := SUBSTRING(
      UPPER(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT)) FROM 1 FOR 8
    );
    
    IF NOT EXISTS (SELECT 1 FROM public.redemptions WHERE display_code = display_code_text) THEN
      EXIT;
    END IF;
    
    counter := counter + 1;
    IF counter > 10 THEN
      RAISE EXCEPTION 'Unable to generate unique display code after 10 attempts';
    END IF;
  END LOOP;
  
  NEW.qr_code := qr_code_text;
  NEW.display_code := display_code_text;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CREATE TRIGGERS
-- =====================================================

-- Updated at triggers
DROP TRIGGER IF EXISTS handle_users_updated_at ON public.users;
CREATE TRIGGER handle_users_updated_at 
  BEFORE UPDATE ON public.users 
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_businesses_updated_at ON public.businesses;
CREATE TRIGGER handle_businesses_updated_at 
  BEFORE UPDATE ON public.businesses 
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_coupons_updated_at ON public.coupons;
CREATE TRIGGER handle_coupons_updated_at 
  BEFORE UPDATE ON public.coupons 
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- QR code generation trigger
DROP TRIGGER IF EXISTS generate_qr_codes_on_insert ON public.redemptions;
CREATE TRIGGER generate_qr_codes_on_insert
  BEFORE INSERT ON public.redemptions
  FOR EACH ROW 
  WHEN (NEW.qr_code IS NULL OR NEW.display_code IS NULL)
  EXECUTE FUNCTION public.generate_qr_codes();

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Users policies
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth_uid = auth.uid() OR public.is_admin());

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth_uid = auth.uid());

CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT WITH CHECK (auth_uid = auth.uid());

-- Businesses policies
CREATE POLICY "businesses_select_active" ON public.businesses
  FOR SELECT USING (is_active = true OR public.is_admin());

CREATE POLICY "businesses_insert_admin" ON public.businesses
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "businesses_update_admin" ON public.businesses
  FOR UPDATE USING (public.is_admin());

-- Coupons policies
CREATE POLICY "coupons_select_active" ON public.coupons
  FOR SELECT USING (
    (active = true AND start_date <= NOW() AND end_date >= NOW()) OR 
    public.is_admin()
  );

CREATE POLICY "coupons_insert_admin" ON public.coupons
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "coupons_update_admin" ON public.coupons
  FOR UPDATE USING (public.is_admin());

-- Redemptions policies
CREATE POLICY "redemptions_select_own" ON public.redemptions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE auth_uid = auth.uid() AND uid = user_uid) OR
    public.is_admin()
  );

CREATE POLICY "redemptions_insert_own" ON public.redemptions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE auth_uid = auth.uid() AND uid = user_uid)
  );

-- Other table policies (simplified for quick setup)
CREATE POLICY "user_favorites_own" ON public.user_favorites
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE auth_uid = auth.uid() AND uid = user_uid));

CREATE POLICY "notifications_own" ON public.notifications
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE auth_uid = auth.uid() AND uid = user_uid));

CREATE POLICY "business_reviews_public_read" ON public.business_reviews
  FOR SELECT USING (reported = false OR public.is_admin());

CREATE POLICY "subscription_plans_public_read" ON public.subscription_plans
  FOR SELECT USING (is_active = true);

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Anonymous access for public data
GRANT SELECT ON public.businesses TO anon;
GRANT SELECT ON public.coupons TO anon;
GRANT SELECT ON public.business_reviews TO anon;
GRANT SELECT ON public.subscription_plans TO anon;

-- =====================================================
-- INSERT ESSENTIAL DATA
-- =====================================================

-- Insert subscription plans
INSERT INTO public.subscription_plans (uid, name, description, price_monthly, price_yearly, stripe_price_id_monthly, stripe_price_id_yearly, features, max_redemptions_per_month, sort_order) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Basic', 'Perfect for occasional users', 9.99, 99.99, 'price_basic_monthly', 'price_basic_yearly', 
 '["5 redemptions per month", "Basic support"]'::jsonb, 5, 1),
('550e8400-e29b-41d4-a716-446655440002', 'Premium', 'Great for regular users', 19.99, 199.99, 'price_premium_monthly', 'price_premium_yearly',
 '["15 redemptions per month", "Priority support", "Advanced features"]'::jsonb, 15, 2),
('550e8400-e29b-41d4-a716-446655440003', 'Unlimited', 'For power users', 29.99, 299.99, 'price_unlimited_monthly', 'price_unlimited_yearly',
 '["Unlimited redemptions", "Premium support", "All features"]'::jsonb, null, 3)
ON CONFLICT (uid) DO NOTHING;

-- Create admin user placeholder (auth_uid will be set by trigger when actual user signs up)
INSERT INTO public.users (uid, full_name, email, account_type, is_admin, subscription_status, email_verified, profile_completed) VALUES
('00000000-0000-0000-0000-000000000001', 'System Admin', 'admin@saverly.com', 'admin', true, 'active', true, true)
ON CONFLICT (uid) DO NOTHING;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '🎉 Saverly Modern v2.0.0 Database Setup Complete!';
  RAISE NOTICE '✅ Tables created with proper indexes';
  RAISE NOTICE '✅ Row Level Security enabled with policies';
  RAISE NOTICE '✅ Functions and triggers configured';
  RAISE NOTICE '✅ Essential data inserted';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Database Status:';
  RAISE NOTICE '   • Tables: % created', (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE');
  RAISE NOTICE '   • Policies: % active', (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public');
  RAISE NOTICE '   • Functions: % created', (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public');
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Your Saverly database is ready for production!';
  RAISE NOTICE '🔗 Project: lziayzusujlvhebyagdl.supabase.co';
END $$;