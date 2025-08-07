-- Fix Subscription Status Check Constraint
-- The constraint is rejecting 'free' status, let's fix it

-- 1. First, let's see what constraints exist on the users table
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'users' 
AND tc.table_schema = 'public'
AND tc.constraint_type = 'CHECK';

-- 2. Drop the problematic constraint
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_subscription_status_check;

-- 3. Add the correct constraint with all valid subscription statuses
ALTER TABLE public.users 
ADD CONSTRAINT users_subscription_status_check 
CHECK (subscription_status IN ('free', 'active', 'cancelled', 'past_due', 'unpaid', 'trialing'));

-- 4. Also make sure user_role constraint is correct
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_user_role_check;
ALTER TABLE public.users 
ADD CONSTRAINT users_user_role_check 
CHECK (user_role IN ('consumer', 'business', 'admin', 'super_admin'));

-- 5. Now let's retry the user sync that was failing
-- This should work now with the correct constraint
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
    full_name = EXCLUDED.full_name,
    user_role = EXCLUDED.user_role,
    is_admin = EXCLUDED.is_admin,
    subscription_status = EXCLUDED.subscription_status,
    updated_at = NOW();

-- 6. Verify the fix worked
SELECT 'CONSTRAINT FIX VERIFICATION' as info;

-- Check constraints are now correct
SELECT 
    constraint_name,
    check_clause
FROM information_schema.check_constraints 
WHERE constraint_name LIKE '%subscription_status%' 
OR constraint_name LIKE '%user_role%';

-- Check user count after fix
SELECT 
    'Users synced successfully' as status,
    COUNT(*) as total_users,
    COUNT(CASE WHEN subscription_status = 'free' THEN 1 END) as free_users,
    COUNT(CASE WHEN subscription_status = 'active' THEN 1 END) as active_users
FROM public.users;

-- Show sample users to confirm they were created properly
SELECT 
    email,
    user_role,
    subscription_status,
    is_admin,
    created_at
FROM public.users
ORDER BY created_at DESC
LIMIT 5;

-- SUCCESS! The constraint issue should now be resolved