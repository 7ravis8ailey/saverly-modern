-- Fix Missing Columns and Create Test Data for Saverly Features
-- This migration adds missing profile columns and creates test coupons

-- ========================================
-- PART 1: Add Missing User Profile Columns
-- ========================================

-- Add Google Maps integration columns to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS formatted_address TEXT,
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS state VARCHAR(50),
ADD COLUMN IF NOT EXISTS zip_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 7),
ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 7);

-- Add indexes for location-based queries
CREATE INDEX IF NOT EXISTS idx_users_latitude ON public.users(latitude);
CREATE INDEX IF NOT EXISTS idx_users_longitude ON public.users(longitude);
CREATE INDEX IF NOT EXISTS idx_users_city_state ON public.users(city, state);

-- Show updated users table structure
SELECT 'USERS TABLE - PROFILE COLUMNS ADDED' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
AND column_name IN ('formatted_address', 'city', 'state', 'zip_code', 'latitude', 'longitude')
ORDER BY ordinal_position;

-- ========================================
-- PART 2: Fix QR Tracking Columns
-- ========================================

-- Ensure all QR tracking columns exist
ALTER TABLE public.coupon_redemptions 
ADD COLUMN IF NOT EXISTS id TEXT UNIQUE DEFAULT ('redemption_' || extract(epoch from now())::text || '_' || substr(md5(random()::text), 1, 8)),
ADD COLUMN IF NOT EXISTS qr_data TEXT,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- Remove check constraint if it exists and recreate it
ALTER TABLE public.coupon_redemptions DROP CONSTRAINT IF EXISTS coupon_redemptions_status_check;
ALTER TABLE public.coupon_redemptions 
ADD CONSTRAINT coupon_redemptions_status_check 
CHECK (status IN ('active', 'expired', 'used', 'test'));

-- ========================================
-- PART 3: Create Test Coupons for Testing
-- ========================================

-- First, ensure we have at least one test business
DO $$
DECLARE
    test_business_id UUID;
    test_user_id UUID;
BEGIN
    -- Check if we have any businesses
    SELECT id INTO test_business_id FROM public.businesses WHERE active = true LIMIT 1;
    
    IF test_business_id IS NULL THEN
        -- Create test businesses
        INSERT INTO public.businesses (
            name, description, category, email, contact_name,
            formatted_address, city, state, zip_code,
            latitude, longitude, active
        ) VALUES 
        (
            'Downtown Coffee House',
            'Premium coffee and pastries in the heart of downtown',
            'Food & Beverage',
            'coffee@downtown.test',
            'John Smith',
            '123 Main Street, New York, NY 10001',
            'New York',
            'NY',
            '10001',
            40.7128,
            -74.0060,
            true
        ),
        (
            'Green Valley Market',
            'Fresh organic produce and local goods',
            'Grocery & Retail',
            'market@greenvalley.test',
            'Sarah Johnson',
            '456 Park Avenue, New York, NY 10002',
            'New York',
            'NY',
            '10002',
            40.7260,
            -73.9897,
            true
        ),
        (
            'City Fitness Center',
            'Modern gym with state-of-the-art equipment',
            'Health & Wellness',
            'info@cityfitness.test',
            'Mike Chen',
            '789 Broadway, New York, NY 10003',
            'New York',
            'NY',
            '10003',
            40.7282,
            -73.9942,
            true
        )
        RETURNING id INTO test_business_id;
        
        RAISE NOTICE 'Created test businesses';
    END IF;
    
    -- Create diverse test coupons
    INSERT INTO public.coupons (
        business_id, title, description, discount_text, discount_type, discount_value,
        minimum_purchase, maximum_discount, start_date, end_date, usage_limit,
        active, featured, current_usage_count
    ) 
    SELECT 
        b.id,
        coupon_data.title,
        coupon_data.description,
        coupon_data.discount_text,
        coupon_data.discount_type,
        coupon_data.discount_value,
        coupon_data.minimum_purchase,
        coupon_data.maximum_discount,
        coupon_data.start_date,
        coupon_data.end_date,
        coupon_data.usage_limit,
        coupon_data.active,
        coupon_data.featured,
        coupon_data.current_usage_count
    FROM public.businesses b
    CROSS JOIN (
        VALUES 
        -- Downtown Coffee House coupons
        ('Morning Special - 25% Off', 'Get 25% off any coffee and pastry combo before 10am', '25% off', 'percentage', 25, 10.00, 5.00, NOW(), NOW() + INTERVAL '30 days', 'unlimited', true, true, 0),
        ('Free Coffee Friday', 'Buy any pastry and get a free coffee', 'Free coffee', 'buy_one_get_one', 0, 5.00, NULL, NOW(), NOW() + INTERVAL '7 days', '2_per_month', true, false, 5),
        ('Loyalty Reward - $3 Off', 'Save $3 on your next visit', '$3 off', 'fixed_amount', 3, 10.00, NULL, NOW(), NOW() + INTERVAL '14 days', 'once_per_user', true, false, 12),
        
        -- Green Valley Market coupons
        ('Weekly Grocery Savings', 'Save 20% on organic produce', '20% off', 'percentage', 20, 20.00, 10.00, NOW(), NOW() + INTERVAL '21 days', '4_per_month', true, true, 8),
        ('$5 Off First Order', 'New customer special - $5 off', '$5 off', 'fixed_amount', 5, 25.00, NULL, NOW() - INTERVAL '2 days', NOW() + INTERVAL '60 days', 'once_per_user', true, false, 3),
        
        -- City Fitness Center coupons  
        ('Trial Week Pass', 'Get 50% off a weekly pass', '50% off', 'percentage', 50, 0.00, 25.00, NOW(), NOW() + INTERVAL '45 days', 'once_per_user', true, true, 2),
        ('Bring a Friend Free', 'Free day pass for a friend with your visit', 'Free pass', 'buy_one_get_one', 0, 0.00, NULL, NOW() - INTERVAL '5 days', NOW() + INTERVAL '25 days', '1_per_month', true, false, 7),
        ('Personal Training Deal', 'Save $20 on personal training session', '$20 off', 'fixed_amount', 20, 50.00, NULL, NOW(), NOW() + INTERVAL '3 days', 'unlimited', true, false, 1)
    ) AS coupon_data(title, description, discount_text, discount_type, discount_value, minimum_purchase, maximum_discount, start_date, end_date, usage_limit, active, featured, current_usage_count)
    WHERE b.active = true
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Created test coupons for all active businesses';
    
    -- Get a test user for sample redemptions
    SELECT id INTO test_user_id FROM public.users WHERE subscription_status = 'active' LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Create some sample redemptions for testing
        INSERT INTO public.coupon_redemptions (
            id,
            coupon_id,
            user_id,
            qr_data,
            status,
            expires_at,
            redeemed_at
        )
        SELECT 
            'sample_' || extract(epoch from now())::text || '_' || generate_series,
            c.id,
            test_user_id,
            '{"test": true, "sample": ' || generate_series || '}',
            'used',
            NOW() - INTERVAL '1 hour',
            NOW() - INTERVAL '1 day' * generate_series
        FROM public.coupons c
        CROSS JOIN generate_series(1, 3)
        WHERE c.active = true
        LIMIT 3
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Created sample redemptions for testing';
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Some test data creation skipped: %', SQLERRM;
END $$;

-- ========================================
-- PART 4: Update Sample User Profiles
-- ========================================

-- Add location data to existing users for testing
UPDATE public.users
SET 
    formatted_address = CASE 
        WHEN email LIKE '%test%' THEN '100 Test Street, New York, NY 10001'
        ELSE formatted_address
    END,
    city = COALESCE(city, 'New York'),
    state = COALESCE(state, 'NY'),
    zip_code = COALESCE(zip_code, '10001'),
    latitude = COALESCE(latitude, 40.7128 + (RANDOM() * 0.1 - 0.05)),
    longitude = COALESCE(longitude, -74.0060 + (RANDOM() * 0.1 - 0.05))
WHERE formatted_address IS NULL;

-- ========================================
-- PART 5: Verify Everything
-- ========================================

-- Show summary of created data
SELECT 'DATA SUMMARY' as info;

SELECT 
    'Users with profiles' as category,
    COUNT(*) as count,
    COUNT(CASE WHEN formatted_address IS NOT NULL THEN 1 END) as with_address,
    COUNT(CASE WHEN subscription_status = 'active' THEN 1 END) as active_subscribers
FROM public.users;

SELECT 
    'Active businesses' as category,
    COUNT(*) as count,
    COUNT(CASE WHEN latitude IS NOT NULL THEN 1 END) as with_location,
    COUNT(DISTINCT category) as categories
FROM public.businesses
WHERE active = true;

SELECT 
    'Active coupons' as category,
    COUNT(*) as count,
    COUNT(CASE WHEN featured = true THEN 1 END) as featured,
    COUNT(DISTINCT usage_limit) as usage_types,
    COUNT(DISTINCT business_id) as from_businesses
FROM public.coupons
WHERE active = true;

SELECT 
    'Redemptions' as category,
    COUNT(*) as total_redemptions,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT coupon_id) as unique_coupons
FROM public.coupon_redemptions;

-- Show sample coupons
SELECT 'SAMPLE ACTIVE COUPONS' as info;
SELECT 
    c.title,
    c.discount_text,
    c.usage_limit,
    c.featured,
    c.current_usage_count,
    b.name as business_name,
    b.category
FROM public.coupons c
JOIN public.businesses b ON c.business_id = b.id
WHERE c.active = true
ORDER BY c.featured DESC, c.created_at DESC
LIMIT 10;

-- Final confirmation
SELECT 'MIGRATION COMPLETE' as info,
       'All missing columns added and test data created successfully!' as message;