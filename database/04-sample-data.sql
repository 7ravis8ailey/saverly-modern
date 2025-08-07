-- =====================================================
-- SAVERLY MODERN v2.0.0 - SAMPLE DATA
-- =====================================================
-- This file contains sample data for testing and development
-- Apply this AFTER 03-functions-triggers.sql via Supabase Dashboard > SQL Editor

-- =====================================================
-- INSERT SUBSCRIPTION PLANS
-- =====================================================

INSERT INTO public.subscription_plans (uid, name, description, price_monthly, price_yearly, stripe_price_id_monthly, stripe_price_id_yearly, features, max_redemptions_per_month, is_active, sort_order) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Basic', 'Perfect for occasional coupon users', 9.99, 99.99, 'price_basic_monthly', 'price_basic_yearly', 
 '["Up to 5 coupon redemptions per month", "Access to all local businesses", "Mobile app access", "Email support"]'::jsonb, 
 5, true, 1),

('550e8400-e29b-41d4-a716-446655440002', 'Premium', 'Great for regular savers', 19.99, 199.99, 'price_premium_monthly', 'price_premium_yearly',
 '["Up to 15 coupon redemptions per month", "Priority access to new coupons", "Advanced filtering and search", "Push notifications", "Phone support"]'::jsonb,
 15, true, 2),

('550e8400-e29b-41d4-a716-446655440003', 'Unlimited', 'For the ultimate deal hunters', 29.99, 299.99, 'price_unlimited_monthly', 'price_unlimited_yearly',
 '["Unlimited coupon redemptions", "Early access to exclusive deals", "Personalized recommendations", "Premium customer support", "Advanced analytics"]'::jsonb,
 null, true, 3);

-- =====================================================
-- CREATE SAMPLE ADMIN USER
-- =====================================================
-- Note: This creates the user profile. The actual auth user must be created through Supabase Auth

INSERT INTO public.users (uid, auth_uid, full_name, email, account_type, is_admin, subscription_status, profile_completed, email_verified) VALUES
('00000000-0000-0000-0000-000000000001', null, 'Admin User', 'admin@saverly.com', 'admin', true, 'active', true, true);

-- =====================================================
-- CREATE SAMPLE BUSINESSES
-- =====================================================

INSERT INTO public.businesses (uid, name, description, category, address, city, state, zip_code, latitude, longitude, phone, email, contact_name, website_url, hours_of_operation, is_verified, is_active, logo_url) VALUES

-- Coffee & Food
('10000000-0000-0000-0000-000000000001', 'The Daily Grind Coffee', 'Artisan coffee shop with locally roasted beans and fresh pastries', 'Food & Beverage', 
 '123 Main Street', 'Austin', 'TX', '78701', 30.2672, -97.7431, '(512) 555-0101', 'info@dailygrind.com', 'Sarah Johnson',
 'https://dailygrind.com', 
 '{"monday": {"open": "06:00", "close": "18:00"}, "tuesday": {"open": "06:00", "close": "18:00"}, "wednesday": {"open": "06:00", "close": "18:00"}, "thursday": {"open": "06:00", "close": "18:00"}, "friday": {"open": "06:00", "close": "19:00"}, "saturday": {"open": "07:00", "close": "19:00"}, "sunday": {"open": "07:00", "close": "17:00"}}'::jsonb,
 true, true, 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=200'),

('10000000-0000-0000-0000-000000000002', 'Bella Vista Italian Restaurant', 'Authentic Italian cuisine with homemade pasta and wood-fired pizza', 'Food & Beverage',
 '456 Oak Avenue', 'Austin', 'TX', '78702', 30.2641, -97.7323, '(512) 555-0102', 'contact@bellavista.com', 'Marco Rossi',
 'https://bellavista.com',
 '{"tuesday": {"open": "17:00", "close": "22:00"}, "wednesday": {"open": "17:00", "close": "22:00"}, "thursday": {"open": "17:00", "close": "22:00"}, "friday": {"open": "17:00", "close": "23:00"}, "saturday": {"open": "12:00", "close": "23:00"}, "sunday": {"open": "12:00", "close": "21:00"}, "monday": "closed"}'::jsonb,
 true, true, 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200'),

-- Retail
('10000000-0000-0000-0000-000000000003', 'Austin Outfitters', 'Outdoor gear and clothing for Texas adventures', 'Retail',
 '789 Congress Ave', 'Austin', 'TX', '78701', 30.2656, -97.7467, '(512) 555-0103', 'hello@austinoutfitters.com', 'Jake Martinez',
 'https://austinoutfitters.com',
 '{"monday": {"open": "10:00", "close": "20:00"}, "tuesday": {"open": "10:00", "close": "20:00"}, "wednesday": {"open": "10:00", "close": "20:00"}, "thursday": {"open": "10:00", "close": "20:00"}, "friday": {"open": "10:00", "close": "21:00"}, "saturday": {"open": "09:00", "close": "21:00"}, "sunday": {"open": "11:00", "close": "19:00"}}'::jsonb,
 true, true, 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200'),

-- Health & Wellness
('10000000-0000-0000-0000-000000000004', 'Zen Yoga Studio', 'Peaceful yoga classes for all levels with experienced instructors', 'Health & Wellness',
 '321 Fitness Way', 'Austin', 'TX', '78704', 30.2518, -97.7594, '(512) 555-0104', 'namaste@zenyoga.com', 'Lisa Chen',
 'https://zenyoga.com',
 '{"monday": {"open": "06:00", "close": "21:00"}, "tuesday": {"open": "06:00", "close": "21:00"}, "wednesday": {"open": "06:00", "close": "21:00"}, "thursday": {"open": "06:00", "close": "21:00"}, "friday": {"open": "06:00", "close": "20:00"}, "saturday": {"open": "07:00", "close": "18:00"}, "sunday": {"open": "08:00", "close": "18:00"}}'::jsonb,
 true, true, 'https://images.unsplash.com/photo-1588286840104-8957b019727f?w=200'),

-- Personal Services
('10000000-0000-0000-0000-000000000005', 'Luxe Hair Salon', 'Full-service salon with cutting-edge styles and premium products', 'Personal Services',
 '654 Beauty Blvd', 'Austin', 'TX', '78703', 30.2899, -97.7421, '(512) 555-0105', 'book@luxehair.com', 'Amanda Rodriguez',
 'https://luxehair.com',
 '{"tuesday": {"open": "09:00", "close": "19:00"}, "wednesday": {"open": "09:00", "close": "19:00"}, "thursday": {"open": "09:00", "close": "20:00"}, "friday": {"open": "09:00", "close": "20:00"}, "saturday": {"open": "08:00", "close": "18:00"}, "sunday": {"open": "10:00", "close": "17:00"}, "monday": "closed"}'::jsonb,
 true, true, 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=200'),

-- Entertainment
('10000000-0000-0000-0000-000000000006', 'Regal Cinema Austin', 'Modern movie theater with IMAX and premium seating', 'Entertainment & Recreation',
 '987 Entertainment Dr', 'Austin', 'TX', '78705', 30.3072, -97.7364, '(512) 555-0106', 'info@regalaustin.com', 'David Park',
 'https://regalcinemas.com/austin',
 '{"monday": {"open": "11:00", "close": "23:00"}, "tuesday": {"open": "11:00", "close": "23:00"}, "wednesday": {"open": "11:00", "close": "23:00"}, "thursday": {"open": "11:00", "close": "23:00"}, "friday": {"open": "11:00", "close": "24:00"}, "saturday": {"open": "10:00", "close": "24:00"}, "sunday": {"open": "11:00", "close": "23:00"}}'::jsonb,
 true, true, 'https://images.unsplash.com/photo-1489185988155-0e2097b6b265?w=200');

-- =====================================================
-- CREATE SAMPLE COUPONS
-- =====================================================

INSERT INTO public.coupons (uid, business_uid, title, description, discount, terms_and_conditions, start_date, end_date, active, usage_limit, monthly_limit, max_total_redemptions, coupon_type, discount_value, min_purchase_amount, featured, priority) VALUES

-- Daily Grind Coffee Coupons
('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 
 'Free Coffee with Pastry', 'Get a free regular coffee when you purchase any pastry', 'Free regular coffee', 
 'Valid with purchase of any pastry. Cannot be combined with other offers. One per customer per day.',
 NOW() - INTERVAL '1 day', NOW() + INTERVAL '30 days', true, 'daily', null, 100, 'free_item', 4.50, 3.00, true, 10),

('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001',
 '20% Off All Beverages', 'Save 20% on all coffee drinks and specialty beverages', '20% off',
 'Valid on all beverages. Cannot be combined with other offers.',
 NOW() - INTERVAL '2 days', NOW() + INTERVAL '45 days', true, 'monthly', 3, 200, 'percentage', 20.00, null, false, 5),

-- Bella Vista Restaurant Coupons
('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002',
 'Buy One Entree, Get One 50% Off', 'Second entree of equal or lesser value at 50% off', 'BOGO 50% off',
 'Valid Tuesday-Thursday. Second entree must be of equal or lesser value. Cannot be combined with other offers.',
 NOW() - INTERVAL '1 day', NOW() + INTERVAL '60 days', true, 'weekly', null, 150, 'bogo', 50.00, 25.00, true, 15),

('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002',
 '$10 Off Dinner for Two', 'Save $10 when you spend $40 or more', '$10 off',
 'Valid for dinner service only. Minimum purchase $40. Cannot be combined with other offers.',
 NOW() - INTERVAL '3 days', NOW() + INTERVAL '30 days', true, 'one_time', null, 75, 'fixed_amount', 10.00, 40.00, false, 8),

-- Austin Outfitters Coupons
('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000003',
 '25% Off Hiking Gear', 'Save 25% on all hiking and camping equipment', '25% off',
 'Valid on hiking boots, backpacks, tents, and camping gear. Excludes sale items.',
 NOW() - INTERVAL '1 day', NOW() + INTERVAL '90 days', true, 'monthly', 2, 300, 'percentage', 25.00, null, true, 12),

-- Zen Yoga Studio Coupons
('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000004',
 'Free First Class', 'Complimentary first yoga class for new students', 'Free class',
 'Valid for new students only. Must present valid ID. Cannot be combined with other offers.',
 NOW() - INTERVAL '1 day', NOW() + INTERVAL '365 days', true, 'one_time', null, 500, 'free_item', 25.00, null, true, 20),

('20000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000004',
 '15% Off Monthly Membership', 'Save 15% on your first month of unlimited yoga', '15% off',
 'Valid for new memberships only. Auto-renews at regular price.',
 NOW() - INTERVAL '2 days', NOW() + INTERVAL '60 days', true, 'one_time', null, 100, 'percentage', 15.00, null, false, 7),

-- Luxe Hair Salon Coupons
('20000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000005',
 '$20 Off Color Service', 'Save $20 on any hair coloring service over $100', '$20 off',
 'Valid on color services over $100. Cannot be combined with other offers. Appointment required.',
 NOW() - INTERVAL '1 day', NOW() + INTERVAL '45 days', true, 'monthly', 1, 50, 'fixed_amount', 20.00, 100.00, false, 6),

-- Regal Cinema Coupons
('20000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000006',
 'Free Small Popcorn', 'Complimentary small popcorn with any movie ticket', 'Free small popcorn',
 'Valid with purchase of any movie ticket. One per transaction.',
 NOW() - INTERVAL '1 day', NOW() + INTERVAL '30 days', true, 'daily', null, 1000, 'free_item', 6.50, 12.00, true, 9),

('20000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000006',
 'Tuesday Movie Special', '$5 off any Tuesday showing', '$5 off',
 'Valid Tuesdays only. Cannot be combined with other offers or matinee pricing.',
 NOW() - INTERVAL '7 days', NOW() + INTERVAL '60 days', true, 'weekly', null, 200, 'fixed_amount', 5.00, null, false, 4);

-- =====================================================
-- CREATE SAMPLE SUBSCRIBER USERS
-- =====================================================
-- Note: These create user profiles. Actual auth users must be created through Supabase Auth

INSERT INTO public.users (uid, auth_uid, full_name, email, phone, address, city, state, zip_code, latitude, longitude, account_type, is_admin, subscription_status, stripe_customer_id, subscription_plan, subscription_period_start, subscription_period_end, profile_completed, email_verified) VALUES

('30000000-0000-0000-0000-000000000001', null, 'John Smith', 'john.smith@email.com', '(512) 555-1001', 
 '1234 Elm Street', 'Austin', 'TX', '78701', 30.2691, -97.7494, 'subscriber', false, 'active',
 'cus_sample_john', 'monthly', NOW() - INTERVAL '15 days', NOW() + INTERVAL '15 days', true, true),

('30000000-0000-0000-0000-000000000002', null, 'Emily Davis', 'emily.davis@email.com', '(512) 555-1002',
 '5678 Pine Avenue', 'Austin', 'TX', '78702', 30.2580, -97.7284, 'subscriber', false, 'active',
 'cus_sample_emily', 'yearly', NOW() - INTERVAL '45 days', NOW() + INTERVAL '320 days', true, true),

('30000000-0000-0000-0000-000000000003', null, 'Michael Johnson', 'michael.johnson@email.com', '(512) 555-1003',
 '9101 Cedar Lane', 'Austin', 'TX', '78704', 30.2465, -97.7598, 'subscriber', false, 'inactive',
 null, null, null, null, true, true),

('30000000-0000-0000-0000-000000000004', null, 'Sarah Wilson', 'sarah.wilson@email.com', '(512) 555-1004',
 '1357 Maple Drive', 'Austin', 'TX', '78703', 30.2847, -97.7456, 'subscriber', false, 'active',
 'cus_sample_sarah', 'monthly', NOW() - INTERVAL '8 days', NOW() + INTERVAL '22 days', true, true);

-- =====================================================
-- CREATE SAMPLE REDEMPTIONS
-- =====================================================

INSERT INTO public.redemptions (uid, user_uid, coupon_uid, business_uid, qr_code, display_code, status, redemption_month, expires_at, redeemed_at, transaction_amount, savings_amount, rating, review_text) VALUES

-- Active/Pending Redemptions
('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
 'SAVERLY-ABC123456789', 'A1B2C3D4', 'pending', DATE_TRUNC('month', NOW()), NOW() + INTERVAL '7 days', null, null, null, null, null),

('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000003',
 'SAVERLY-DEF789012345', 'E5F6G7H8', 'pending', DATE_TRUNC('month', NOW()), NOW() + INTERVAL '5 days', null, null, null, null, null),

-- Redeemed Redemptions
('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002',
 'SAVERLY-GHI345678901', 'I9J0K1L2', 'redeemed', DATE_TRUNC('month', NOW() - INTERVAL '10 days'), NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days', 45.00, 22.50, 5, 'Amazing food and great service! The BOGO deal was perfect for date night.'),

('40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000004',
 'SAVERLY-JKL901234567', 'M3N4O5P6', 'redeemed', DATE_TRUNC('month', NOW() - INTERVAL '5 days'), NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', 25.00, 25.00, 4, 'Great introduction to yoga. The instructor was very welcoming and helpful.'),

('40000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000006',
 'SAVERLY-MNO567890123', 'Q7R8S9T0', 'redeemed', DATE_TRUNC('month', NOW() - INTERVAL '15 days'), NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days', 15.50, 6.50, 4, 'Free popcorn was fresh and delicious. Movie was great too!');

-- =====================================================
-- CREATE SAMPLE FAVORITES
-- =====================================================

INSERT INTO public.user_favorites (uid, user_uid, business_uid, coupon_uid, favorite_type) VALUES
('50000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', null, 'business'),
('50000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', null, 'business'),
('50000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000002', null, '20000000-0000-0000-0000-000000000005', 'coupon'),
('50000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000006', null, 'business');

-- =====================================================
-- CREATE SAMPLE BUSINESS REVIEWS
-- =====================================================

INSERT INTO public.business_reviews (uid, business_uid, user_uid, redemption_uid, rating, review_text, is_verified, helpful_votes) VALUES
('60000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000003', 
 5, 'Absolutely fantastic dining experience! The pasta was homemade and the service was impeccable. The BOGO deal made it even better.', true, 3),

('60000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000004',
 4, 'Wonderful yoga studio with a peaceful atmosphere. Classes are well-structured and the instructors are knowledgeable.', true, 2),

('60000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000004', null,
 4, 'Great coffee and cozy atmosphere. Perfect place to work or meet friends. Their pastries are fresh daily.', false, 1),

('60000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000005',
 4, 'Clean theater with comfortable seating. Good sound quality and the free popcorn deal is a nice touch.', true, 0);

-- =====================================================
-- CREATE SAMPLE NOTIFICATIONS
-- =====================================================

INSERT INTO public.notifications (uid, user_uid, title, message, notification_type, read, action_url, metadata) VALUES
('70000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Coupon Expiring Soon!', 
 'Your "Free Coffee with Pastry" coupon from The Daily Grind Coffee expires in 3 days.', 'coupon_expiring', false,
 '/redemptions/40000000-0000-0000-0000-000000000001', 
 '{"redemption_uid": "40000000-0000-0000-0000-000000000001", "business_name": "The Daily Grind Coffee"}'::jsonb),

('70000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', 'New Coupon Available!',
 'Zen Yoga Studio has added a new "15% Off Monthly Membership" coupon just for you!', 'new_coupon', true,
 '/coupons/20000000-0000-0000-0000-000000000007',
 '{"coupon_uid": "20000000-0000-0000-0000-000000000007", "business_name": "Zen Yoga Studio"}'::jsonb),

('70000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000004', 'Subscription Renewal',
 'Your monthly subscription will renew in 5 days. Thank you for being a valued member!', 'subscription_renewal', false,
 '/account/subscription', '{"renewal_date": "2024-01-15"}'::jsonb);

-- =====================================================
-- UPDATE BUSINESS STATISTICS
-- =====================================================
-- This will be automatically calculated by triggers, but we can run it manually to ensure consistency

-- Update business ratings and review counts
UPDATE public.businesses b
SET 
  avg_rating = COALESCE((
    SELECT ROUND(AVG(rating), 2) 
    FROM public.business_reviews br 
    WHERE br.business_uid = b.uid AND br.reported = false
  ), 0.0),
  total_reviews = COALESCE((
    SELECT COUNT(*) 
    FROM public.business_reviews br 
    WHERE br.business_uid = b.uid AND br.reported = false
  ), 0),
  total_coupons_issued = COALESCE((
    SELECT COUNT(*) 
    FROM public.coupons c 
    WHERE c.business_uid = b.uid AND c.active = true
  ), 0),
  total_redemptions = COALESCE((
    SELECT COUNT(*) 
    FROM public.redemptions r 
    WHERE r.business_uid = b.uid AND r.status = 'redeemed'
  ), 0);

-- Update coupon redemption counts
UPDATE public.coupons c
SET current_redemptions = COALESCE((
  SELECT COUNT(*) 
  FROM public.redemptions r 
  WHERE r.coupon_uid = c.uid AND r.status IN ('pending', 'redeemed')
), 0);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Uncomment these to verify your data was inserted correctly

/*
-- Check businesses
SELECT name, category, city, total_coupons_issued, total_reviews, avg_rating FROM public.businesses ORDER BY name;

-- Check coupons
SELECT c.title, b.name as business_name, c.discount, c.current_redemptions, c.max_total_redemptions 
FROM public.coupons c 
JOIN public.businesses b ON c.business_uid = b.uid 
ORDER BY c.title;

-- Check active users
SELECT full_name, email, subscription_status, subscription_plan FROM public.users WHERE account_type = 'subscriber' ORDER BY full_name;

-- Check redemptions
SELECT u.full_name, c.title, b.name as business_name, r.status, r.expires_at
FROM public.redemptions r
JOIN public.users u ON r.user_uid = u.uid
JOIN public.coupons c ON r.coupon_uid = c.uid
JOIN public.businesses b ON r.business_uid = b.uid
ORDER BY r.created_at DESC;
*/