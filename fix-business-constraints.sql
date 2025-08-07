-- Fix business table constraints
-- Remove NOT NULL constraint from address column and add proper defaults

-- Check current structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'businesses' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Make address column nullable (it may be required as NOT NULL)
ALTER TABLE public.businesses ALTER COLUMN address DROP NOT NULL;

-- Also check if other columns have unexpected constraints
-- Update any existing businesses with missing data
UPDATE public.businesses 
SET 
    contact_name = COALESCE(contact_name, 'Business Owner'),
    formatted_address = COALESCE(formatted_address, address),
    city = COALESCE(city, 'Unknown'),
    state = COALESCE(state, 'Unknown'),
    zip_code = COALESCE(zip_code, '00000'),
    created_at = COALESCE(created_at, NOW()),
    updated_at = COALESCE(updated_at, NOW())
WHERE contact_name IS NULL 
   OR formatted_address IS NULL 
   OR city IS NULL 
   OR state IS NULL 
   OR zip_code IS NULL 
   OR created_at IS NULL 
   OR updated_at IS NULL;

-- Show updated structure
SELECT 'UPDATED BUSINESS TABLE STRUCTURE' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'businesses' AND table_schema = 'public'
ORDER BY ordinal_position;