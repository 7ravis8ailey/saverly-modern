-- =====================================================
-- SAVERLY MODERN v2.0.0 - COMPLETE DATABASE SCHEMA
-- =====================================================
-- This file contains the complete database schema for the Saverly coupon marketplace
-- Apply this via Supabase Dashboard > SQL Editor
-- Project: lziayzusujlvhebyagdl.supabase.co

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- For advanced geolocation features

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Users table (extends Supabase auth.users)
-- Links to auth.users via trigger function
CREATE TABLE public.users (
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
CREATE TABLE public.businesses (
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
  hours_of_operation JSONB, -- Store business hours as JSON
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
CREATE TABLE public.coupons (
  uid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_uid UUID REFERENCES public.businesses(uid) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  discount TEXT NOT NULL, -- e.g., "20% off", "$5 off", "Buy 1 Get 1 Free"
  terms_and_conditions TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  active BOOLEAN DEFAULT true NOT NULL,
  usage_limit TEXT CHECK (usage_limit IN ('one_time', 'daily', 'weekly', 'monthly', 'unlimited')) DEFAULT 'one_time' NOT NULL,
  monthly_limit INTEGER,
  max_total_redemptions INTEGER, -- Overall limit for the coupon
  current_redemptions INTEGER DEFAULT 0,
  min_purchase_amount DECIMAL(10,2),
  coupon_type TEXT CHECK (coupon_type IN ('percentage', 'fixed_amount', 'bogo', 'free_item')) NOT NULL DEFAULT 'percentage',
  discount_value DECIMAL(10,2), -- Numeric value for calculations
  image_url TEXT,
  featured BOOLEAN DEFAULT false,
  priority INTEGER DEFAULT 0, -- For sorting/featuring
  qr_code_data TEXT, -- Pre-generated QR code data
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Redemptions table
CREATE TABLE public.redemptions (
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
  redeemed_by_business_user UUID REFERENCES public.users(uid), -- Business staff who processed redemption
  redemption_location POINT, -- PostGIS point for exact redemption location
  transaction_amount DECIMAL(10,2), -- Amount of purchase when coupon was used
  savings_amount DECIMAL(10,2), -- Actual savings from the coupon
  notes TEXT, -- Additional notes about the redemption
  rating INTEGER CHECK (rating >= 1 AND rating <= 5), -- User rating of the experience
  review_text TEXT, -- User review
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ADDITIONAL FEATURES TABLES
-- =====================================================

-- User favorites (saved businesses/coupons)
CREATE TABLE public.user_favorites (
  uid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_uid UUID REFERENCES public.users(uid) ON DELETE CASCADE NOT NULL,
  business_uid UUID REFERENCES public.businesses(uid) ON DELETE CASCADE,
  coupon_uid UUID REFERENCES public.coupons(uid) ON DELETE CASCADE,
  favorite_type TEXT CHECK (favorite_type IN ('business', 'coupon')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_uid, business_uid, coupon_uid)
);

-- Push notifications tracking
CREATE TABLE public.notifications (
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
  action_url TEXT, -- Deep link for the notification
  metadata JSONB, -- Additional data for the notification
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- Business reviews and ratings
CREATE TABLE public.business_reviews (
  uid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_uid UUID REFERENCES public.businesses(uid) ON DELETE CASCADE NOT NULL,
  user_uid UUID REFERENCES public.users(uid) ON DELETE CASCADE NOT NULL,
  redemption_uid UUID REFERENCES public.redemptions(uid) ON DELETE SET NULL, -- Optional link to redemption
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  review_text TEXT,
  is_verified BOOLEAN DEFAULT false, -- Verified purchase/redemption
  helpful_votes INTEGER DEFAULT 0,
  reported BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_uid, user_uid, redemption_uid)
);

-- System analytics and metrics
CREATE TABLE public.analytics_events (
  uid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_uid UUID REFERENCES public.users(uid) ON DELETE SET NULL,
  business_uid UUID REFERENCES public.businesses(uid) ON DELETE SET NULL,
  coupon_uid UUID REFERENCES public.coupons(uid) ON DELETE SET NULL,
  event_type TEXT NOT NULL, -- 'coupon_view', 'business_view', 'search', 'redemption_attempt', etc.
  event_data JSONB, -- Flexible event data storage
  user_agent TEXT,
  ip_address INET,
  location POINT, -- PostGIS point for geographic analytics
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscription plans configuration
CREATE TABLE public.subscription_plans (
  uid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10,2) NOT NULL,
  price_yearly DECIMAL(10,2),
  stripe_price_id_monthly TEXT NOT NULL,
  stripe_price_id_yearly TEXT,
  features JSONB NOT NULL, -- List of features included
  max_redemptions_per_month INTEGER,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Users indexes
CREATE INDEX idx_users_auth_uid ON public.users(auth_uid);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_subscription_status ON public.users(subscription_status);
CREATE INDEX idx_users_account_type ON public.users(account_type);
CREATE INDEX idx_users_location ON public.users(latitude, longitude);
CREATE INDEX idx_users_stripe_customer ON public.users(stripe_customer_id);

-- Businesses indexes
CREATE INDEX idx_businesses_owner ON public.businesses(owner_uid);
CREATE INDEX idx_businesses_category ON public.businesses(category);
CREATE INDEX idx_businesses_location ON public.businesses(latitude, longitude);
CREATE INDEX idx_businesses_city_state ON public.businesses(city, state);
CREATE INDEX idx_businesses_active ON public.businesses(is_active);
CREATE INDEX idx_businesses_verified ON public.businesses(is_verified);

-- PostGIS spatial indexes
CREATE INDEX idx_businesses_location_gist ON public.businesses USING GIST(ST_MakePoint(longitude, latitude));

-- Coupons indexes
CREATE INDEX idx_coupons_business_uid ON public.coupons(business_uid);
CREATE INDEX idx_coupons_active ON public.coupons(active, start_date, end_date);
CREATE INDEX idx_coupons_dates ON public.coupons(start_date, end_date);
CREATE INDEX idx_coupons_featured ON public.coupons(featured, priority DESC);
CREATE INDEX idx_coupons_type ON public.coupons(coupon_type);

-- Redemptions indexes
CREATE INDEX idx_redemptions_user_uid ON public.redemptions(user_uid);
CREATE INDEX idx_redemptions_coupon_uid ON public.redemptions(coupon_uid);
CREATE INDEX idx_redemptions_business_uid ON public.redemptions(business_uid);
CREATE INDEX idx_redemptions_status ON public.redemptions(status);
CREATE INDEX idx_redemptions_qr_code ON public.redemptions(qr_code);
CREATE INDEX idx_redemptions_display_code ON public.redemptions(display_code);
CREATE INDEX idx_redemptions_monthly ON public.redemptions(user_uid, coupon_uid, redemption_month);
CREATE INDEX idx_redemptions_expires_at ON public.redemptions(expires_at);

-- Additional table indexes
CREATE INDEX idx_user_favorites_user ON public.user_favorites(user_uid, favorite_type);
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_uid, read, sent_at DESC);
CREATE INDEX idx_business_reviews_business ON public.business_reviews(business_uid, rating);
CREATE INDEX idx_analytics_events_type_date ON public.analytics_events(event_type, created_at);
CREATE INDEX idx_analytics_events_user ON public.analytics_events(user_uid, created_at);

-- =====================================================
-- UPDATED_AT TRIGGER FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER handle_users_updated_at 
  BEFORE UPDATE ON public.users 
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_businesses_updated_at 
  BEFORE UPDATE ON public.businesses 
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_coupons_updated_at 
  BEFORE UPDATE ON public.coupons 
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_business_reviews_updated_at 
  BEFORE UPDATE ON public.business_reviews 
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_subscription_plans_updated_at 
  BEFORE UPDATE ON public.subscription_plans 
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();