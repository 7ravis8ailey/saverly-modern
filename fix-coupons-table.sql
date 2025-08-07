-- Fix coupons table - ensure all required columns exist

-- Check current coupons table structure
SELECT 'CURRENT COUPONS TABLE STRUCTURE' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'coupons' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Add missing columns to coupons table
ALTER TABLE public.coupons 
ADD COLUMN IF NOT EXISTS current_usage_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS minimum_purchase NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS maximum_discount NUMERIC,
ADD COLUMN IF NOT EXISTS usage_limit_per_user INTEGER,
ADD COLUMN IF NOT EXISTS total_usage_limit INTEGER,
ADD COLUMN IF NOT EXISTS terms_conditions TEXT,
ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;

-- Ensure proper indexes exist
CREATE INDEX IF NOT EXISTS idx_coupons_business_id ON public.coupons(business_id);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON public.coupons(active);
CREATE INDEX IF NOT EXISTS idx_coupons_dates ON public.coupons(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_coupons_featured ON public.coupons(featured);

-- Update existing coupons with default values where needed
UPDATE public.coupons 
SET 
    current_usage_count = COALESCE(current_usage_count, 0),
    minimum_purchase = COALESCE(minimum_purchase, 0),
    featured = COALESCE(featured, false)
WHERE current_usage_count IS NULL 
   OR minimum_purchase IS NULL 
   OR featured IS NULL;

-- Show updated structure
SELECT 'UPDATED COUPONS TABLE STRUCTURE' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'coupons' AND table_schema = 'public'
ORDER BY ordinal_position;