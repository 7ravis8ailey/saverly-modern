-- Fix User Profile Sync - Create public.users records for existing auth users
-- This will fix the foreign key constraint issue

-- 1. First, let's see what users we have in auth vs public
-- (This is just for information - will show in results)
SELECT 'AUTH USERS' as table_name, COUNT(*) as count FROM auth.users
UNION ALL
SELECT 'PUBLIC USERS' as table_name, COUNT(*) as count FROM public.users;

-- 2. Create public.users records for all existing auth.users
-- This syncs the auth users to the public users table
INSERT INTO public.users (
  id,
  email,
  full_name,
  user_type,
  created_at,
  updated_at
)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', 'Saverly User') as full_name,
  COALESCE(au.raw_user_meta_data->>'user_type', 'consumer') as user_type,
  au.created_at,
  NOW() as updated_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL  -- Only insert if not already exists
AND au.email IS NOT NULL;

-- 3. Create a trigger to automatically sync future users
-- This ensures new registrations automatically create public.users records

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    full_name,
    user_type,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Saverly User'),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'consumer'),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Verify the sync worked
SELECT 'AFTER SYNC - AUTH USERS' as table_name, COUNT(*) as count FROM auth.users
UNION ALL
SELECT 'AFTER SYNC - PUBLIC USERS' as table_name, COUNT(*) as count FROM public.users;

-- 5. Show sample of synced users
SELECT 
  id,
  email,
  full_name,
  user_type,
  created_at
FROM public.users
ORDER BY created_at DESC
LIMIT 5;

-- Success! Now businesses can reference users in public.users table
-- Future user registrations will automatically create public.users records