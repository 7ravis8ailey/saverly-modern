-- =====================================================
-- SAVERLY MODERN v2.0.0 - DATABASE FUNCTIONS & TRIGGERS
-- =====================================================
-- This file contains utility functions and triggers
-- Apply this AFTER 02-rls-policies.sql via Supabase Dashboard > SQL Editor

-- =====================================================
-- USER MANAGEMENT FUNCTIONS
-- =====================================================

-- Function to handle new user registration from auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (auth_uid, email, full_name, email_verified)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.email_confirmed_at IS NOT NULL, false)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile when auth user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update user profile from auth changes
CREATE OR REPLACE FUNCTION public.handle_user_auth_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET 
    email = NEW.email,
    email_verified = COALESCE(NEW.email_confirmed_at IS NOT NULL, false),
    last_login_at = CASE 
      WHEN NEW.last_sign_in_at > OLD.last_sign_in_at THEN NEW.last_sign_in_at
      ELSE last_login_at
    END,
    updated_at = NOW()
  WHERE auth_uid = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to sync auth.users changes with public.users
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_auth_update();

-- =====================================================
-- BUSINESS RATING CALCULATION FUNCTIONS
-- =====================================================

-- Function to update business average rating
CREATE OR REPLACE FUNCTION public.update_business_rating()
RETURNS TRIGGER AS $$
DECLARE
  business_id UUID;
  avg_rating DECIMAL(3,2);
  review_count INTEGER;
BEGIN
  -- Get business_uid from the review
  business_id := COALESCE(NEW.business_uid, OLD.business_uid);
  
  -- Calculate new average rating and count
  SELECT 
    ROUND(AVG(rating), 2),
    COUNT(*)
  INTO avg_rating, review_count
  FROM public.business_reviews 
  WHERE business_uid = business_id AND reported = false;
  
  -- Update business table
  UPDATE public.businesses
  SET 
    avg_rating = COALESCE(avg_rating, 0.0),
    total_reviews = COALESCE(review_count, 0),
    updated_at = NOW()
  WHERE uid = business_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers for business rating updates
DROP TRIGGER IF EXISTS update_business_rating_on_insert ON public.business_reviews;
CREATE TRIGGER update_business_rating_on_insert
  AFTER INSERT ON public.business_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_business_rating();

DROP TRIGGER IF EXISTS update_business_rating_on_update ON public.business_reviews;
CREATE TRIGGER update_business_rating_on_update
  AFTER UPDATE ON public.business_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_business_rating();

DROP TRIGGER IF EXISTS update_business_rating_on_delete ON public.business_reviews;
CREATE TRIGGER update_business_rating_on_delete
  AFTER DELETE ON public.business_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_business_rating();

-- =====================================================
-- COUPON USAGE TRACKING FUNCTIONS
-- =====================================================

-- Function to update coupon redemption count
CREATE OR REPLACE FUNCTION public.update_coupon_redemptions()
RETURNS TRIGGER AS $$
DECLARE
  coupon_id UUID;
  redemption_count INTEGER;
BEGIN
  -- Get coupon_uid from the redemption
  coupon_id := COALESCE(NEW.coupon_uid, OLD.coupon_uid);
  
  -- Count current redemptions for this coupon
  SELECT COUNT(*)
  INTO redemption_count
  FROM public.redemptions 
  WHERE coupon_uid = coupon_id AND status IN ('pending', 'redeemed');
  
  -- Update coupon table
  UPDATE public.coupons
  SET 
    current_redemptions = COALESCE(redemption_count, 0),
    updated_at = NOW()
  WHERE uid = coupon_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers for coupon redemption count updates
DROP TRIGGER IF EXISTS update_coupon_redemptions_on_insert ON public.redemptions;
CREATE TRIGGER update_coupon_redemptions_on_insert
  AFTER INSERT ON public.redemptions
  FOR EACH ROW EXECUTE FUNCTION public.update_coupon_redemptions();

DROP TRIGGER IF EXISTS update_coupon_redemptions_on_update ON public.redemptions;
CREATE TRIGGER update_coupon_redemptions_on_update
  AFTER UPDATE ON public.redemptions
  FOR EACH ROW EXECUTE FUNCTION public.update_coupon_redemptions();

DROP TRIGGER IF EXISTS update_coupon_redemptions_on_delete ON public.redemptions;
CREATE TRIGGER update_coupon_redemptions_on_delete
  AFTER DELETE ON public.redemptions
  FOR EACH ROW EXECUTE FUNCTION public.update_coupon_redemptions();

-- =====================================================
-- BUSINESS STATISTICS FUNCTIONS
-- =====================================================

-- Function to update business statistics
CREATE OR REPLACE FUNCTION public.update_business_stats()
RETURNS TRIGGER AS $$
DECLARE
  business_id UUID;
  coupon_count INTEGER;
  redemption_count INTEGER;
BEGIN
  -- Determine which business to update
  IF TG_TABLE_NAME = 'coupons' THEN
    business_id := COALESCE(NEW.business_uid, OLD.business_uid);
  ELSIF TG_TABLE_NAME = 'redemptions' THEN
    business_id := COALESCE(NEW.business_uid, OLD.business_uid);
  END IF;
  
  -- Count active coupons
  SELECT COUNT(*)
  INTO coupon_count
  FROM public.coupons 
  WHERE business_uid = business_id AND active = true;
  
  -- Count total redemptions
  SELECT COUNT(*)
  INTO redemption_count
  FROM public.redemptions 
  WHERE business_uid = business_id AND status = 'redeemed';
  
  -- Update business statistics
  UPDATE public.businesses
  SET 
    total_coupons_issued = COALESCE(coupon_count, 0),
    total_redemptions = COALESCE(redemption_count, 0),
    updated_at = NOW()
  WHERE uid = business_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers for business statistics updates
DROP TRIGGER IF EXISTS update_business_stats_coupons ON public.coupons;
CREATE TRIGGER update_business_stats_coupons
  AFTER INSERT OR UPDATE OR DELETE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION public.update_business_stats();

DROP TRIGGER IF EXISTS update_business_stats_redemptions ON public.redemptions;
CREATE TRIGGER update_business_stats_redemptions
  AFTER INSERT OR UPDATE OR DELETE ON public.redemptions
  FOR EACH ROW EXECUTE FUNCTION public.update_business_stats();

-- =====================================================
-- QR CODE GENERATION FUNCTIONS
-- =====================================================

-- Function to generate unique QR codes for redemptions
CREATE OR REPLACE FUNCTION public.generate_qr_codes()
RETURNS TRIGGER AS $$
DECLARE
  qr_code_text TEXT;
  display_code_text TEXT;
  counter INTEGER := 0;
BEGIN
  -- Generate unique QR code
  LOOP
    qr_code_text := 'SAVERLY-' || 
                   UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 12));
    
    -- Check if QR code already exists
    IF NOT EXISTS (SELECT 1 FROM public.redemptions WHERE qr_code = qr_code_text) THEN
      EXIT;
    END IF;
    
    counter := counter + 1;
    IF counter > 10 THEN
      RAISE EXCEPTION 'Unable to generate unique QR code after 10 attempts';
    END IF;
  END LOOP;
  
  -- Generate user-friendly display code
  counter := 0;
  LOOP
    display_code_text := SUBSTRING(
      UPPER(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT)) FROM 1 FOR 8
    );
    
    -- Check if display code already exists
    IF NOT EXISTS (SELECT 1 FROM public.redemptions WHERE display_code = display_code_text) THEN
      EXIT;
    END IF;
    
    counter := counter + 1;
    IF counter > 10 THEN
      RAISE EXCEPTION 'Unable to generate unique display code after 10 attempts';
    END IF;
  END LOOP;
  
  NEW.qr_code := qr_code_text;
  NEW.display_code := display_code_text;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to generate QR codes on redemption creation
DROP TRIGGER IF EXISTS generate_qr_codes_on_insert ON public.redemptions;
CREATE TRIGGER generate_qr_codes_on_insert
  BEFORE INSERT ON public.redemptions
  FOR EACH ROW 
  WHEN (NEW.qr_code IS NULL OR NEW.display_code IS NULL)
  EXECUTE FUNCTION public.generate_qr_codes();

-- =====================================================
-- USAGE LIMIT CHECKING FUNCTIONS
-- =====================================================

-- Function to check coupon usage limits before redemption
CREATE OR REPLACE FUNCTION public.check_usage_limits()
RETURNS TRIGGER AS $$
DECLARE
  coupon_record public.coupons%ROWTYPE;
  user_redemptions_count INTEGER;
  monthly_redemptions_count INTEGER;
  redemption_month_start TIMESTAMPTZ;
BEGIN
  -- Get coupon details
  SELECT * INTO coupon_record 
  FROM public.coupons 
  WHERE uid = NEW.coupon_uid;
  
  -- Check if coupon exists and is active
  IF NOT FOUND OR NOT coupon_record.active THEN
    RAISE EXCEPTION 'Coupon is not active or does not exist';
  END IF;
  
  -- Check if coupon is within date range
  IF NOW() < coupon_record.start_date OR NOW() > coupon_record.end_date THEN
    RAISE EXCEPTION 'Coupon is not within valid date range';
  END IF;
  
  -- Check maximum total redemptions
  IF coupon_record.max_total_redemptions IS NOT NULL AND 
     coupon_record.current_redemptions >= coupon_record.max_total_redemptions THEN
    RAISE EXCEPTION 'Coupon has reached maximum total redemptions';
  END IF;
  
  -- Check usage limits based on coupon type
  CASE coupon_record.usage_limit
    WHEN 'one_time' THEN
      -- Check if user has already redeemed this coupon
      SELECT COUNT(*)
      INTO user_redemptions_count
      FROM public.redemptions
      WHERE user_uid = NEW.user_uid 
        AND coupon_uid = NEW.coupon_uid
        AND status IN ('pending', 'redeemed');
      
      IF user_redemptions_count > 0 THEN
        RAISE EXCEPTION 'This coupon can only be used once per user';
      END IF;
      
    WHEN 'daily' THEN
      -- Check if user has redeemed today
      SELECT COUNT(*)
      INTO user_redemptions_count
      FROM public.redemptions
      WHERE user_uid = NEW.user_uid 
        AND coupon_uid = NEW.coupon_uid
        AND status IN ('pending', 'redeemed')
        AND created_at::DATE = CURRENT_DATE;
      
      IF user_redemptions_count > 0 THEN
        RAISE EXCEPTION 'This coupon can only be used once per day';
      END IF;
      
    WHEN 'weekly' THEN
      -- Check if user has redeemed this week
      SELECT COUNT(*)
      INTO user_redemptions_count
      FROM public.redemptions
      WHERE user_uid = NEW.user_uid 
        AND coupon_uid = NEW.coupon_uid
        AND status IN ('pending', 'redeemed')
        AND created_at >= DATE_TRUNC('week', CURRENT_DATE);
      
      IF user_redemptions_count > 0 THEN
        RAISE EXCEPTION 'This coupon can only be used once per week';
      END IF;
      
    WHEN 'monthly' THEN
      -- Calculate redemption month (first day of the month)
      redemption_month_start := DATE_TRUNC('month', NEW.redemption_month);
      
      -- Check monthly limit for this specific coupon
      SELECT COUNT(*)
      INTO monthly_redemptions_count
      FROM public.redemptions
      WHERE user_uid = NEW.user_uid 
        AND coupon_uid = NEW.coupon_uid
        AND status IN ('pending', 'redeemed')
        AND DATE_TRUNC('month', redemption_month) = redemption_month_start;
      
      IF coupon_record.monthly_limit IS NOT NULL AND 
         monthly_redemptions_count >= coupon_record.monthly_limit THEN
        RAISE EXCEPTION 'Monthly limit reached for this coupon';
      END IF;
      
    WHEN 'unlimited' THEN
      -- No additional checks needed
      NULL;
  END CASE;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check usage limits before creating redemption
DROP TRIGGER IF EXISTS check_usage_limits_on_insert ON public.redemptions;
CREATE TRIGGER check_usage_limits_on_insert
  BEFORE INSERT ON public.redemptions
  FOR EACH ROW EXECUTE FUNCTION public.check_usage_limits();

-- =====================================================
-- NOTIFICATION FUNCTIONS
-- =====================================================

-- Function to create notifications for various events
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_uid UUID,
  p_title TEXT,
  p_message TEXT,
  p_notification_type TEXT,
  p_action_url TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    user_uid, title, message, notification_type, action_url, metadata
  ) VALUES (
    p_user_uid, p_title, p_message, p_notification_type, p_action_url, p_metadata
  ) RETURNING uid INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to notify users of expiring coupons
CREATE OR REPLACE FUNCTION public.notify_expiring_coupons()
RETURNS INTEGER AS $$
DECLARE
  expiring_redemption RECORD;
  notification_count INTEGER := 0;
BEGIN
  -- Find redemptions expiring in 24 hours
  FOR expiring_redemption IN
    SELECT 
      r.user_uid,
      r.uid as redemption_uid,
      c.title as coupon_title,
      b.name as business_name,
      r.expires_at
    FROM public.redemptions r
    JOIN public.coupons c ON r.coupon_uid = c.uid
    JOIN public.businesses b ON r.business_uid = b.uid
    WHERE r.status = 'pending'
      AND r.expires_at BETWEEN NOW() AND NOW() + INTERVAL '24 hours'
      -- Only notify once per redemption
      AND NOT EXISTS (
        SELECT 1 FROM public.notifications n
        WHERE n.user_uid = r.user_uid
          AND n.notification_type = 'coupon_expiring'
          AND n.metadata->>'redemption_uid' = r.uid::text
      )
  LOOP
    -- Create notification
    PERFORM public.create_notification(
      expiring_redemption.user_uid,
      'Coupon Expiring Soon!',
      'Your coupon "' || expiring_redemption.coupon_title || '" from ' || 
      expiring_redemption.business_name || ' expires in 24 hours.',
      'coupon_expiring',
      '/redemptions/' || expiring_redemption.redemption_uid,
      jsonb_build_object(
        'redemption_uid', expiring_redemption.redemption_uid,
        'coupon_title', expiring_redemption.coupon_title,
        'business_name', expiring_redemption.business_name,
        'expires_at', expiring_redemption.expires_at
      )
    );
    
    notification_count := notification_count + 1;
  END LOOP;
  
  RETURN notification_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- CLEANUP FUNCTIONS
-- =====================================================

-- Function to clean up expired redemptions
CREATE OR REPLACE FUNCTION public.cleanup_expired_redemptions()
RETURNS INTEGER AS $$
DECLARE
  cleanup_count INTEGER;
BEGIN
  -- Update expired redemptions
  UPDATE public.redemptions
  SET status = 'expired'
  WHERE status = 'pending' 
    AND expires_at < NOW();
  
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  RETURN cleanup_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to archive old analytics events (keep last 90 days)
CREATE OR REPLACE FUNCTION public.archive_old_analytics()
RETURNS INTEGER AS $$
DECLARE
  archive_count INTEGER;
BEGIN
  -- Delete analytics events older than 90 days
  DELETE FROM public.analytics_events
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS archive_count = ROW_COUNT;
  RETURN archive_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;