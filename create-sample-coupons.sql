-- Create sample coupons for testing consumer discovery features

-- First, let's create some sample coupons if we don't have any
DO $$
DECLARE
    sample_business_id UUID;
BEGIN
    -- Get a sample business ID, or create one if none exists
    SELECT id INTO sample_business_id 
    FROM public.businesses 
    WHERE active = true 
    LIMIT 1;
    
    IF sample_business_id IS NULL THEN
        -- Create a sample business for testing
        INSERT INTO public.businesses (
            name, description, category, email, contact_name,
            formatted_address, city, state, zip_code,
            latitude, longitude, active
        ) VALUES (
            'Sample Coffee Shop',
            'A cozy coffee shop for testing coupon discovery',
            'Food & Beverage',
            'coffee@sample.test',
            'Test Owner',
            '123 Main Street, New York, NY 10001',
            'New York',
            'NY',
            '10001',
            40.7128,
            -74.0060,
            true
        ) RETURNING id INTO sample_business_id;
    END IF;
    
    -- Create sample coupons with varied characteristics
    INSERT INTO public.coupons (
        business_id, title, description, discount_text, discount_type, discount_value,
        minimum_purchase, maximum_discount, start_date, end_date, usage_limit,
        active, featured, current_usage_count
    ) VALUES 
    -- Featured coupon
    (sample_business_id, '20% Off Your First Order', 'Welcome new customers with this special discount', '20% off', 'percentage', 20, 15.00, 10.00, NOW(), NOW() + INTERVAL '30 days', 'unlimited', true, true, 0),
    
    -- New coupon (created recently)
    (sample_business_id, 'Free Coffee with Pastry', 'Buy any pastry and get a free coffee', 'Free coffee', 'buy_one_get_one', 0, 5.00, NULL, NOW() - INTERVAL '2 days', NOW() + INTERVAL '14 days', 'once_per_user', true, false, 0),
    
    -- Expiring soon coupon
    (sample_business_id, '$5 Off Large Orders', 'Save $5 on orders over $25', '$5 off', 'fixed_amount', 5, 25.00, NULL, NOW() - INTERVAL '15 days', NOW() + INTERVAL '3 days', 'unlimited', true, false, 3),
    
    -- Popular coupon (with usage)
    (sample_business_id, 'Happy Hour - 15% Off', 'Daily happy hour special discount', '15% off', 'percentage', 15, 10.00, NULL, NOW() - INTERVAL '7 days', NOW() + INTERVAL '21 days', 'unlimited', true, false, 15),
    
    -- High-value coupon for savings test
    (sample_business_id, '$10 Off Premium Orders', 'Save big on premium menu items', '$10 off', 'fixed_amount', 10, 40.00, NULL, NOW(), NOW() + INTERVAL '45 days', 'once_per_user', true, false, 2);
    
    RAISE NOTICE 'Created 5 sample coupons for testing';
END $$;

-- Update redemption counts for testing popularity sorting
-- Simulate some redemptions for the popular coupon
INSERT INTO public.coupon_redemptions (coupon_id, user_id, redeemed_at)
SELECT 
    c.id,
    u.id,
    NOW() - INTERVAL '1 day' * (ROW_NUMBER() OVER ())
FROM public.coupons c
CROSS JOIN (
    SELECT id FROM public.users LIMIT 3
) u
WHERE c.title = 'Happy Hour - 15% Off'
ON CONFLICT (coupon_id, user_id) DO NOTHING;

-- Show created sample data
SELECT 'SAMPLE COUPONS CREATED' as info;
SELECT 
    c.title,
    c.discount_text,
    c.discount_type,
    c.discount_value,
    c.featured,
    c.active,
    EXTRACT(DAYS FROM (c.end_date - NOW())) as days_until_expiry,
    b.name as business_name
FROM public.coupons c
JOIN public.businesses b ON c.business_id = b.id
WHERE c.active = true
ORDER BY c.created_at DESC;