-- =====================================================
-- ENHANCED USAGE LIMITS MIGRATION
-- =====================================================
-- This migration updates the usage limit system to support the exact
-- usage limit types from the original Saverly application

-- Update the coupons table usage_limit constraint to include new types
ALTER TABLE public.coupons 
DROP CONSTRAINT IF EXISTS coupons_usage_limit_check;

ALTER TABLE public.coupons 
ADD CONSTRAINT coupons_usage_limit_check 
CHECK (usage_limit IN ('one_time', 'daily', 'weekly', 'monthly_one', 'monthly_two', 'monthly_four', 'unlimited'));

-- Update the enhanced usage limit validation function
CREATE OR REPLACE FUNCTION check_enhanced_usage_limit(
  p_user_uid UUID,
  p_coupon_uid UUID, 
  p_usage_limit TEXT,
  p_monthly_limit INTEGER DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  usage_count INTEGER := 0;
  max_allowed INTEGER := 1;
  result JSON;
  current_month TEXT;
  current_date DATE;
BEGIN
  -- Get current date/month for calculations
  current_date := CURRENT_DATE;
  current_month := TO_CHAR(NOW(), 'YYYY-MM');
  
  -- Count current usage based on usage limit type
  CASE p_usage_limit
    WHEN 'one_time' THEN
      -- Check if user has ever redeemed this coupon
      SELECT COUNT(*) INTO usage_count
      FROM redemptions 
      WHERE user_uid = p_user_uid 
        AND coupon_uid = p_coupon_uid
        AND status = 'redeemed';
      max_allowed := 1;
      
    WHEN 'daily' THEN
      -- Check if user has redeemed this coupon today
      SELECT COUNT(*) INTO usage_count
      FROM redemptions
      WHERE user_uid = p_user_uid
        AND coupon_uid = p_coupon_uid
        AND DATE(created_at) = current_date
        AND status = 'redeemed';
      max_allowed := 1;
      
    WHEN 'weekly' THEN
      -- Check usage for current week (Monday to Sunday)
      SELECT COUNT(*) INTO usage_count
      FROM redemptions
      WHERE user_uid = p_user_uid
        AND coupon_uid = p_coupon_uid
        AND DATE(created_at) >= DATE_TRUNC('week', current_date)
        AND DATE(created_at) < DATE_TRUNC('week', current_date) + INTERVAL '7 days'
        AND status = 'redeemed';
      max_allowed := 1;
        
    WHEN 'monthly_one' THEN
      -- Check usage for current month - limit 1
      SELECT COUNT(*) INTO usage_count
      FROM redemptions
      WHERE user_uid = p_user_uid
        AND coupon_uid = p_coupon_uid
        AND redemption_month LIKE (current_month || '%')
        AND status = 'redeemed';
      max_allowed := 1;
      
    WHEN 'monthly_two' THEN
      -- Check usage for current month - limit 2
      SELECT COUNT(*) INTO usage_count
      FROM redemptions
      WHERE user_uid = p_user_uid
        AND coupon_uid = p_coupon_uid
        AND redemption_month LIKE (current_month || '%')
        AND status = 'redeemed';
      max_allowed := 2;
      
    WHEN 'monthly_four' THEN
      -- Check usage for current month - limit 4
      SELECT COUNT(*) INTO usage_count
      FROM redemptions
      WHERE user_uid = p_user_uid
        AND coupon_uid = p_coupon_uid
        AND redemption_month LIKE (current_month || '%')
        AND status = 'redeemed';
      max_allowed := 4;
      
    WHEN 'monthly' THEN
      -- Legacy monthly support with custom limit
      SELECT COUNT(*) INTO usage_count
      FROM redemptions
      WHERE user_uid = p_user_uid
        AND coupon_uid = p_coupon_uid
        AND redemption_month LIKE (current_month || '%')
        AND status = 'redeemed';
      max_allowed := COALESCE(p_monthly_limit, 1);
      
    WHEN 'unlimited' THEN
      -- No limits
      usage_count := 0;
      max_allowed := 999999;
      
    ELSE
      -- Unknown usage limit type
      RAISE EXCEPTION 'Unsupported usage limit type: %', p_usage_limit;
  END CASE;
  
  -- Build result JSON with enhanced information
  SELECT json_build_object(
    'can_redeem', usage_count < max_allowed,
    'current_usage', usage_count,
    'max_allowed', max_allowed,
    'remaining', GREATEST(max_allowed - usage_count, 0),
    'usage_type', p_usage_limit,
    'period_info', CASE 
      WHEN p_usage_limit = 'one_time' THEN json_build_object(
        'type', 'permanent',
        'description', 'One time use only'
      )
      WHEN p_usage_limit = 'daily' THEN json_build_object(
        'type', 'daily',
        'current_period', current_date::TEXT,
        'next_reset', (current_date + INTERVAL '1 day')::TEXT,
        'description', 'Resets daily at midnight'
      )
      WHEN p_usage_limit = 'weekly' THEN json_build_object(
        'type', 'weekly',
        'current_period', DATE_TRUNC('week', current_date)::TEXT,
        'next_reset', (DATE_TRUNC('week', current_date) + INTERVAL '7 days')::TEXT,
        'description', 'Resets weekly on Monday'
      )
      WHEN p_usage_limit IN ('monthly_one', 'monthly_two', 'monthly_four', 'monthly') THEN json_build_object(
        'type', 'monthly',
        'current_period', current_month,
        'next_reset', (DATE_TRUNC('month', NOW()) + INTERVAL '1 month')::TEXT,
        'description', 'Resets monthly on the 1st',
        'monthly_limit', max_allowed
      )
      WHEN p_usage_limit = 'unlimited' THEN json_build_object(
        'type', 'unlimited',
        'description', 'No usage limits'
      )
      ELSE json_build_object(
        'type', 'unknown',
        'description', 'Unknown usage limit type'
      )
    END,
    'validation_timestamp', NOW()
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_enhanced_usage_limit TO authenticated;

-- Update the get_user_coupon_usage function to use the enhanced version
CREATE OR REPLACE FUNCTION get_enhanced_user_coupon_usage(
  p_user_uid UUID,
  p_coupon_uid UUID
) RETURNS JSON AS $$
DECLARE
  coupon_info RECORD;
  usage_stats JSON;
BEGIN
  -- Get coupon information
  SELECT usage_limit, monthly_limit
  INTO coupon_info
  FROM coupons
  WHERE uid = p_coupon_uid;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'error', 'Coupon not found',
      'can_redeem', false
    );
  END IF;
  
  -- Check usage using the enhanced function
  SELECT check_enhanced_usage_limit(p_user_uid, p_coupon_uid, coupon_info.usage_limit, coupon_info.monthly_limit)
  INTO usage_stats;
  
  RETURN usage_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_enhanced_user_coupon_usage TO authenticated;

-- Create function for batch usage validation (for efficiency)
CREATE OR REPLACE FUNCTION batch_check_usage_limits(
  p_user_uid UUID,
  p_coupon_uids UUID[]
) RETURNS JSON AS $$
DECLARE
  coupon_uid UUID;
  coupon_info RECORD;
  usage_result JSON;
  final_results JSON := '[]'::JSON;
BEGIN
  -- Loop through each coupon and check usage
  FOREACH coupon_uid IN ARRAY p_coupon_uids
  LOOP
    -- Get coupon information
    SELECT uid, usage_limit, monthly_limit, title
    INTO coupon_info
    FROM coupons
    WHERE uid = coupon_uid;
    
    IF FOUND THEN
      -- Check usage for this coupon
      SELECT check_enhanced_usage_limit(p_user_uid, coupon_uid, coupon_info.usage_limit, coupon_info.monthly_limit)
      INTO usage_result;
      
      -- Add coupon info to result
      usage_result := usage_result || json_build_object(
        'coupon_uid', coupon_uid,
        'coupon_title', coupon_info.title
      );
      
      -- Append to results array
      SELECT json_agg(result_item)
      FROM (
        SELECT json_array_elements(final_results) AS result_item
        UNION ALL
        SELECT usage_result
      ) AS combined
      INTO final_results;
    END IF;
  END LOOP;
  
  RETURN json_build_object(
    'user_uid', p_user_uid,
    'checked_coupons', array_length(p_coupon_uids, 1),
    'results', final_results,
    'validation_timestamp', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION batch_check_usage_limits TO authenticated;

-- Add indexes for improved performance with new usage limit types
CREATE INDEX IF NOT EXISTS idx_redemptions_user_coupon_week 
ON redemptions (user_uid, coupon_uid, DATE_TRUNC('week', created_at))
WHERE status = 'redeemed';

CREATE INDEX IF NOT EXISTS idx_redemptions_monthly_usage 
ON redemptions (user_uid, coupon_uid, redemption_month)
WHERE status = 'redeemed';

-- Add comments for documentation
COMMENT ON FUNCTION check_enhanced_usage_limit IS 'Enhanced validation for all usage limit types including monthly_one, monthly_two, monthly_four';
COMMENT ON FUNCTION get_enhanced_user_coupon_usage IS 'Gets current usage statistics with enhanced usage limit support';
COMMENT ON FUNCTION batch_check_usage_limits IS 'Efficiently validates usage limits for multiple coupons at once';

-- Update existing data to use new usage limit types (if needed)
-- This is optional and should be run carefully in production
-- UPDATE coupons SET usage_limit = 'monthly_one' WHERE usage_limit = 'monthly' AND monthly_limit = 1;
-- UPDATE coupons SET usage_limit = 'monthly_two' WHERE usage_limit = 'monthly' AND monthly_limit = 2;
-- UPDATE coupons SET usage_limit = 'monthly_four' WHERE usage_limit = 'monthly' AND monthly_limit = 4;