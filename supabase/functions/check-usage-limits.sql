-- Function to check if a user can redeem a coupon based on usage limits
-- This handles one_time, daily, and monthly usage limits with proper monthly reset logic

CREATE OR REPLACE FUNCTION check_usage_limit(
  p_user_uid UUID,
  p_coupon_uid UUID, 
  p_usage_limit TEXT,
  p_monthly_limit INTEGER DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  usage_count INTEGER := 0;
  max_allowed INTEGER := 1;
  result JSON;
BEGIN
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
        AND DATE(created_at) = CURRENT_DATE
        AND status = 'redeemed';
      max_allowed := 1;
        
    WHEN 'monthly' THEN
      -- Check usage for current month using redemption_month field
      SELECT COUNT(*) INTO usage_count
      FROM redemptions
      WHERE user_uid = p_user_uid
        AND coupon_uid = p_coupon_uid
        AND DATE_TRUNC('month', redemption_month) = DATE_TRUNC('month', NOW())
        AND status = 'redeemed';
      max_allowed := COALESCE(p_monthly_limit, 1);
  END CASE;
  
  -- Build result JSON
  SELECT json_build_object(
    'can_redeem', usage_count < max_allowed,
    'current_usage', usage_count,
    'max_allowed', max_allowed,
    'remaining', GREATEST(max_allowed - usage_count, 0),
    'usage_type', p_usage_limit,
    'reset_info', CASE 
      WHEN p_usage_limit = 'daily' THEN 'Resets daily at midnight'
      WHEN p_usage_limit = 'monthly' THEN 'Resets monthly on the 1st'
      WHEN p_usage_limit = 'one_time' THEN 'One time use only'
      ELSE 'Unknown'
    END
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_usage_limit TO authenticated;

-- Function to get usage statistics for a user across all their coupon redemptions
CREATE OR REPLACE FUNCTION get_user_coupon_usage(
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
  
  -- Check usage using the existing function
  SELECT check_usage_limit(p_user_uid, p_coupon_uid, coupon_info.usage_limit, coupon_info.monthly_limit)
  INTO usage_stats;
  
  RETURN usage_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_user_coupon_usage TO authenticated;

-- Create index for better performance on redemption queries
CREATE INDEX IF NOT EXISTS idx_redemptions_user_coupon_month 
ON redemptions (user_uid, coupon_uid, DATE_TRUNC('month', redemption_month));

CREATE INDEX IF NOT EXISTS idx_redemptions_user_coupon_date 
ON redemptions (user_uid, coupon_uid, DATE(created_at));

-- Add comments for documentation
COMMENT ON FUNCTION check_usage_limit IS 'Validates if a user can redeem a coupon based on usage limits (one_time, daily, monthly)';
COMMENT ON FUNCTION get_user_coupon_usage IS 'Gets current usage statistics for a specific user and coupon combination';