/**
 * Redemption Validation Logic
 * Core algorithms for validating coupon redemptions and usage limits
 */

import { supabase } from '@/lib/supabase';
import type { 
  UsageLimitType, 
  UsageLimitValidation, 
  RedemptionValidationResult,
  RedemptionErrorType 
} from '@/types/redemption';
import { MONTHLY_LIMITS, ERROR_MESSAGES } from '@/types/redemption';

/**
 * Validates usage limits for a specific coupon and user
 */
export async function validateUsageLimit(
  userUid: string,
  couponUid: string,
  usageLimit: UsageLimitType,
  monthlyLimit?: number
): Promise<UsageLimitValidation> {
  try {
    let usageCount = 0;
    let maxAllowed = 1;
    let resetInfo = '';
    
    switch (usageLimit) {
      case 'one_time':
        // Check if user has ever redeemed this coupon
        const { count: oneTimeCount } = await supabase
          .from('redemptions')
          .select('*', { count: 'exact', head: true })
          .eq('user_uid', userUid)
          .eq('coupon_uid', couponUid)
          .eq('status', 'redeemed');
        
        usageCount = oneTimeCount || 0;
        maxAllowed = 1;
        resetInfo = 'One time use only';
        break;
        
      case 'daily':
        // Check if user has redeemed this coupon today
        const today = new Date().toISOString().split('T')[0];
        const { count: dailyCount } = await supabase
          .from('redemptions')
          .select('*', { count: 'exact', head: true })
          .eq('user_uid', userUid)
          .eq('coupon_uid', couponUid)
          .eq('status', 'redeemed')
          .gte('created_at', `${today}T00:00:00.000Z`)
          .lt('created_at', `${today}T23:59:59.999Z`);
        
        usageCount = dailyCount || 0;
        maxAllowed = 1;
        resetInfo = 'Resets daily at midnight';
        break;
        
      case 'monthly_one':
      case 'monthly_two':
      case 'monthly_four':
        // Check usage for current month using redemption_month field
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
        const { count: monthlyCount } = await supabase
          .from('redemptions')
          .select('*', { count: 'exact', head: true })
          .eq('user_uid', userUid)
          .eq('coupon_uid', couponUid)
          .eq('status', 'redeemed')
          .like('redemption_month', `${currentMonth}%`);
        
        usageCount = monthlyCount || 0;
        maxAllowed = MONTHLY_LIMITS[usageLimit] || monthlyLimit || 1;
        resetInfo = 'Resets monthly on the 1st';
        break;
        
      default:
        throw new Error(`Unsupported usage limit type: ${usageLimit}`);
    }
    
    const canRedeem = usageCount < maxAllowed;
    const remaining = Math.max(maxAllowed - usageCount, 0);
    
    // Determine error type if cannot redeem
    let errorType: RedemptionErrorType | undefined;
    let errorMessage: string | undefined;
    
    if (!canRedeem) {
      switch (usageLimit) {
        case 'one_time':
          errorType = 'ALREADY_REDEEMED';
          break;
        case 'daily':
          errorType = 'DAILY_LIMIT_REACHED';
          break;
        case 'monthly_one':
        case 'monthly_two':
        case 'monthly_four':
          errorType = 'MONTHLY_LIMIT_REACHED';
          break;
      }
      
      if (errorType) {
        errorMessage = ERROR_MESSAGES[errorType];
      }
    }
    
    return {
      canRedeem,
      currentUsage: usageCount,
      maxAllowed,
      remaining,
      usageType: usageLimit,
      resetInfo,
      errorType,
      errorMessage
    };
    
  } catch (error) {
    console.error('Error validating usage limit:', error);
    return {
      canRedeem: false,
      currentUsage: 0,
      maxAllowed: 0,
      remaining: 0,
      usageType: usageLimit,
      resetInfo: 'Error occurred during validation',
      errorType: 'VALIDATION_FAILED',
      errorMessage: ERROR_MESSAGES.VALIDATION_FAILED
    };
  }
}

/**
 * Comprehensive validation for coupon redemption
 */
export async function validateRedemption(
  userUid: string,
  couponUid: string
): Promise<RedemptionValidationResult> {
  try {
    // Get coupon details
    const { data: coupon, error: couponError } = await supabase
      .from('coupons')
      .select(`
        *,
        business:businesses(*)
      `)
      .eq('uid', couponUid)
      .single();
    
    if (couponError || !coupon) {
      return {
        isValid: false,
        canProceed: false,
        usageValidation: {
          canRedeem: false,
          currentUsage: 0,
          maxAllowed: 0,
          remaining: 0,
          usageType: 'one_time',
          resetInfo: 'Coupon not found',
          errorType: 'VALIDATION_FAILED',
          errorMessage: 'Coupon not found'
        },
        couponStatus: 'inactive',
        userSubscriptionStatus: 'inactive',
        errorType: 'VALIDATION_FAILED',
        errorMessage: 'Coupon not found'
      };
    }
    
    // Get user details
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('subscription_status')
      .eq('uid', userUid)
      .single();
    
    if (userError || !user) {
      return {
        isValid: false,
        canProceed: false,
        usageValidation: {
          canRedeem: false,
          currentUsage: 0,
          maxAllowed: 0,
          remaining: 0,
          usageType: 'one_time',
          resetInfo: 'User not found',
          errorType: 'VALIDATION_FAILED',
          errorMessage: 'User not found'
        },
        couponStatus: 'inactive',
        userSubscriptionStatus: 'inactive',
        errorType: 'VALIDATION_FAILED',
        errorMessage: 'User not found'
      };
    }
    
    // Check subscription status
    const isSubscriptionActive = user.subscription_status === 'active';
    if (!isSubscriptionActive) {
      return {
        isValid: false,
        canProceed: false,
        usageValidation: {
          canRedeem: false,
          currentUsage: 0,
          maxAllowed: 0,
          remaining: 0,
          usageType: coupon.usage_limit as UsageLimitType,
          resetInfo: 'Subscription required',
          errorType: 'USER_NOT_SUBSCRIBED',
          errorMessage: ERROR_MESSAGES.USER_NOT_SUBSCRIBED
        },
        couponStatus: coupon.active ? 'active' : 'inactive',
        userSubscriptionStatus: 'inactive',
        errorType: 'USER_NOT_SUBSCRIBED',
        errorMessage: ERROR_MESSAGES.USER_NOT_SUBSCRIBED
      };
    }
    
    // Check coupon status
    const now = new Date();
    const startDate = new Date(coupon.start_date);
    const endDate = new Date(coupon.end_date);
    
    let couponStatus: 'active' | 'expired' | 'inactive' = 'active';
    let errorType: RedemptionErrorType | undefined;
    let errorMessage: string | undefined;
    
    if (!coupon.active) {
      couponStatus = 'inactive';
      errorType = 'COUPON_INACTIVE';
      errorMessage = ERROR_MESSAGES.COUPON_INACTIVE;
    } else if (now < startDate || now > endDate) {
      couponStatus = 'expired';
      errorType = 'COUPON_EXPIRED';
      errorMessage = ERROR_MESSAGES.COUPON_EXPIRED;
    }
    
    // Validate usage limits
    const usageValidation = await validateUsageLimit(
      userUid,
      couponUid,
      coupon.usage_limit as UsageLimitType,
      coupon.monthly_limit
    );
    
    // Final validation result
    const isValid = couponStatus === 'active' && usageValidation.canRedeem;
    const canProceed = isValid && isSubscriptionActive;
    
    // Use usage validation error if coupon is active but usage limit exceeded
    if (couponStatus === 'active' && !usageValidation.canRedeem) {
      errorType = usageValidation.errorType;
      errorMessage = usageValidation.errorMessage;
    }
    
    return {
      isValid,
      canProceed,
      usageValidation,
      couponStatus,
      userSubscriptionStatus: isSubscriptionActive ? 'active' : 'inactive',
      errorType,
      errorMessage
    };
    
  } catch (error) {
    console.error('Error validating redemption:', error);
    return {
      isValid: false,
      canProceed: false,
      usageValidation: {
        canRedeem: false,
        currentUsage: 0,
        maxAllowed: 0,
        remaining: 0,
        usageType: 'one_time',
        resetInfo: 'Validation error',
        errorType: 'VALIDATION_FAILED',
        errorMessage: ERROR_MESSAGES.VALIDATION_FAILED
      },
      couponStatus: 'inactive',
      userSubscriptionStatus: 'inactive',
      errorType: 'VALIDATION_FAILED',
      errorMessage: ERROR_MESSAGES.VALIDATION_FAILED
    };
  }
}

/**
 * Get usage statistics for a user and coupon
 */
export async function getUserCouponUsage(
  userUid: string,
  couponUid: string
): Promise<UsageLimitValidation> {
  try {
    // Get coupon to determine usage limit type
    const { data: coupon } = await supabase
      .from('coupons')
      .select('usage_limit, monthly_limit')
      .eq('uid', couponUid)
      .single();
    
    if (!coupon) {
      throw new Error('Coupon not found');
    }
    
    return await validateUsageLimit(
      userUid,
      couponUid,
      coupon.usage_limit as UsageLimitType,
      coupon.monthly_limit
    );
    
  } catch (error) {
    console.error('Error getting user coupon usage:', error);
    return {
      canRedeem: false,
      currentUsage: 0,
      maxAllowed: 0,
      remaining: 0,
      usageType: 'one_time',
      resetInfo: 'Error getting usage statistics',
      errorType: 'VALIDATION_FAILED',
      errorMessage: ERROR_MESSAGES.VALIDATION_FAILED
    };
  }
}

/**
 * Check if a specific redemption is valid (for QR scanning)
 */
export async function validateRedemptionCode(
  qrCode: string,
  displayCode: string
): Promise<{ isValid: boolean; redemption?: any; error?: string }> {
  try {
    const { data: redemption, error } = await supabase
      .from('redemptions')
      .select(`
        *,
        coupon:coupons(*),
        business:businesses(*),
        user:users(*)
      `)
      .eq('qr_code', qrCode)
      .eq('display_code', displayCode)
      .eq('status', 'pending')
      .single();
    
    if (error || !redemption) {
      return {
        isValid: false,
        error: 'Invalid or expired redemption code'
      };
    }
    
    // Check if redemption has expired
    const now = new Date();
    const expiresAt = new Date(redemption.expires_at);
    
    if (now > expiresAt) {
      // Mark as expired
      await supabase
        .from('redemptions')
        .update({ status: 'expired' })
        .eq('uid', redemption.uid);
      
      return {
        isValid: false,
        error: 'Redemption code has expired'
      };
    }
    
    return {
      isValid: true,
      redemption
    };
    
  } catch (error) {
    console.error('Error validating redemption code:', error);
    return {
      isValid: false,
      error: 'Error validating redemption code'
    };
  }
}