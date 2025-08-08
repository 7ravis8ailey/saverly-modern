-- Saverly Test Data Seeding Script
-- This script creates comprehensive test data for testing all features

-- Create test admin user
INSERT INTO users (
  id,
  email,
  full_name,
  account_type,
  subscription_status,
  created_at,
  updated_at
) VALUES (
  'admin-test-001',
  'admin@saverly.test',
  'Test Admin',
  'admin',
  'active',
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE
SET 
  full_name = EXCLUDED.full_name,
  account_type = EXCLUDED.account_type,
  updated_at = NOW();

-- Create test subscriber users with different subscription statuses
INSERT INTO users (
  id,
  email,
  full_name,
  account_type,
  subscription_status,
  stripe_customer_id,
  address,
  city,
  state,
  zip_code,
  latitude,
  longitude,
  created_at,
  updated_at
) VALUES 
(
  'subscriber-test-001',
  'subscriber.active@saverly.test',
  'Active Subscriber',
  'subscriber',
  'active',
  'cus_test_active_001',
  '123 Main Street',
  'San Francisco',
  'CA',
  '94102',
  37.7749,
  -122.4194,
  NOW(),
  NOW()
),
(
  'subscriber-test-002',
  'subscriber.inactive@saverly.test',
  'Inactive Subscriber',
  'subscriber',
  'inactive',
  'cus_test_inactive_002',
  '456 Market Street',
  'San Francisco',
  'CA',
  '94103',
  37.7739,
  -122.4184,
  NOW(),
  NOW()
),
(
  'subscriber-test-003',
  'subscriber.trial@saverly.test',
  'Trial Subscriber',
  'subscriber',
  'trial',
  'cus_test_trial_003',
  '789 Mission Street',
  'San Francisco',
  'CA',
  '94105',
  37.7889,
  -122.3989,
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE
SET 
  full_name = EXCLUDED.full_name,
  subscription_status = EXCLUDED.subscription_status,
  updated_at = NOW();

-- Create test businesses with various categories
INSERT INTO businesses (
  id,
  name,
  email,
  contact_name,
  phone,
  address,
  city,
  state,
  zip_code,
  category,
  description,
  latitude,
  longitude,
  created_at,
  updated_at
) VALUES
(
  'business-test-001',
  'The Coffee Corner',
  'coffee@saverly.test',
  'John Barista',
  '(415) 555-0101',
  '100 Coffee Lane',
  'San Francisco',
  'CA',
  '94102',
  'Food & Beverage',
  'Artisanal coffee shop serving locally roasted beans and fresh pastries',
  37.7749,
  -122.4194,
  NOW(),
  NOW()
),
(
  'business-test-002',
  'FitLife Gym',
  'gym@saverly.test',
  'Sarah Trainer',
  '(415) 555-0102',
  '200 Fitness Ave',
  'San Francisco',
  'CA',
  '94103',
  'Health & Wellness',
  'Modern gym with state-of-the-art equipment and personal training',
  37.7739,
  -122.4184,
  NOW(),
  NOW()
),
(
  'business-test-003',
  'Pizza Paradise',
  'pizza@saverly.test',
  'Mario Chef',
  '(415) 555-0103',
  '300 Pizza Plaza',
  'San Francisco',
  'CA',
  '94104',
  'Food & Beverage',
  'Authentic Italian pizzeria with wood-fired ovens',
  37.7759,
  -122.4174,
  NOW(),
  NOW()
),
(
  'business-test-004',
  'TechHub Electronics',
  'tech@saverly.test',
  'Alex Techie',
  '(415) 555-0104',
  '400 Tech Street',
  'San Francisco',
  'CA',
  '94105',
  'Retail',
  'Electronics store specializing in latest gadgets and repairs',
  37.7889,
  -122.3989,
  NOW(),
  NOW()
),
(
  'business-test-005',
  'Zen Spa & Wellness',
  'spa@saverly.test',
  'Emma Wellness',
  '(415) 555-0105',
  '500 Relaxation Road',
  'San Francisco',
  'CA',
  '94106',
  'Health & Wellness',
  'Full-service spa offering massages, facials, and wellness treatments',
  37.7799,
  -122.4164,
  NOW(),
  NOW()
),
(
  'business-test-006',
  'BookWorm Haven',
  'books@saverly.test',
  'Lisa Reader',
  '(415) 555-0106',
  '600 Library Lane',
  'San Francisco',
  'CA',
  '94107',
  'Retail',
  'Independent bookstore with curated selection and cozy reading nooks',
  37.7709,
  -122.4154,
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE
SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Create test coupons with various discounts and expiration dates
INSERT INTO coupons (
  id,
  business_id,
  title,
  description,
  discount,
  code,
  start_date,
  end_date,
  usage_limit,
  used_count,
  active,
  created_at,
  updated_at
) VALUES
-- Coffee Corner Coupons
(
  'coupon-test-001',
  'business-test-001',
  '20% Off All Coffee Drinks',
  'Enjoy 20% off any coffee drink, hot or cold. Perfect for your morning boost!',
  '20% off',
  'COFFEE20',
  NOW() - INTERVAL '7 days',
  NOW() + INTERVAL '30 days',
  100,
  15,
  true,
  NOW(),
  NOW()
),
(
  'coupon-test-002',
  'business-test-001',
  'Buy One Get One Free Pastry',
  'Purchase any pastry and get another of equal or lesser value free!',
  'BOGO',
  'PASTRY2FOR1',
  NOW() - INTERVAL '3 days',
  NOW() + INTERVAL '14 days',
  50,
  8,
  true,
  NOW(),
  NOW()
),
-- FitLife Gym Coupons
(
  'coupon-test-003',
  'business-test-002',
  'First Month Free',
  'New members get their first month absolutely free! No commitment required.',
  '100% off first month',
  'FITFREE30',
  NOW() - INTERVAL '14 days',
  NOW() + INTERVAL '60 days',
  25,
  3,
  true,
  NOW(),
  NOW()
),
(
  'coupon-test-004',
  'business-test-002',
  '3 Free Personal Training Sessions',
  'Sign up today and receive 3 complimentary personal training sessions',
  '3 free sessions',
  'TRAIN3FREE',
  NOW(),
  NOW() + INTERVAL '45 days',
  20,
  0,
  true,
  NOW(),
  NOW()
),
-- Pizza Paradise Coupons
(
  'coupon-test-005',
  'business-test-003',
  '$5 Off Large Pizza',
  'Save $5 on any large pizza. Dine-in, takeout, or delivery.',
  '$5 off',
  'PIZZA5OFF',
  NOW() - INTERVAL '1 day',
  NOW() + INTERVAL '21 days',
  200,
  45,
  true,
  NOW(),
  NOW()
),
(
  'coupon-test-006',
  'business-test-003',
  'Family Meal Deal - 30% Off',
  '30% off when you order 2 large pizzas, breadsticks, and a 2-liter soda',
  '30% off family meal',
  'FAMILY30',
  NOW(),
  NOW() + INTERVAL '30 days',
  75,
  12,
  true,
  NOW(),
  NOW()
),
-- TechHub Electronics Coupons
(
  'coupon-test-007',
  'business-test-004',
  '15% Off All Accessories',
  'Save 15% on phone cases, chargers, cables, and more!',
  '15% off',
  'TECH15ACC',
  NOW() - INTERVAL '5 days',
  NOW() + INTERVAL '20 days',
  150,
  23,
  true,
  NOW(),
  NOW()
),
(
  'coupon-test-008',
  'business-test-004',
  'Free Screen Protector Installation',
  'Get free installation with any screen protector purchase',
  'Free service',
  'FREEINSTALL',
  NOW(),
  NOW() + INTERVAL '14 days',
  100,
  5,
  true,
  NOW(),
  NOW()
),
-- Zen Spa Coupons
(
  'coupon-test-009',
  'business-test-005',
  '25% Off First Massage',
  'New clients receive 25% off their first 60-minute massage',
  '25% off',
  'RELAX25',
  NOW() - INTERVAL '10 days',
  NOW() + INTERVAL '45 days',
  30,
  7,
  true,
  NOW(),
  NOW()
),
(
  'coupon-test-010',
  'business-test-005',
  'Couples Package Special',
  'Book a couples massage and receive complimentary aromatherapy upgrade',
  'Free upgrade',
  'COUPLES2025',
  NOW(),
  NOW() + INTERVAL '60 days',
  15,
  2,
  true,
  NOW(),
  NOW()
),
-- BookWorm Haven Coupons
(
  'coupon-test-011',
  'business-test-006',
  'Buy 2 Books, Get 1 Free',
  'Purchase any 2 books and get a third book of equal or lesser value free',
  'Buy 2 get 1 free',
  'BOOK3FOR2',
  NOW() - INTERVAL '2 days',
  NOW() + INTERVAL '30 days',
  100,
  18,
  true,
  NOW(),
  NOW()
),
(
  'coupon-test-012',
  'business-test-006',
  '40% Off Bestsellers',
  'Save 40% on all New York Times bestsellers this month',
  '40% off',
  'BEST40',
  NOW(),
  NOW() + INTERVAL '28 days',
  50,
  9,
  true,
  NOW(),
  NOW()
),
-- Expired/Inactive Coupons for Testing
(
  'coupon-test-013',
  'business-test-001',
  'Holiday Special - EXPIRED',
  'This coupon has expired and should not be redeemable',
  '50% off',
  'EXPIRED50',
  NOW() - INTERVAL '60 days',
  NOW() - INTERVAL '7 days',
  10,
  10,
  false,
  NOW() - INTERVAL '60 days',
  NOW()
),
(
  'coupon-test-014',
  'business-test-003',
  'Lunch Special - Fully Redeemed',
  'This coupon has reached its usage limit',
  '$3 off lunch',
  'LUNCH3',
  NOW() - INTERVAL '14 days',
  NOW() + INTERVAL '7 days',
  5,
  5,
  true,
  NOW() - INTERVAL '14 days',
  NOW()
);

-- Create test redemptions for tracking
INSERT INTO redemptions (
  id,
  coupon_id,
  user_id,
  redeemed_at,
  qr_code,
  created_at
) VALUES
(
  'redemption-test-001',
  'coupon-test-001',
  'subscriber-test-001',
  NOW() - INTERVAL '2 days',
  'QR_COFFEE20_001',
  NOW() - INTERVAL '2 days'
),
(
  'redemption-test-002',
  'coupon-test-005',
  'subscriber-test-001',
  NOW() - INTERVAL '1 day',
  'QR_PIZZA5OFF_001',
  NOW() - INTERVAL '1 day'
),
(
  'redemption-test-003',
  'coupon-test-007',
  'subscriber-test-002',
  NOW() - INTERVAL '3 days',
  'QR_TECH15ACC_002',
  NOW() - INTERVAL '3 days'
) ON CONFLICT (id) DO UPDATE
SET 
  redeemed_at = EXCLUDED.redeemed_at;

-- Output summary
SELECT 'Test Data Creation Summary' as status;
SELECT 'Users created:' as entity, COUNT(*) as count FROM users WHERE email LIKE '%saverly.test';
SELECT 'Businesses created:' as entity, COUNT(*) as count FROM businesses WHERE email LIKE '%saverly.test';
SELECT 'Coupons created:' as entity, COUNT(*) as count FROM coupons WHERE id LIKE 'coupon-test-%';
SELECT 'Redemptions created:' as entity, COUNT(*) as count FROM redemptions WHERE id LIKE 'redemption-test-%';