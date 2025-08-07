-- Add missing columns for enhanced consumer coupon discovery

-- Check current coupons table structure
SELECT 'CURRENT COUPONS TABLE STRUCTURE' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'coupons' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Add missing columns that are needed for enhanced discovery
ALTER TABLE public.coupons 
ADD COLUMN IF NOT EXISTS discount_text TEXT,
ADD COLUMN IF NOT EXISTS discount_type VARCHAR(50) DEFAULT 'percentage',
ADD COLUMN IF NOT EXISTS discount_value NUMERIC,
ADD COLUMN IF NOT EXISTS minimum_purchase NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS maximum_discount NUMERIC,
ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;

-- Update existing coupons with default values
UPDATE public.coupons 
SET 
    discount_text = COALESCE(discount_text, discount, title),
    discount_type = COALESCE(discount_type, 'percentage'),
    discount_value = CASE 
        WHEN discount_text ILIKE '%off%' OR discount_text ILIKE '%%' THEN 
            CASE 
                WHEN discount_text ~ '\d+%' THEN 
                    CAST(REGEXP_REPLACE(discount_text, '[^0-9]', '', 'g') AS NUMERIC)
                ELSE 20  -- Default percentage
            END
        WHEN discount_text ~ '\$\d+' THEN
            CAST(REGEXP_REPLACE(discount_text, '[^0-9.]', '', 'g') AS NUMERIC)
        ELSE 10  -- Default value
    END,
    minimum_purchase = COALESCE(minimum_purchase, 0),
    featured = COALESCE(featured, false)
WHERE discount_text IS NULL 
   OR discount_type IS NULL 
   OR discount_value IS NULL 
   OR minimum_purchase IS NULL 
   OR featured IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_coupons_discount_type ON public.coupons(discount_type);
CREATE INDEX IF NOT EXISTS idx_coupons_discount_value ON public.coupons(discount_value);
CREATE INDEX IF NOT EXISTS idx_coupons_featured ON public.coupons(featured);
CREATE INDEX IF NOT EXISTS idx_coupons_minimum_purchase ON public.coupons(minimum_purchase);

-- Add some sample featured coupons (mark top 3 as featured)
UPDATE public.coupons 
SET featured = true 
WHERE id IN (
    SELECT id 
    FROM public.coupons 
    WHERE active = true 
    AND end_date > NOW()
    ORDER BY created_at DESC 
    LIMIT 3
);

-- Show updated structure
SELECT 'UPDATED COUPONS TABLE STRUCTURE' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'coupons' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show sample data with new columns
SELECT 'SAMPLE COUPON DATA' as info;
SELECT 
    id, title, discount_text, discount_type, discount_value,
    minimum_purchase, maximum_discount, featured, active, created_at
FROM public.coupons
WHERE active = true
ORDER BY created_at DESC
LIMIT 5;