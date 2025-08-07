-- =====================================================
-- SAVERLY MODERN v2.0.0 - DATABASE VALIDATION SCRIPT
-- =====================================================
-- Run this script AFTER applying deploy-database.sql
-- This validates that all schema components are correctly installed

-- =====================================================
-- VALIDATION QUERIES
-- =====================================================

-- Check extensions
SELECT 'Extensions Check' as test_category, 
       CASE WHEN COUNT(*) >= 2 THEN 'PASS' ELSE 'FAIL' END as status,
       'Extensions: ' || string_agg(extname, ', ') as details
FROM pg_extension 
WHERE extname IN ('uuid-ossp', 'postgis');

-- Check all tables exist
WITH expected_tables AS (
  SELECT unnest(ARRAY[
    'users', 'businesses', 'coupons', 'redemptions', 
    'user_favorites', 'notifications', 'business_reviews',
    'analytics_events', 'subscription_plans'
  ]) as table_name
),
actual_tables AS (
  SELECT table_name 
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
)
SELECT 'Tables Check' as test_category,
       CASE WHEN COUNT(e.table_name) = COUNT(a.table_name) THEN 'PASS' ELSE 'FAIL' END as status,
       'Expected: ' || COUNT(e.table_name) || ', Found: ' || COUNT(a.table_name) as details
FROM expected_tables e
LEFT JOIN actual_tables a ON e.table_name = a.table_name;

-- Check RLS is enabled on all tables
WITH rls_check AS (
  SELECT schemaname, tablename, rowsecurity
  FROM pg_tables 
  WHERE schemaname = 'public'
  AND tablename IN ('users', 'businesses', 'coupons', 'redemptions', 
                   'user_favorites', 'notifications', 'business_reviews',
                   'analytics_events', 'subscription_plans')
)
SELECT 'Row Level Security Check' as test_category,
       CASE WHEN COUNT(*) = SUM(CASE WHEN rowsecurity THEN 1 ELSE 0 END) 
            THEN 'PASS' ELSE 'FAIL' END as status,
       'Tables with RLS: ' || SUM(CASE WHEN rowsecurity THEN 1 ELSE 0 END) || '/' || COUNT(*) as details
FROM rls_check;

-- Check helper functions exist
WITH expected_functions AS (
  SELECT unnest(ARRAY[
    'is_admin', 'owns_business', 'has_active_subscription', 
    'handle_updated_at', 'handle_new_user'
  ]) as function_name
),
actual_functions AS (
  SELECT routine_name as function_name
  FROM information_schema.routines
  WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
)
SELECT 'Functions Check' as test_category,
       CASE WHEN COUNT(e.function_name) = COUNT(a.function_name) THEN 'PASS' ELSE 'FAIL' END as status,
       'Expected: ' || COUNT(e.function_name) || ', Found: ' || COUNT(a.function_name) as details
FROM expected_functions e
LEFT JOIN actual_functions a ON e.function_name = a.function_name;

-- Check policies exist
SELECT 'Policies Check' as test_category,
       CASE WHEN COUNT(*) > 20 THEN 'PASS' ELSE 'FAIL' END as status,
       'Total policies created: ' || COUNT(*) as details
FROM pg_policies 
WHERE schemaname = 'public';

-- Check indexes exist
SELECT 'Indexes Check' as test_category,
       CASE WHEN COUNT(*) > 15 THEN 'PASS' ELSE 'FAIL' END as status,
       'Performance indexes created: ' || COUNT(*) as details
FROM pg_indexes 
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%';

-- Check triggers exist
SELECT 'Triggers Check' as test_category,
       CASE WHEN COUNT(*) >= 5 THEN 'PASS' ELSE 'FAIL' END as status,
       'Updated_at triggers: ' || COUNT(*) as details
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND trigger_name LIKE 'handle_%updated_at';

-- Check sample data
SELECT 'Sample Data Check' as test_category,
       CASE WHEN COUNT(*) > 0 THEN 'PASS' ELSE 'FAIL' END as status,
       'Subscription plans: ' || COUNT(*) as details
FROM public.subscription_plans;

-- Final deployment summary
SELECT 
  'DEPLOYMENT SUMMARY' as section,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE') as tables_created,
  (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public' AND routine_type = 'FUNCTION') as functions_created,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') as policies_created,
  (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE 'idx_%') as indexes_created;

-- Test basic functionality
SELECT 'FUNCTIONALITY TEST' as section;

-- Test UUID generation
SELECT 'UUID Generation Test: ' || 
       CASE WHEN uuid_generate_v4() IS NOT NULL THEN 'PASS' ELSE 'FAIL' END as test_result;

-- Test PostGIS (if available)
SELECT 'PostGIS Test: ' || 
       CASE WHEN ST_MakePoint(-122.4194, 37.7749) IS NOT NULL THEN 'PASS' ELSE 'FAIL' END as test_result;