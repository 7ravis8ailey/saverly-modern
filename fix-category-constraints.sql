-- Fix business category constraints
-- Check and update the allowed categories

-- First, see what the current constraint allows
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname LIKE '%businesses_category%';

-- Check what categories are currently in use
SELECT DISTINCT category, COUNT(*) as count
FROM public.businesses 
GROUP BY category 
ORDER BY count DESC;

-- Update the constraint to allow more categories including 'Testing' and 'Integration Testing'
ALTER TABLE public.businesses 
DROP CONSTRAINT IF EXISTS businesses_category_check;

-- Create a more comprehensive constraint that includes all the categories we need
ALTER TABLE public.businesses 
ADD CONSTRAINT businesses_category_check 
CHECK (category IN (
    'Food & Beverage',
    'Retail', 
    'Health & Wellness',
    'Entertainment & Recreation',
    'Personal Services',
    'Professional Services',
    'Automotive',
    'Home & Garden',
    'Beauty & Spa',
    'Fitness & Sports',
    'Education',
    'Technology',
    'Testing',
    'Integration Testing',
    'Other'
));

-- Show the updated constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname LIKE '%businesses_category%';