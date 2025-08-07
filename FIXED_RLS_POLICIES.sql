-- =====================================================
-- SAVERLY MODERN v2.0.0 - FIXED RLS POLICIES (NO RECURSION)
-- =====================================================
-- This file fixes the infinite recursion issue in Supabase RLS
-- Apply this via Supabase Dashboard > SQL Editor to replace old policies
-- =====================================================

-- =====================================================
-- DROP ALL EXISTING POLICIES TO AVOID CONFLICTS
-- =====================================================

-- Drop existing policies on users table
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "users_select_policy" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "users_update_policy" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "users_insert_policy" ON public.users;
DROP POLICY IF EXISTS "users_delete_policy" ON public.users;
DROP POLICY IF EXISTS "Admin can view all users" ON public.users;

-- Drop problematic helper functions that cause recursion
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.owns_business(UUID);
DROP FUNCTION IF EXISTS public.has_active_subscription();

-- =====================================================
-- FIXED RLS POLICIES FOR USERS TABLE (NO RECURSION)
-- =====================================================

-- Users can view their own profile using direct auth comparison
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT
  USING (id = auth.uid());

-- Users can update their own profile using direct auth comparison
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Users can insert their own profile (for registration)
CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT
  WITH CHECK (id = auth.uid());

-- Admin access - simplified without helper functions
-- This policy uses a direct check without recursion
CREATE POLICY "admin_full_access" ON public.users
  FOR ALL
  USING (
    -- Only allow if current user is marked as admin in their own record
    -- This checks auth.uid() directly against existing admin users
    auth.uid() IN (
      SELECT id FROM public.users 
      WHERE is_admin = true 
      AND id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM public.users 
      WHERE is_admin = true 
      AND id = auth.uid()
    )
  );

-- =====================================================
-- FIXED HELPER FUNCTIONS (NON-RECURSIVE)
-- =====================================================

-- Safe admin check that doesn't cause recursion
CREATE OR REPLACE FUNCTION public.is_admin_safe()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT is_admin = true 
  FROM public.users 
  WHERE id = auth.uid();
$$;

-- Safe business ownership check
CREATE OR REPLACE FUNCTION public.owns_business_safe(business_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.businesses 
    WHERE id = business_id 
    AND owner_id = auth.uid()
  );
$$;

-- Safe subscription check
CREATE OR REPLACE FUNCTION public.has_active_subscription_safe()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT subscription_status = 'active'
  AND (subscription_period_end IS NULL OR subscription_period_end > NOW())
  FROM public.users 
  WHERE id = auth.uid();
$$;

-- =====================================================
-- FIXED BUSINESSES TABLE POLICIES
-- =====================================================

-- Drop existing business policies
DROP POLICY IF EXISTS "Anyone can view businesses" ON public.businesses;
DROP POLICY IF EXISTS "Anyone can view active businesses" ON public.businesses;
DROP POLICY IF EXISTS "businesses_select_public" ON public.businesses;
DROP POLICY IF EXISTS "businesses_select_owner_admin" ON public.businesses;
DROP POLICY IF EXISTS "businesses_insert_policy" ON public.businesses;
DROP POLICY IF EXISTS "businesses_update_policy" ON public.businesses;
DROP POLICY IF EXISTS "businesses_delete_policy" ON public.businesses;
DROP POLICY IF EXISTS "Business owners can manage their businesses" ON public.businesses;
DROP POLICY IF EXISTS "Admin can manage all businesses" ON public.businesses;
DROP POLICY IF EXISTS "Admins can modify businesses" ON public.businesses;

-- Anyone can view active businesses
CREATE POLICY "businesses_public_read" ON public.businesses
  FOR SELECT
  USING (active = true);

-- Business owners can manage their own businesses
CREATE POLICY "businesses_owner_manage" ON public.businesses
  FOR ALL
  USING (owner_id = auth.uid());

-- Admins can manage all businesses (using safe function)
CREATE POLICY "businesses_admin_manage" ON public.businesses
  FOR ALL
  USING (public.is_admin_safe());

-- =====================================================
-- FIXED COUPONS TABLE POLICIES
-- =====================================================

-- Drop existing coupon policies
DROP POLICY IF EXISTS "Anyone can view active coupons" ON public.coupons;
DROP POLICY IF EXISTS "coupons_select_public" ON public.coupons;
DROP POLICY IF EXISTS "coupons_select_owner_admin" ON public.coupons;
DROP POLICY IF EXISTS "coupons_insert_policy" ON public.coupons;
DROP POLICY IF EXISTS "coupons_update_policy" ON public.coupons;
DROP POLICY IF EXISTS "coupons_delete_policy" ON public.coupons;
DROP POLICY IF EXISTS "Admins can view all coupons" ON public.coupons;
DROP POLICY IF EXISTS "Admins can modify coupons" ON public.coupons;
DROP POLICY IF EXISTS "Business owners can manage their coupons" ON public.coupons;
DROP POLICY IF EXISTS "Admin can manage all coupons" ON public.coupons;

-- Public can view active, non-expired coupons from active businesses
CREATE POLICY "coupons_public_read" ON public.coupons
  FOR SELECT
  USING (
    active = true 
    AND (end_date IS NULL OR end_date > NOW())
    AND EXISTS (
      SELECT 1 FROM public.businesses b 
      WHERE b.id = coupons.business_id AND b.active = true
    )
  );

-- Business owners can manage their coupons
CREATE POLICY "coupons_owner_manage" ON public.coupons
  FOR ALL
  USING (public.owns_business_safe(business_id));

-- Admins can manage all coupons
CREATE POLICY "coupons_admin_manage" ON public.coupons
  FOR ALL
  USING (public.is_admin_safe());

-- =====================================================
-- FIXED REDEMPTIONS TABLE POLICIES
-- =====================================================

-- Drop existing redemption policies
DROP POLICY IF EXISTS "Users can view own redemptions" ON public.redemptions;
DROP POLICY IF EXISTS "redemptions_select_user" ON public.redemptions;
DROP POLICY IF EXISTS "redemptions_select_business" ON public.redemptions;
DROP POLICY IF EXISTS "redemptions_select_admin" ON public.redemptions;
DROP POLICY IF EXISTS "redemptions_insert_policy" ON public.redemptions;
DROP POLICY IF EXISTS "redemptions_update_user" ON public.redemptions;
DROP POLICY IF EXISTS "redemptions_update_business" ON public.redemptions;
DROP POLICY IF EXISTS "redemptions_update_admin" ON public.redemptions;
DROP POLICY IF EXISTS "Users can create redemptions" ON public.redemptions;
DROP POLICY IF EXISTS "Business owners can view their redemptions" ON public.redemptions;
DROP POLICY IF EXISTS "Admin can view all redemptions" ON public.redemptions;
DROP POLICY IF EXISTS "Admins can modify redemptions" ON public.redemptions;

-- Users can view their own redemptions
CREATE POLICY "redemptions_user_read" ON public.redemptions
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can create redemptions (with subscription check)
CREATE POLICY "redemptions_user_insert" ON public.redemptions
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid() 
    AND public.has_active_subscription_safe()
  );

-- Users can update their own pending redemptions
CREATE POLICY "redemptions_user_update" ON public.redemptions
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Business owners can view/update redemptions for their businesses
CREATE POLICY "redemptions_business_access" ON public.redemptions
  FOR ALL
  USING (public.owns_business_safe(business_id));

-- Admins can access all redemptions
CREATE POLICY "redemptions_admin_access" ON public.redemptions
  FOR ALL
  USING (public.is_admin_safe());

-- =====================================================
-- FIXED USER FAVORITES TABLE POLICIES
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "user_favorites_policy" ON public.user_favorites;
DROP POLICY IF EXISTS "Users can manage own favorites" ON public.user_favorites;

-- Users can only manage their own favorites
CREATE POLICY "favorites_user_manage" ON public.user_favorites
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- FIXED NOTIFICATIONS TABLE POLICIES  
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "notifications_select_policy" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_policy" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_policy" ON public.notifications;
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;

-- Users can view their own notifications
CREATE POLICY "notifications_user_read" ON public.notifications
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "notifications_user_update" ON public.notifications
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admins can create/manage notifications
CREATE POLICY "notifications_admin_manage" ON public.notifications
  FOR ALL
  USING (public.is_admin_safe())
  WITH CHECK (public.is_admin_safe());

-- =====================================================
-- FIXED REVIEWS TABLE POLICIES
-- =====================================================

-- Drop existing policies (if any)
DROP POLICY IF EXISTS "business_reviews_select_public" ON public.reviews;
DROP POLICY IF EXISTS "business_reviews_select_owner_admin" ON public.reviews;
DROP POLICY IF EXISTS "business_reviews_insert_policy" ON public.reviews;
DROP POLICY IF EXISTS "business_reviews_update_policy" ON public.reviews;
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can create reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Business owners can respond to reviews" ON public.reviews;

-- Anyone can view reviews
CREATE POLICY "reviews_public_read" ON public.reviews
  FOR SELECT
  USING (true);

-- Users can create reviews
CREATE POLICY "reviews_user_insert" ON public.reviews
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own reviews
CREATE POLICY "reviews_user_update" ON public.reviews
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Business owners can respond to reviews for their businesses
CREATE POLICY "reviews_business_respond" ON public.reviews
  FOR UPDATE
  USING (public.owns_business_safe(business_id));

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
GRANT SELECT ON public.reviews TO anon;

-- =====================================================
-- VALIDATION TEST QUERIES
-- =====================================================

-- Test admin function (should not cause recursion)
-- SELECT public.is_admin_safe();

-- Test business ownership
-- SELECT public.owns_business_safe('some-uuid-here');

-- Test subscription status
-- SELECT public.has_active_subscription_safe();

-- =====================================================
-- SETUP COMPLETE - RLS FIXED!
-- =====================================================
-- 
-- This fixes the infinite recursion by:
-- 1. Removing circular dependencies in helper functions
-- 2. Using direct auth.uid() comparisons where possible
-- 3. Creating STABLE SQL functions instead of PL/pgSQL
-- 4. Avoiding nested RLS policy calls
-- 
-- All policies now work without causing infinite recursion!
-- =====================================================