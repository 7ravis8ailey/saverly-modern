-- =====================================================
-- SAVERLY MODERN v2.0.0 - VIEWS AND ANALYTICS
-- =====================================================
-- This file contains database views for analytics and reporting
-- Apply this AFTER 04-sample-data.sql via Supabase Dashboard > SQL Editor

-- =====================================================
-- BUSINESS ANALYTICS VIEWS
-- =====================================================

-- Business performance summary view
CREATE OR REPLACE VIEW public.business_performance AS
SELECT 
  b.uid,
  b.name,
  b.category,
  b.city,
  b.state,
  b.is_verified,
  b.is_active,
  b.avg_rating,
  b.total_reviews,
  b.total_coupons_issued,
  b.total_redemptions,
  
  -- Active coupons count
  (SELECT COUNT(*) FROM public.coupons c 
   WHERE c.business_uid = b.uid AND c.active = true 
   AND c.start_date <= NOW() AND c.end_date >= NOW()) as active_coupons,
  
  -- Redemptions this month
  (SELECT COUNT(*) FROM public.redemptions r 
   WHERE r.business_uid = b.uid AND r.status = 'redeemed'
   AND DATE_TRUNC('month', r.redeemed_at) = DATE_TRUNC('month', NOW())) as redemptions_this_month,
  
  -- Redemptions last month
  (SELECT COUNT(*) FROM public.redemptions r 
   WHERE r.business_uid = b.uid AND r.status = 'redeemed'
   AND DATE_TRUNC('month', r.redeemed_at) = DATE_TRUNC('month', NOW() - INTERVAL '1 month')) as redemptions_last_month,
  
  -- Average savings provided
  (SELECT ROUND(AVG(r.savings_amount), 2) FROM public.redemptions r 
   WHERE r.business_uid = b.uid AND r.status = 'redeemed' 
   AND r.savings_amount IS NOT NULL) as avg_savings_provided,
  
  -- Total savings provided
  (SELECT ROUND(SUM(r.savings_amount), 2) FROM public.redemptions r 
   WHERE r.business_uid = b.uid AND r.status = 'redeemed' 
   AND r.savings_amount IS NOT NULL) as total_savings_provided,
  
  b.created_at,
  b.updated_at
FROM public.businesses b
ORDER BY b.total_redemptions DESC, b.avg_rating DESC;

-- Top performing coupons view
CREATE OR REPLACE VIEW public.top_coupons AS
SELECT 
  c.uid,
  c.title,
  c.discount,
  c.coupon_type,
  c.usage_limit,
  c.current_redemptions,
  c.max_total_redemptions,
  b.name as business_name,
  b.category as business_category,
  b.city,
  b.state,
  
  -- Redemption rate
  CASE 
    WHEN c.max_total_redemptions > 0 THEN 
      ROUND((c.current_redemptions::DECIMAL / c.max_total_redemptions) * 100, 2)
    ELSE NULL
  END as redemption_rate_percent,
  
  -- Days active
  EXTRACT(DAY FROM NOW() - c.start_date) as days_active,
  
  -- Days remaining
  EXTRACT(DAY FROM c.end_date - NOW()) as days_remaining,
  
  -- Average rating from redemptions
  (SELECT ROUND(AVG(r.rating), 2) FROM public.redemptions r 
   WHERE r.coupon_uid = c.uid AND r.rating IS NOT NULL) as avg_rating,
  
  -- Total savings provided by this coupon
  (SELECT ROUND(SUM(r.savings_amount), 2) FROM public.redemptions r 
   WHERE r.coupon_uid = c.uid AND r.status = 'redeemed' 
   AND r.savings_amount IS NOT NULL) as total_savings,
  
  c.created_at,
  c.start_date,
  c.end_date,
  c.active
FROM public.coupons c
JOIN public.businesses b ON c.business_uid = b.uid
WHERE c.active = true
ORDER BY c.current_redemptions DESC, c.featured DESC, c.priority DESC;

-- =====================================================
-- USER ANALYTICS VIEWS
-- =====================================================

-- User activity summary
CREATE OR REPLACE VIEW public.user_activity_summary AS
SELECT 
  u.uid,
  u.full_name,
  u.email,
  u.city,
  u.state,
  u.account_type,
  u.subscription_status,
  u.subscription_plan,
  u.subscription_period_end,
  
  -- Redemption statistics
  (SELECT COUNT(*) FROM public.redemptions r 
   WHERE r.user_uid = u.uid) as total_redemptions,
  
  (SELECT COUNT(*) FROM public.redemptions r 
   WHERE r.user_uid = u.uid AND r.status = 'redeemed') as successful_redemptions,
  
  (SELECT COUNT(*) FROM public.redemptions r 
   WHERE r.user_uid = u.uid AND r.status = 'pending') as pending_redemptions,
  
  -- This month's activity
  (SELECT COUNT(*) FROM public.redemptions r 
   WHERE r.user_uid = u.uid 
   AND DATE_TRUNC('month', r.created_at) = DATE_TRUNC('month', NOW())) as redemptions_this_month,
  
  -- Total savings
  (SELECT ROUND(SUM(r.savings_amount), 2) FROM public.redemptions r 
   WHERE r.user_uid = u.uid AND r.status = 'redeemed' 
   AND r.savings_amount IS NOT NULL) as total_savings,
  
  -- Favorite businesses count
  (SELECT COUNT(*) FROM public.user_favorites f 
   WHERE f.user_uid = u.uid AND f.favorite_type = 'business') as favorite_businesses,
  
  -- Reviews written
  (SELECT COUNT(*) FROM public.business_reviews br 
   WHERE br.user_uid = u.uid) as reviews_written,
  
  -- Average rating given
  (SELECT ROUND(AVG(br.rating), 2) FROM public.business_reviews br 
   WHERE br.user_uid = u.uid) as avg_rating_given,
  
  u.last_login_at,
  u.created_at
FROM public.users u
WHERE u.account_type != 'admin'
ORDER BY total_savings DESC NULLS LAST;

-- Subscription analytics
CREATE OR REPLACE VIEW public.subscription_analytics AS
SELECT 
  sp.name as plan_name,
  sp.price_monthly,
  sp.price_yearly,
  
  -- Current subscribers
  (SELECT COUNT(*) FROM public.users u 
   WHERE u.subscription_plan = 'monthly' AND u.subscription_status = 'active'
   AND EXISTS (SELECT 1 FROM public.subscription_plans sp2 
               WHERE sp2.name = sp.name)) as monthly_subscribers,
  
  (SELECT COUNT(*) FROM public.users u 
   WHERE u.subscription_plan = 'yearly' AND u.subscription_status = 'active'
   AND EXISTS (SELECT 1 FROM public.subscription_plans sp2 
               WHERE sp2.name = sp.name)) as yearly_subscribers,
  
  -- Revenue calculations (estimated)
  (SELECT COUNT(*) * sp.price_monthly FROM public.users u 
   WHERE u.subscription_plan = 'monthly' AND u.subscription_status = 'active') as estimated_monthly_revenue,
  
  (SELECT COUNT(*) * (sp.price_yearly / 12) FROM public.users u 
   WHERE u.subscription_plan = 'yearly' AND u.subscription_status = 'active') as estimated_yearly_revenue_monthly,
  
  -- Churn analysis
  (SELECT COUNT(*) FROM public.users u 
   WHERE u.subscription_status = 'cancelled' 
   AND u.subscription_canceled_at >= NOW() - INTERVAL '30 days') as cancellations_last_30_days,
  
  sp.features,
  sp.max_redemptions_per_month,
  sp.is_active,
  sp.sort_order
FROM public.subscription_plans sp
ORDER BY sp.sort_order;

-- =====================================================
-- OPERATIONAL VIEWS
-- =====================================================

-- Expiring coupons alert
CREATE OR REPLACE VIEW public.expiring_coupons AS
SELECT 
  c.uid,
  c.title,
  c.discount,
  c.end_date,
  EXTRACT(DAY FROM c.end_date - NOW()) as days_until_expiry,
  b.name as business_name,
  b.email as business_email,
  b.contact_name,
  c.current_redemptions,
  c.max_total_redemptions,
  c.active
FROM public.coupons c
JOIN public.businesses b ON c.business_uid = b.uid
WHERE c.active = true
  AND c.end_date BETWEEN NOW() AND NOW() + INTERVAL '14 days'
ORDER BY c.end_date ASC;

-- Pending redemptions requiring attention
CREATE OR REPLACE VIEW public.pending_redemptions_alert AS
SELECT 
  r.uid,
  r.display_code,
  r.expires_at,
  EXTRACT(DAY FROM r.expires_at - NOW()) as days_until_expiry,
  u.full_name as user_name,
  u.email as user_email,
  c.title as coupon_title,
  b.name as business_name,
  b.contact_name as business_contact,
  r.created_at,
  EXTRACT(DAY FROM NOW() - r.created_at) as days_since_created
FROM public.redemptions r
JOIN public.users u ON r.user_uid = u.uid
JOIN public.coupons c ON r.coupon_uid = c.uid
JOIN public.businesses b ON r.business_uid = b.uid
WHERE r.status = 'pending'
  AND r.expires_at BETWEEN NOW() AND NOW() + INTERVAL '7 days'
ORDER BY r.expires_at ASC;

-- =====================================================
-- GEOGRAPHIC ANALYTICS VIEWS
-- =====================================================

-- Business density by location
CREATE OR REPLACE VIEW public.business_density AS
SELECT 
  city,
  state,
  COUNT(*) as total_businesses,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_businesses,
  COUNT(CASE WHEN is_verified = true THEN 1 END) as verified_businesses,
  ROUND(AVG(avg_rating), 2) as avg_city_rating,
  SUM(total_redemptions) as total_city_redemptions,
  
  -- Most popular category in this city
  (SELECT category 
   FROM public.businesses b2 
   WHERE b2.city = b.city AND b2.state = b.state 
   GROUP BY category 
   ORDER BY COUNT(*) DESC 
   LIMIT 1) as most_popular_category
FROM public.businesses b
GROUP BY city, state
HAVING COUNT(*) >= 1
ORDER BY total_businesses DESC;

-- User distribution by location
CREATE OR REPLACE VIEW public.user_distribution AS
SELECT 
  city,
  state,
  COUNT(*) as total_users,
  COUNT(CASE WHEN subscription_status = 'active' THEN 1 END) as active_subscribers,
  COUNT(CASE WHEN subscription_status = 'inactive' THEN 1 END) as inactive_users,
  ROUND(AVG(CASE WHEN subscription_status = 'active' THEN 
    (SELECT SUM(savings_amount) FROM public.redemptions r 
     WHERE r.user_uid = u.uid AND r.status = 'redeemed')
  END), 2) as avg_savings_per_subscriber
FROM public.users u
WHERE account_type = 'subscriber' 
  AND city IS NOT NULL 
  AND state IS NOT NULL
GROUP BY city, state
ORDER BY total_users DESC;

-- =====================================================
-- FINANCIAL ANALYTICS VIEWS
-- =====================================================

-- Revenue and savings analysis
CREATE OR REPLACE VIEW public.financial_summary AS
SELECT 
  -- Current period (this month)
  (SELECT COUNT(*) FROM public.users 
   WHERE subscription_status = 'active' AND subscription_plan = 'monthly') as current_monthly_subscribers,
  
  (SELECT COUNT(*) FROM public.users 
   WHERE subscription_status = 'active' AND subscription_plan = 'yearly') as current_yearly_subscribers,
  
  -- Estimated monthly revenue
  (SELECT ROUND(SUM(
    CASE 
      WHEN subscription_plan = 'monthly' THEN 
        (SELECT price_monthly FROM public.subscription_plans sp 
         WHERE sp.name = 'Premium' LIMIT 1) -- Assuming Premium as default
      WHEN subscription_plan = 'yearly' THEN 
        (SELECT price_yearly / 12 FROM public.subscription_plans sp 
         WHERE sp.name = 'Premium' LIMIT 1)
      ELSE 0
    END
  ), 2) FROM public.users 
   WHERE subscription_status = 'active') as estimated_monthly_revenue,
  
  -- Total savings provided to users this month
  (SELECT ROUND(SUM(savings_amount), 2) FROM public.redemptions 
   WHERE status = 'redeemed' 
   AND DATE_TRUNC('month', redeemed_at) = DATE_TRUNC('month', NOW())
   AND savings_amount IS NOT NULL) as total_savings_this_month,
  
  -- Total savings provided all time
  (SELECT ROUND(SUM(savings_amount), 2) FROM public.redemptions 
   WHERE status = 'redeemed' AND savings_amount IS NOT NULL) as total_savings_all_time,
  
  -- Redemptions this month
  (SELECT COUNT(*) FROM public.redemptions 
   WHERE status = 'redeemed' 
   AND DATE_TRUNC('month', redeemed_at) = DATE_TRUNC('month', NOW())) as redemptions_this_month,
  
  -- Total redemptions all time
  (SELECT COUNT(*) FROM public.redemptions 
   WHERE status = 'redeemed') as total_redemptions_all_time,
  
  -- Average transaction value
  (SELECT ROUND(AVG(transaction_amount), 2) FROM public.redemptions 
   WHERE status = 'redeemed' AND transaction_amount IS NOT NULL) as avg_transaction_value,
  
  -- Current timestamp for reporting
  NOW() as report_generated_at;

-- =====================================================
-- ADMIN DASHBOARD VIEW
-- =====================================================

-- Comprehensive admin dashboard summary
CREATE OR REPLACE VIEW public.admin_dashboard AS
SELECT 
  -- User metrics
  (SELECT COUNT(*) FROM public.users WHERE account_type = 'subscriber') as total_users,
  (SELECT COUNT(*) FROM public.users WHERE subscription_status = 'active') as active_subscribers,
  (SELECT COUNT(*) FROM public.users WHERE account_type = 'business') as business_users,
  (SELECT COUNT(*) FROM public.users WHERE is_admin = true) as admin_users,
  
  -- Business metrics
  (SELECT COUNT(*) FROM public.businesses) as total_businesses,
  (SELECT COUNT(*) FROM public.businesses WHERE is_active = true) as active_businesses,
  (SELECT COUNT(*) FROM public.businesses WHERE is_verified = true) as verified_businesses,
  (SELECT ROUND(AVG(avg_rating), 2) FROM public.businesses WHERE avg_rating > 0) as avg_business_rating,
  
  -- Coupon metrics
  (SELECT COUNT(*) FROM public.coupons) as total_coupons,
  (SELECT COUNT(*) FROM public.coupons WHERE active = true 
   AND start_date <= NOW() AND end_date >= NOW()) as active_coupons,
  (SELECT COUNT(*) FROM public.coupons WHERE featured = true) as featured_coupons,
  
  -- Redemption metrics
  (SELECT COUNT(*) FROM public.redemptions) as total_redemptions,
  (SELECT COUNT(*) FROM public.redemptions WHERE status = 'pending') as pending_redemptions,
  (SELECT COUNT(*) FROM public.redemptions WHERE status = 'redeemed') as successful_redemptions,
  (SELECT COUNT(*) FROM public.redemptions WHERE status = 'expired') as expired_redemptions,
  
  -- Financial metrics
  (SELECT ROUND(SUM(savings_amount), 2) FROM public.redemptions 
   WHERE status = 'redeemed' AND savings_amount IS NOT NULL) as total_customer_savings,
  
  -- Engagement metrics
  (SELECT COUNT(*) FROM public.business_reviews) as total_reviews,
  (SELECT ROUND(AVG(rating), 2) FROM public.business_reviews) as avg_review_rating,
  (SELECT COUNT(*) FROM public.user_favorites) as total_favorites,
  (SELECT COUNT(*) FROM public.notifications WHERE read = false) as unread_notifications,
  
  -- Current timestamp
  NOW() as dashboard_updated_at;

-- =====================================================
-- GRANT PERMISSIONS FOR VIEWS
-- =====================================================

-- Grant access to views for authenticated users
GRANT SELECT ON public.business_performance TO authenticated;
GRANT SELECT ON public.top_coupons TO authenticated;
GRANT SELECT ON public.user_activity_summary TO authenticated;
GRANT SELECT ON public.business_density TO authenticated;
GRANT SELECT ON public.user_distribution TO authenticated;

-- Admin-only views
GRANT SELECT ON public.subscription_analytics TO authenticated;
GRANT SELECT ON public.expiring_coupons TO authenticated;
GRANT SELECT ON public.pending_redemptions_alert TO authenticated;
GRANT SELECT ON public.financial_summary TO authenticated;
GRANT SELECT ON public.admin_dashboard TO authenticated;

-- Grant to anonymous users for public business data
GRANT SELECT ON public.business_performance TO anon;
GRANT SELECT ON public.top_coupons TO anon;
GRANT SELECT ON public.business_density TO anon;