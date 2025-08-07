-- =====================================================
-- SAVERLY MODERN v2.0.0 - ROW LEVEL SECURITY POLICIES
-- =====================================================
-- This file contains all Row Level Security policies
-- Apply this AFTER 01-schema.sql via Supabase Dashboard > SQL Editor

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
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- HELPER FUNCTIONS FOR RLS POLICIES
-- =====================================================

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_uid = auth.uid() AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user owns a business
CREATE OR REPLACE FUNCTION public.owns_business(business_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.businesses b
    JOIN public.users u ON b.owner_uid = u.uid
    WHERE b.uid = business_id AND u.auth_uid = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user has active subscription
CREATE OR REPLACE FUNCTION public.has_active_subscription()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_uid = auth.uid() 
    AND subscription_status = 'active'
    AND (subscription_period_end IS NULL OR subscription_period_end > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- USERS TABLE POLICIES
-- =====================================================

-- Users can view their own profile, admins can view all
CREATE POLICY "users_select_policy" ON public.users
  FOR SELECT
  USING (
    auth_uid = auth.uid() OR 
    public.is_admin()
  );

-- Users can update their own profile only
CREATE POLICY "users_update_policy" ON public.users
  FOR UPDATE
  USING (auth_uid = auth.uid())
  WITH CHECK (auth_uid = auth.uid());

-- Only authenticated users can insert their own profile
CREATE POLICY "users_insert_policy" ON public.users
  FOR INSERT
  WITH CHECK (auth_uid = auth.uid());

-- Users cannot delete their profiles (must be done by admin)
CREATE POLICY "users_delete_policy" ON public.users
  FOR DELETE
  USING (public.is_admin());

-- =====================================================
-- BUSINESSES TABLE POLICIES
-- =====================================================

-- Anyone can view active businesses
CREATE POLICY "businesses_select_public" ON public.businesses
  FOR SELECT
  USING (is_active = true);

-- Business owners and admins can view all business details
CREATE POLICY "businesses_select_owner_admin" ON public.businesses
  FOR SELECT
  USING (
    public.owns_business(uid) OR 
    public.is_admin()
  );

-- Only admins can create businesses (business registration controlled)
CREATE POLICY "businesses_insert_policy" ON public.businesses
  FOR INSERT
  WITH CHECK (public.is_admin());

-- Business owners and admins can update businesses
CREATE POLICY "businesses_update_policy" ON public.businesses
  FOR UPDATE
  USING (
    public.owns_business(uid) OR 
    public.is_admin()
  )
  WITH CHECK (
    public.owns_business(uid) OR 
    public.is_admin()
  );

-- Only admins can delete businesses
CREATE POLICY "businesses_delete_policy" ON public.businesses
  FOR DELETE
  USING (public.is_admin());

-- =====================================================
-- COUPONS TABLE POLICIES
-- =====================================================

-- Anyone can view active, non-expired coupons from active businesses
CREATE POLICY "coupons_select_public" ON public.coupons
  FOR SELECT
  USING (
    active = true 
    AND start_date <= NOW() 
    AND end_date >= NOW()
    AND EXISTS (
      SELECT 1 FROM public.businesses b 
      WHERE b.uid = business_uid AND b.is_active = true
    )
  );

-- Business owners and admins can view all coupons for their businesses
CREATE POLICY "coupons_select_owner_admin" ON public.coupons
  FOR SELECT
  USING (
    public.owns_business(business_uid) OR 
    public.is_admin()
  );

-- Business owners and admins can create coupons
CREATE POLICY "coupons_insert_policy" ON public.coupons
  FOR INSERT
  WITH CHECK (
    public.owns_business(business_uid) OR 
    public.is_admin()
  );

-- Business owners and admins can update coupons
CREATE POLICY "coupons_update_policy" ON public.coupons
  FOR UPDATE
  USING (
    public.owns_business(business_uid) OR 
    public.is_admin()
  )
  WITH CHECK (
    public.owns_business(business_uid) OR 
    public.is_admin()
  );

-- Business owners and admins can delete coupons
CREATE POLICY "coupons_delete_policy" ON public.coupons
  FOR DELETE
  USING (
    public.owns_business(business_uid) OR 
    public.is_admin()
  );

-- =====================================================
-- REDEMPTIONS TABLE POLICIES
-- =====================================================

-- Users can view their own redemptions
CREATE POLICY "redemptions_select_user" ON public.redemptions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE auth_uid = auth.uid() AND uid = user_uid
    )
  );

-- Business owners can view redemptions for their businesses
CREATE POLICY "redemptions_select_business" ON public.redemptions
  FOR SELECT
  USING (public.owns_business(business_uid));

-- Admins can view all redemptions
CREATE POLICY "redemptions_select_admin" ON public.redemptions
  FOR SELECT
  USING (public.is_admin());

-- Only active subscribers can create redemptions
CREATE POLICY "redemptions_insert_policy" ON public.redemptions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE auth_uid = auth.uid() 
      AND uid = user_uid
      AND public.has_active_subscription()
    )
  );

-- Users can update their own pending redemptions (for cancellation)
CREATE POLICY "redemptions_update_user" ON public.redemptions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE auth_uid = auth.uid() AND uid = user_uid
    )
    AND status = 'pending'
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE auth_uid = auth.uid() AND uid = user_uid
    )
  );

-- Business owners can update redemptions for their businesses (mark as redeemed)
CREATE POLICY "redemptions_update_business" ON public.redemptions
  FOR UPDATE
  USING (public.owns_business(business_uid))
  WITH CHECK (public.owns_business(business_uid));

-- Admins can update any redemption
CREATE POLICY "redemptions_update_admin" ON public.redemptions
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =====================================================
-- USER FAVORITES TABLE POLICIES
-- =====================================================

-- Users can only access their own favorites
CREATE POLICY "user_favorites_policy" ON public.user_favorites
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE auth_uid = auth.uid() AND uid = user_uid
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE auth_uid = auth.uid() AND uid = user_uid
    )
  );

-- =====================================================
-- NOTIFICATIONS TABLE POLICIES
-- =====================================================

-- Users can only access their own notifications
CREATE POLICY "notifications_select_policy" ON public.notifications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE auth_uid = auth.uid() AND uid = user_uid
    ) OR
    public.is_admin()
  );

-- Users can only update their own notifications (mark as read)
CREATE POLICY "notifications_update_policy" ON public.notifications
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE auth_uid = auth.uid() AND uid = user_uid
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE auth_uid = auth.uid() AND uid = user_uid
    )
  );

-- Only system/admins can create notifications
CREATE POLICY "notifications_insert_policy" ON public.notifications
  FOR INSERT
  WITH CHECK (public.is_admin());

-- =====================================================
-- BUSINESS REVIEWS TABLE POLICIES
-- =====================================================

-- Anyone can read reviews for active businesses
CREATE POLICY "business_reviews_select_public" ON public.business_reviews
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b 
      WHERE b.uid = business_uid AND b.is_active = true
    ) AND
    reported = false
  );

-- Business owners and admins can see all reviews (including reported ones)
CREATE POLICY "business_reviews_select_owner_admin" ON public.business_reviews
  FOR SELECT
  USING (
    public.owns_business(business_uid) OR 
    public.is_admin()
  );

-- Only authenticated users with verified redemptions can create reviews
CREATE POLICY "business_reviews_insert_policy" ON public.business_reviews
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE auth_uid = auth.uid() AND uid = user_uid
    ) AND
    (redemption_uid IS NULL OR EXISTS (
      SELECT 1 FROM public.redemptions 
      WHERE uid = redemption_uid AND status = 'redeemed'
    ))
  );

-- Users can update their own reviews
CREATE POLICY "business_reviews_update_policy" ON public.business_reviews
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE auth_uid = auth.uid() AND uid = user_uid
    ) OR
    public.is_admin()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE auth_uid = auth.uid() AND uid = user_uid
    ) OR
    public.is_admin()
  );

-- =====================================================
-- ANALYTICS EVENTS TABLE POLICIES
-- =====================================================

-- Only admins can access analytics data
CREATE POLICY "analytics_events_admin_only" ON public.analytics_events
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =====================================================
-- SUBSCRIPTION PLANS TABLE POLICIES
-- =====================================================

-- Anyone can view active subscription plans
CREATE POLICY "subscription_plans_select_public" ON public.subscription_plans
  FOR SELECT
  USING (is_active = true);

-- Only admins can modify subscription plans
CREATE POLICY "subscription_plans_admin_only" ON public.subscription_plans
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =====================================================
-- GRANT PERMISSIONS TO AUTHENTICATED USERS
-- =====================================================

-- Grant basic permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant permissions to anonymous users for public data
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON public.businesses TO anon;
GRANT SELECT ON public.coupons TO anon;
GRANT SELECT ON public.business_reviews TO anon;
GRANT SELECT ON public.subscription_plans TO anon;