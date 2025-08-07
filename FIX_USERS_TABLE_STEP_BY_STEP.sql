-- Fix Users Table Step by Step
-- Add missing columns and constraints properly

-- 1. First, let's see what columns currently exist
SELECT 'CURRENT USERS TABLE STRUCTURE' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Add missing columns one by one (only if they don't exist)
DO $$
BEGIN
    -- Add user_role column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'user_role' AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.users ADD COLUMN user_role VARCHAR(20) DEFAULT 'consumer';
        RAISE NOTICE 'Added user_role column';
    ELSE
        RAISE NOTICE 'user_role column already exists';
    END IF;
    
    -- Add is_admin column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'is_admin' AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added is_admin column';
    ELSE
        RAISE NOTICE 'is_admin column already exists';
    END IF;
    
    -- Add subscription_status column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'subscription_status' AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.users ADD COLUMN subscription_status VARCHAR(20) DEFAULT 'free';
        RAISE NOTICE 'Added subscription_status column';
    ELSE
        RAISE NOTICE 'subscription_status column already exists';
    END IF;
    
    -- Add subscription_period_end column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'subscription_period_end' AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.users ADD COLUMN subscription_period_end TIMESTAMPTZ;
        RAISE NOTICE 'Added subscription_period_end column';
    ELSE
        RAISE NOTICE 'subscription_period_end column already exists';
    END IF;
END $$;

-- 3. Remove any existing problematic constraints
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_subscription_status_check;
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_user_role_check;

-- 4. Add proper constraints
ALTER TABLE public.users 
ADD CONSTRAINT users_subscription_status_check 
CHECK (subscription_status IN ('free', 'active', 'cancelled', 'past_due', 'unpaid', 'trialing'));

ALTER TABLE public.users 
ADD CONSTRAINT users_user_role_check 
CHECK (user_role IN ('consumer', 'business', 'admin', 'super_admin'));

-- 5. Show updated table structure
SELECT 'UPDATED USERS TABLE STRUCTURE' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. Now sync existing auth users to public users (with proper columns)
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
AND au.email IS NOT NULL
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
    user_role = EXCLUDED.user_role,
    is_admin = EXCLUDED.is_admin,
    subscription_status = EXCLUDED.subscription_status,
    updated_at = NOW();

-- 7. Update the trigger function
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
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
        user_role = EXCLUDED.user_role,
        is_admin = EXCLUDED.is_admin,
        subscription_status = EXCLUDED.subscription_status,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. Verify everything worked
SELECT 'FINAL VERIFICATION' as info;

-- Show user counts by role and subscription
SELECT 
    user_role,
    subscription_status,
    COUNT(*) as count
FROM public.users
GROUP BY user_role, subscription_status
ORDER BY user_role, subscription_status;

-- Show sample users
SELECT 
    email,
    user_role,
    subscription_status,
    is_admin,
    created_at
FROM public.users
ORDER BY created_at DESC
LIMIT 5;

-- SUCCESS! Users table is now properly structured with role-based access