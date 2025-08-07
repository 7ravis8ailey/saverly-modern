/**
 * Redemption Flow Types
 * Defines all types for the coupon redemption system including usage limits and validation
 */

export type UsageLimitType = 'one_time' | 'daily' | 'monthly_one' | 'monthly_two' | 'monthly_four';

export type RedemptionErrorType = 
  | 'ALREADY_REDEEMED'
  | 'DAILY_LIMIT_REACHED' 
  | 'MONTHLY_LIMIT_REACHED'
  | 'COUPON_EXPIRED'
  | 'COUPON_INACTIVE'
  | 'USER_NOT_SUBSCRIBED'
  | 'VALIDATION_FAILED'
  | 'NETWORK_ERROR';

export interface UsageLimitValidation {
  canRedeem: boolean;
  currentUsage: number;
  maxAllowed: number;
  remaining: number;
  usageType: UsageLimitType;
  resetInfo: string;
  errorType?: RedemptionErrorType;
  errorMessage?: string;
}

export interface RedemptionValidationResult {
  isValid: boolean;
  canProceed: boolean;
  usageValidation: UsageLimitValidation;
  couponStatus: 'active' | 'expired' | 'inactive';
  userSubscriptionStatus: 'active' | 'inactive';
  errorType?: RedemptionErrorType;
  errorMessage?: string;
}

export interface RedemptionFlowState {
  step: 'initial' | 'validating' | 'confirming' | 'generating' | 'success' | 'error';
  isLoading: boolean;
  showConfirmation: boolean;
  showSuccess: boolean;
  confirmationTimeLeft: number;
  error: string | null;
  errorType?: RedemptionErrorType;
  redemption: any | null;
  qrContent: string;
  displayCode: string;
}

export interface RedemptionConfirmationData {
  coupon: any;
  business: any;
  usageValidation: UsageLimitValidation;
  estimatedSavings: string;
  expirationTime: number; // 60 seconds
}

export interface RedemptionSuccessData {
  redemptionId: string;
  couponTitle: string;
  businessName: string;
  discountAmount: string;
  savedAmount: string;
  redemptionCode: string;
  timestamp: string;
}

// Monthly usage limit configuration
export const MONTHLY_LIMITS: Record<string, number> = {
  'monthly_one': 1,
  'monthly_two': 2, 
  'monthly_four': 4
} as const;

// Error messages for each error type
export const ERROR_MESSAGES: Record<RedemptionErrorType, string> = {
  'ALREADY_REDEEMED': 'You have already redeemed this coupon. One-time coupons can only be used once.',
  'DAILY_LIMIT_REACHED': 'You have already redeemed this coupon today. Please try again tomorrow.',
  'MONTHLY_LIMIT_REACHED': 'You have reached the monthly limit for this coupon. Please try again next month.',
  'COUPON_EXPIRED': 'This coupon has expired and can no longer be redeemed.',
  'COUPON_INACTIVE': 'This coupon is currently inactive and cannot be redeemed.',
  'USER_NOT_SUBSCRIBED': 'You must be an active subscriber to redeem coupons.',
  'VALIDATION_FAILED': 'Unable to validate coupon redemption. Please try again.',
  'NETWORK_ERROR': 'Network error occurred. Please check your connection and try again.'
} as const;

// Success animation configuration
export const SUCCESS_ANIMATION_CONFIG = {
  duration: 3000, // 3 seconds
  message: 'Successful Redemption - Thank you for using Saverly!',
  checkmarkDelay: 500,
  textDelay: 1000,
  fadeOutDelay: 2500
} as const;

// Confirmation dialog configuration  
export const CONFIRMATION_CONFIG = {
  countdownDuration: 60, // 60 seconds
  warningThreshold: 10, // Show warning when < 10 seconds left
  autoCloseOnExpire: true
} as const;