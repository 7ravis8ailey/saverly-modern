-- Saverly Database Schema for Supabase
-- Based on the original Drizzle schema from Replit app

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  uid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  subscription_status TEXT CHECK (subscription_status IN ('active', 'inactive')) DEFAULT 'inactive' NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_period_end TIMESTAMPTZ,
  subscription_period_start TIMESTAMPTZ,
  subscription_plan TEXT CHECK (subscription_plan IN ('monthly', 'yearly')),
  subscription_canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Businesses table
CREATE TABLE public.businesses (
  uid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('Food & Beverage', 'Retail', 'Health & Wellness', 'Entertainment & Recreation', 'Personal Services')) NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  phone TEXT,
  email TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Coupons table
CREATE TABLE public.coupons (
  uid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_uid UUID REFERENCES public.businesses(uid) NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  discount TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  active BOOLEAN DEFAULT true NOT NULL,
  usage_limit TEXT CHECK (usage_limit IN ('one_time', 'daily', 'monthly')) DEFAULT 'one_time' NOT NULL,
  monthly_limit INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Redemptions table
CREATE TABLE public.redemptions (
  uid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_uid UUID REFERENCES public.users(uid) NOT NULL,
  coupon_uid UUID REFERENCES public.coupons(uid) NOT NULL,
  business_uid UUID REFERENCES public.businesses(uid) NOT NULL,
  qr_code TEXT UNIQUE NOT NULL,
  display_code TEXT UNIQUE NOT NULL,
  status TEXT CHECK (status IN ('pending', 'redeemed', 'expired', 'cancelled')) DEFAULT 'pending' NOT NULL,
  redemption_month TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  redeemed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_subscription_status ON public.users(subscription_status);
CREATE INDEX idx_users_account_type ON public.users(account_type);
CREATE INDEX idx_users_location ON public.users(latitude, longitude);

CREATE INDEX idx_businesses_category ON public.businesses(category);
CREATE INDEX idx_businesses_location ON public.businesses(latitude, longitude);
CREATE INDEX idx_businesses_email ON public.businesses(email);

CREATE INDEX idx_coupons_business_uid ON public.coupons(business_uid);
CREATE INDEX idx_coupons_active ON public.coupons(active, start_date, end_date);

CREATE INDEX idx_redemptions_user_uid ON public.redemptions(user_uid);
CREATE INDEX idx_redemptions_coupon_uid ON public.redemptions(coupon_uid);
CREATE INDEX idx_redemptions_business_uid ON public.redemptions(business_uid);
CREATE INDEX idx_redemptions_status ON public.redemptions(status);
CREATE INDEX idx_redemptions_qr_code ON public.redemptions(qr_code);
CREATE INDEX idx_redemptions_display_code ON public.redemptions(display_code);
CREATE INDEX idx_redemptions_monthly ON public.redemptions(user_uid, coupon_uid, redemption_month);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redemptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users: Users can only see/edit their own data, admins can see all
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid()::text = uid::text OR EXISTS (SELECT 1 FROM public.users WHERE uid::text = auth.uid()::text AND is_admin = true));
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid()::text = uid::text);
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid()::text = uid::text);

-- Businesses: Public read, business owners and admins can modify
CREATE POLICY "Anyone can view businesses" ON public.businesses FOR SELECT USING (true);
CREATE POLICY "Admins can modify businesses" ON public.businesses FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE uid::text = auth.uid()::text AND is_admin = true));

-- Coupons: Public read for active coupons, business owners and admins can modify
CREATE POLICY "Anyone can view active coupons" ON public.coupons FOR SELECT USING (active = true AND start_date <= NOW() AND end_date >= NOW());
CREATE POLICY "Admins can view all coupons" ON public.coupons FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE uid::text = auth.uid()::text AND is_admin = true));
CREATE POLICY "Admins can modify coupons" ON public.coupons FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE uid::text = auth.uid()::text AND is_admin = true));

-- Redemptions: Users can see their own, admins can see all
CREATE POLICY "Users can view own redemptions" ON public.redemptions FOR SELECT USING (auth.uid()::text = user_uid::text OR EXISTS (SELECT 1 FROM public.users WHERE uid::text = auth.uid()::text AND is_admin = true));
CREATE POLICY "Users can create redemptions" ON public.redemptions FOR INSERT WITH CHECK (auth.uid()::text = user_uid::text);
CREATE POLICY "Admins can modify redemptions" ON public.redemptions FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE uid::text = auth.uid()::text AND is_admin = true));

-- Create functions for updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER handle_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_businesses_updated_at BEFORE UPDATE ON public.businesses FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_coupons_updated_at BEFORE UPDATE ON public.coupons FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();