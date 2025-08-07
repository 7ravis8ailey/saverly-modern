-- IMMEDIATE RLS FIX - Minimal changes to stop infinite recursion
-- This is the essential fix that will make everything work

-- 1. Drop the problematic policies that cause recursion
DROP POLICY IF EXISTS "Users can view own profile" ON public.users CASCADE;
DROP POLICY IF EXISTS "users_select_policy" ON public.users CASCADE;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users CASCADE;
DROP POLICY IF EXISTS "users_update_policy" ON public.users CASCADE;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users CASCADE;
DROP POLICY IF EXISTS "users_insert_policy" ON public.users CASCADE;
DROP POLICY IF EXISTS "Admin can view all users" ON public.users CASCADE;

-- 2. Drop the recursive helper functions
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.owns_business(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.has_active_subscription() CASCADE;

-- 3. Create simple, non-recursive policies for users table
CREATE POLICY "users_can_view_own" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_can_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "users_can_insert_own" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 4. Fix businesses table policies
DROP POLICY IF EXISTS "Anyone can view businesses" ON public.businesses CASCADE;
DROP POLICY IF EXISTS "Anyone can view active businesses" ON public.businesses CASCADE;
DROP POLICY IF EXISTS "businesses_select_public" ON public.businesses CASCADE;
DROP POLICY IF EXISTS "Business owners can manage their businesses" ON public.businesses CASCADE;

-- Simple public read policy for businesses
CREATE POLICY "public_read_businesses" ON public.businesses
  FOR SELECT USING (active = true);

-- Business owners can manage their own
CREATE POLICY "owners_manage_businesses" ON public.businesses
  FOR ALL USING (owner_id = auth.uid());

-- 5. Fix coupons table policies  
DROP POLICY IF EXISTS "Anyone can view active coupons" ON public.coupons CASCADE;
DROP POLICY IF EXISTS "coupons_select_public" ON public.coupons CASCADE;
DROP POLICY IF EXISTS "Business owners can manage their coupons" ON public.coupons CASCADE;

-- Public can view active coupons
CREATE POLICY "public_read_coupons" ON public.coupons
  FOR SELECT USING (active = true);

-- Business owners can manage coupons (simplified)
CREATE POLICY "business_manage_coupons" ON public.coupons
  FOR ALL USING (
    business_id IN (
      SELECT id FROM public.businesses WHERE owner_id = auth.uid()
    )
  );

-- 6. Fix redemptions table
DROP POLICY IF EXISTS "Users can view own redemptions" ON public.redemptions CASCADE;
DROP POLICY IF EXISTS "Users can create redemptions" ON public.redemptions CASCADE;
DROP POLICY IF EXISTS "Business owners can view their redemptions" ON public.redemptions CASCADE;

-- Users can manage their own redemptions
CREATE POLICY "users_own_redemptions" ON public.redemptions
  FOR ALL USING (user_id = auth.uid());

-- That's it! This minimal fix will stop the infinite recursion
-- and make your app work immediately