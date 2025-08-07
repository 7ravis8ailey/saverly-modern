-- REDESIGN: Single Users Table with Role-Based Access
-- Much cleaner architecture - all users in one table with role tags

-- 1. First, let's see current structure
SELECT 'Current Users Table Structure' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Ensure we have proper role fields in users table
DO $$
BEGIN
    -- Add user_role if it doesn't exist (replaces user_type)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'user_role'
    ) THEN
        ALTER TABLE public.users 
        ADD COLUMN user_role VARCHAR(20) DEFAULT 'consumer';
    END IF;
    
    -- Add is_admin flag for easy admin checks
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'is_admin'
    ) THEN
        ALTER TABLE public.users 
        ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add subscription status for business features
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'subscription_status'
    ) THEN
        ALTER TABLE public.users 
        ADD COLUMN subscription_status VARCHAR(20) DEFAULT 'free';
    END IF;
    
    -- Add subscription end date
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'subscription_period_end'
    ) THEN
        ALTER TABLE public.users 
        ADD COLUMN subscription_period_end TIMESTAMPTZ;
    END IF;
END $$;

-- 3. Create enum for user roles (cleaner than VARCHAR)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') THEN
        CREATE TYPE user_role_enum AS ENUM (
            'consumer',      -- Regular users who redeem coupons
            'business',      -- Business owners who create coupons  
            'admin',         -- Platform administrators
            'super_admin'    -- Full system access
        );
    END IF;
END $$;

-- 4. Update the user_role column to use enum
-- (We'll keep it as VARCHAR for now to avoid data migration issues)

-- 5. Create proper indexes for role-based queries
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(user_role);
CREATE INDEX IF NOT EXISTS idx_users_admin ON public.users(is_admin) WHERE is_admin = true;
CREATE INDEX IF NOT EXISTS idx_users_business ON public.users(user_role) WHERE user_role = 'business';

-- 6. Sync all existing auth.users to public.users with proper roles
INSERT INTO public.users (
    id,
    email,
    full_name,
    user_role,
    is_admin,
    subscription_status,
    created_at,
    updated_at
)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', 'Saverly User') as full_name,
    CASE 
        WHEN au.email LIKE '%admin%' THEN 'admin'
        WHEN au.raw_user_meta_data->>'user_type' = 'business_owner' THEN 'business'
        ELSE 'consumer'
    END as user_role,
    CASE WHEN au.email LIKE '%admin%' THEN TRUE ELSE FALSE END as is_admin,
    CASE 
        WHEN au.raw_user_meta_data->>'user_type' = 'business_owner' THEN 'active'
        ELSE 'free'
    END as subscription_status,
    au.created_at,
    NOW() as updated_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL  -- Only insert if not already exists
AND au.email IS NOT NULL;

-- 7. Update the trigger to handle new role-based users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (
        id,
        email,
        full_name,
        user_role,
        is_admin,
        subscription_status,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Saverly User'),
        CASE 
            WHEN NEW.email LIKE '%admin%' THEN 'admin'
            WHEN NEW.raw_user_meta_data->>'user_type' = 'business_owner' THEN 'business'
            ELSE 'consumer'
        END,
        CASE WHEN NEW.email LIKE '%admin%' THEN TRUE ELSE FALSE END,
        CASE 
            WHEN NEW.raw_user_meta_data->>'user_type' = 'business_owner' THEN 'active'
            ELSE 'free'
        END,
        NOW(),
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. Create helper functions for role checking
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
    SELECT is_admin = true 
    FROM public.users 
    WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_business_user()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
    SELECT user_role = 'business'
    FROM public.users 
    WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.has_business_subscription()
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

-- 9. Update RLS policies to use role-based access
-- Drop old policies first
DROP POLICY IF EXISTS "users_can_view_own" ON public.users;
DROP POLICY IF EXISTS "users_can_update_own" ON public.users;
DROP POLICY IF EXISTS "users_can_insert_own" ON public.users;

-- Create comprehensive role-based policies
CREATE POLICY "users_view_own_profile" ON public.users
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "users_update_own_profile" ON public.users
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "users_insert_own_profile" ON public.users
    FOR INSERT WITH CHECK (id = auth.uid());

-- Admins can view all users
CREATE POLICY "admins_view_all_users" ON public.users
    FOR SELECT USING (public.is_admin_user());

-- Admins can update user roles and subscriptions
CREATE POLICY "admins_manage_users" ON public.users
    FOR ALL USING (public.is_admin_user());

-- 10. Update business policies to use role-based access
DROP POLICY IF EXISTS "owners_manage_businesses" ON public.businesses;

CREATE POLICY "business_users_manage_own" ON public.businesses
    FOR ALL USING (
        owner_id = auth.uid() 
        AND public.is_business_user()
        AND public.has_business_subscription()
    );

-- 11. Verify the new structure
SELECT 'FINAL USER STRUCTURE' as info;
SELECT 
    user_role,
    is_admin,
    subscription_status,
    COUNT(*) as count
FROM public.users
GROUP BY user_role, is_admin, subscription_status
ORDER BY user_role;

-- 12. Show sample users with roles
SELECT 
    email,
    user_role,
    is_admin,
    subscription_status,
    created_at
FROM public.users
ORDER BY created_at DESC
LIMIT 10;

-- SUCCESS! Now you have:
-- ✅ Single users table with role-based access
-- ✅ Clean role management (consumer/business/admin)
-- ✅ Subscription status for business features
-- ✅ Proper RLS policies based on roles
-- ✅ Auto-sync from auth.users with role detection
-- ✅ Helper functions for easy role checking

COMMENT ON TABLE public.users IS 'Single users table with role-based access. All users (consumers, business owners, admins) are stored here with appropriate role tags.';
COMMENT ON COLUMN public.users.user_role IS 'User role: consumer, business, admin, super_admin';
COMMENT ON COLUMN public.users.is_admin IS 'Quick admin flag for easy admin checks';
COMMENT ON COLUMN public.users.subscription_status IS 'Subscription status for business features: free, active, cancelled';
COMMENT ON COLUMN public.users.subscription_period_end IS 'When business subscription expires';