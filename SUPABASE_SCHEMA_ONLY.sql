-- ========================================================================
-- SAVERLY MODERN v2.0.0 - SCHEMA ONLY (NO SAMPLE DATA)
-- ========================================================================
-- This version creates only the schema without sample data to avoid auth conflicts
-- ========================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ========================================================================
-- 1. USERS TABLE (linked to Supabase auth)
-- ========================================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'trial', 'expired')),
  subscription_plan TEXT CHECK (subscription_plan IN ('monthly', 'yearly')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_period_start TIMESTAMPTZ,
  subscription_period_end TIMESTAMPTZ,
  profile_image_url TEXT,
  preferences JSONB DEFAULT '{}',
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================================
-- 2. BUSINESSES TABLE (with geolocation)
-- ========================================================================
CREATE TABLE IF NOT EXISTS public.businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN (
    'Food & Beverage', 'Retail', 'Health & Wellness', 
    'Entertainment & Recreation', 'Personal Services', 'Automotive',
    'Home Services', 'Professional Services', 'Beauty & Spa', 'Sports & Fitness'
  )),
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  phone TEXT,
  email TEXT,
  website TEXT,
  business_hours JSONB DEFAULT '{}',
  logo_url TEXT,
  cover_image_url TEXT,
  average_rating DECIMAL(3, 2) DEFAULT 0.00,
  total_reviews INTEGER DEFAULT 0,
  total_coupons INTEGER DEFAULT 0,
  total_redemptions INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================================
-- 3. COUPONS TABLE (offers and deals)
-- ========================================================================
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  coupon_type TEXT NOT NULL CHECK (coupon_type IN ('percentage', 'fixed_amount', 'bogo', 'free_item')),
  discount_amount DECIMAL(10, 2), -- For percentage or fixed amount
  discount_percentage INTEGER CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  free_item_description TEXT, -- For free item coupons
  minimum_purchase DECIMAL(10, 2) DEFAULT 0,
  maximum_discount DECIMAL(10, 2), -- Cap for percentage discounts
  terms_conditions TEXT,
  usage_limit_type TEXT DEFAULT 'unlimited' CHECK (usage_limit_type IN ('once', 'daily', 'weekly', 'monthly', 'unlimited')),
  max_redemptions INTEGER,
  current_redemptions INTEGER DEFAULT 0,
  redemption_limit_per_user INTEGER DEFAULT 1,
  requires_membership BOOLEAN DEFAULT FALSE,
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  qr_code_url TEXT,
  promo_code TEXT UNIQUE,
  is_featured BOOLEAN DEFAULT FALSE,
  priority INTEGER DEFAULT 0, -- For sorting/display order
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================================
-- 4. REDEMPTIONS TABLE (usage tracking)
-- ========================================================================
CREATE TABLE IF NOT EXISTS public.redemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coupon_id UUID REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  qr_code TEXT UNIQUE NOT NULL,
  redemption_amount DECIMAL(10, 2),
  savings_amount DECIMAL(10, 2),
  redemption_location POINT, -- Geographic point where redeemed
  redemption_method TEXT DEFAULT 'qr_scan' CHECK (redemption_method IN ('qr_scan', 'promo_code', 'in_store')),
  notes TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES public.users(id),
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
  redeemed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================================
-- 5. USER FAVORITES TABLE
-- ========================================================================
CREATE TABLE IF NOT EXISTS public.user_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, business_id)
);

-- ========================================================================
-- 6. REVIEWS TABLE
-- ========================================================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  response_text TEXT, -- Business owner response
  responded_by UUID REFERENCES public.users(id),
  responded_at TIMESTAMPTZ,
  is_verified BOOLEAN DEFAULT FALSE,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, user_id)
);

-- ========================================================================
-- 7. NOTIFICATIONS TABLE
-- ========================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN (
    'coupon_new', 'coupon_expiring', 'business_new', 'redemption_success', 
    'review_received', 'subscription_reminder', 'system_update'
  )),
  related_id UUID, -- Can reference coupon, business, etc.
  is_read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================================
-- 8. INDEXES FOR PERFORMANCE
-- ========================================================================

-- Geographic indexes for location-based queries
CREATE INDEX IF NOT EXISTS idx_businesses_location ON public.businesses USING GIST (ST_Point(longitude, latitude));
CREATE INDEX IF NOT EXISTS idx_businesses_category ON public.businesses(category);
CREATE INDEX IF NOT EXISTS idx_businesses_active ON public.businesses(active) WHERE active = true;

-- Coupon indexes for filtering and searching
CREATE INDEX IF NOT EXISTS idx_coupons_business_id ON public.coupons(business_id);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON public.coupons(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_coupons_dates ON public.coupons(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_coupons_type ON public.coupons(coupon_type);

-- Redemption indexes for analytics
CREATE INDEX IF NOT EXISTS idx_redemptions_user_id ON public.redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_business_id ON public.redemptions(business_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_date ON public.redemptions(redeemed_at);
CREATE INDEX IF NOT EXISTS idx_redemptions_qr_code ON public.redemptions(qr_code);

-- User indexes
CREATE INDEX IF NOT EXISTS idx_users_subscription ON public.users(subscription_status);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Notification indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = false;

-- ========================================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admin can view all users" ON public.users
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  );

-- Businesses table policies
CREATE POLICY "Anyone can view active businesses" ON public.businesses
  FOR SELECT USING (active = true);

CREATE POLICY "Business owners can manage their businesses" ON public.businesses
  FOR ALL USING (owner_id = auth.uid());

CREATE POLICY "Admin can manage all businesses" ON public.businesses
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  );

-- Coupons table policies
CREATE POLICY "Anyone can view active coupons" ON public.coupons
  FOR SELECT USING (
    active = true 
    AND (end_date IS NULL OR end_date > NOW())
    AND EXISTS (SELECT 1 FROM public.businesses WHERE id = coupons.business_id AND active = true)
  );

CREATE POLICY "Business owners can manage their coupons" ON public.coupons
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.businesses WHERE id = coupons.business_id AND owner_id = auth.uid())
  );

CREATE POLICY "Admin can manage all coupons" ON public.coupons
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  );

-- Redemptions table policies
CREATE POLICY "Users can view own redemptions" ON public.redemptions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create redemptions" ON public.redemptions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Business owners can view their redemptions" ON public.redemptions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.businesses WHERE id = redemptions.business_id AND owner_id = auth.uid())
  );

CREATE POLICY "Admin can view all redemptions" ON public.redemptions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  );

-- User favorites policies
CREATE POLICY "Users can manage own favorites" ON public.user_favorites
  FOR ALL USING (user_id = auth.uid());

-- Reviews policies
CREATE POLICY "Anyone can view reviews" ON public.reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can create reviews" ON public.reviews
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own reviews" ON public.reviews
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Business owners can respond to reviews" ON public.reviews
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.businesses WHERE id = reviews.business_id AND owner_id = auth.uid())
  );

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

-- ========================================================================
-- 10. HELPER FUNCTIONS
-- ========================================================================

-- Function to generate unique QR codes
CREATE OR REPLACE FUNCTION generate_qr_code()
RETURNS TEXT AS $$
BEGIN
  RETURN 'QR-' || UPPER(substring(gen_random_uuid()::text from 1 for 8)) || '-' || EXTRACT(epoch FROM NOW())::text;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate distance between two points
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DECIMAL, lon1 DECIMAL, 
  lat2 DECIMAL, lon2 DECIMAL
) RETURNS DECIMAL AS $$
BEGIN
  RETURN ST_Distance(
    ST_Point(lon1, lat1)::geography,
    ST_Point(lon2, lat2)::geography
  ) / 1609.34; -- Convert meters to miles
END;
$$ LANGUAGE plpgsql;

-- Function to update business ratings
CREATE OR REPLACE FUNCTION update_business_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.businesses 
  SET 
    average_rating = (
      SELECT ROUND(AVG(rating), 2) 
      FROM public.reviews 
      WHERE business_id = COALESCE(NEW.business_id, OLD.business_id)
    ),
    total_reviews = (
      SELECT COUNT(*) 
      FROM public.reviews 
      WHERE business_id = COALESCE(NEW.business_id, OLD.business_id)
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.business_id, OLD.business_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to auto-assign QR codes to redemptions
CREATE OR REPLACE FUNCTION assign_qr_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.qr_code IS NULL OR NEW.qr_code = '' THEN
    NEW.qr_code := generate_qr_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================================================
-- 11. TRIGGERS
-- ========================================================================

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-update business ratings when reviews change
CREATE TRIGGER update_business_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION update_business_rating();

-- Auto-assign QR codes to redemptions
CREATE TRIGGER assign_qr_code_trigger
  BEFORE INSERT ON public.redemptions
  FOR EACH ROW EXECUTE FUNCTION assign_qr_code();

-- ========================================================================
-- 12. ANALYTICS VIEWS 
-- ========================================================================

-- Business performance view
CREATE OR REPLACE VIEW business_analytics AS
SELECT 
  b.id,
  b.name,
  b.category,
  b.average_rating,
  b.total_reviews,
  COUNT(DISTINCT c.id) as total_active_coupons,
  COUNT(DISTINCT r.id) as total_redemptions,
  COALESCE(SUM(r.savings_amount), 0) as total_savings_provided,
  COUNT(DISTINCT r.user_id) as unique_customers
FROM public.businesses b
LEFT JOIN public.coupons c ON b.id = c.business_id AND c.active = true
LEFT JOIN public.redemptions r ON b.id = r.business_id
WHERE b.active = true
GROUP BY b.id, b.name, b.category, b.average_rating, b.total_reviews;

-- User savings view
CREATE OR REPLACE VIEW user_savings AS
SELECT 
  u.id,
  u.full_name,
  u.email,
  COUNT(DISTINCT r.id) as total_redemptions,
  COALESCE(SUM(r.savings_amount), 0) as total_savings,
  COUNT(DISTINCT r.business_id) as businesses_visited
FROM public.users u
LEFT JOIN public.redemptions r ON u.id = r.user_id
GROUP BY u.id, u.full_name, u.email;

-- ========================================================================
-- SCHEMA SETUP COMPLETE!
-- ========================================================================
-- 
-- Your Saverly Modern v2.0.0 database schema is now ready!
-- 
-- NOTE: Sample data has been removed to avoid auth conflicts.
-- You'll need to create users through the Supabase Auth system first,
-- then add businesses and coupons through your application.
-- 
-- Next steps:
-- 1. Test the connection from your app at http://localhost:5174/test
-- 2. Create your first user account through the app
-- 3. The user profile will be automatically created in the users table
-- 4. Then you can start adding businesses and coupons
-- 
-- ========================================================================