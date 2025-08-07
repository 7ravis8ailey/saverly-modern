/**
 * Redemption Flow Hook
 * Complete hook that manages the entire coupon redemption flow with usage limit validation
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { generateUniqueQRCode, generateDisplayCode, createQRContent } from '@/lib/qr-utils';
import { validateRedemption } from '@/lib/redemption-validation';
import { useSuccessAnimation } from '@/components/success-animation';
import type { 
  RedemptionFlowState, 
  RedemptionConfirmationData, 
  RedemptionSuccessData,
  RedemptionValidationResult,
  RedemptionErrorType
} from '@/types/redemption';
import type { Coupon } from '@/types';

interface UseRedemptionFlowParams {
  coupon: Coupon;
  userUid: string;
  onSuccess?: (data: RedemptionSuccessData) => void;
  onError?: (error: string, errorType?: RedemptionErrorType) => void;
}

export function useRedemptionFlow({
  coupon,
  userUid,
  onSuccess,
  onError
}: UseRedemptionFlowParams) {
  // State management
  const [state, setState] = useState<RedemptionFlowState>({
    step: 'initial',
    isLoading: false,
    showConfirmation: false,
    showSuccess: false,
    confirmationTimeLeft: 60,
    error: null,
    errorType: undefined,
    redemption: null,
    qrContent: '',
    displayCode: ''
  });
  
  const [confirmationData, setConfirmationData] = useState<RedemptionConfirmationData | null>(null);
  const [validationResult, setValidationResult] = useState<RedemptionValidationResult | null>(null);
  
  // Success animation hook
  const successAnimation = useSuccessAnimation();
  
  /**
   * Update state helper
   */
  const updateState = useCallback((updates: Partial<RedemptionFlowState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);
  
  /**
   * Reset the entire flow state
   */
  const resetFlow = useCallback(() => {
    setState({
      step: 'initial',
      isLoading: false,
      showConfirmation: false,
      showSuccess: false,
      confirmationTimeLeft: 60,
      error: null,
      errorType: undefined,
      redemption: null,
      qrContent: '',
      displayCode: ''
    });
    setConfirmationData(null);
    setValidationResult(null);
    successAnimation.hideSuccess();
  }, [successAnimation]);
  
  /**
   * Handle errors with proper state updates
   */
  const handleError = useCallback((error: string, errorType?: RedemptionErrorType) => {
    updateState({
      step: 'error',
      isLoading: false,
      error,
      errorType
    });
    onError?.(error, errorType);
  }, [updateState, onError]);
  
  /**
   * Step 1: Validate redemption eligibility
   */
  const validateEligibility = useCallback(async (): Promise<boolean> => {
    updateState({ step: 'validating', isLoading: true, error: null });
    
    try {
      const result = await validateRedemption(userUid, coupon.uid);
      setValidationResult(result);
      
      if (!result.canProceed) {
        handleError(
          result.errorMessage || 'Cannot redeem this coupon',
          result.errorType
        );
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Validation error:', error);
      handleError(
        'Network error during validation. Please try again.',
        'NETWORK_ERROR'
      );
      return false;
    }
  }, [userUid, coupon.uid, updateState, handleError]);
  
  /**
   * Step 2: Show confirmation dialog
   */
  const showConfirmationDialog = useCallback(async () => {
    if (!validationResult?.canProceed) {
      handleError('Invalid validation state', 'VALIDATION_FAILED');
      return;
    }
    
    try {
      // Get business details
      const { data: business, error: businessError } = await supabase
        .from('businesses')
        .select('*')
        .eq('uid', coupon.businessUid)
        .single();
      
      if (businessError || !business) {
        handleError('Could not load business details', 'VALIDATION_FAILED');
        return;
      }
      
      // Calculate estimated savings (simplified)
      const estimatedSavings = coupon.discount.includes('%') 
        ? `${coupon.discount} off your purchase`
        : coupon.discount;
      
      const confirmData: RedemptionConfirmationData = {
        coupon,
        business,
        usageValidation: validationResult.usageValidation,
        estimatedSavings,
        expirationTime: 60
      };
      
      setConfirmationData(confirmData);
      updateState({ 
        step: 'confirming', 
        showConfirmation: true, 
        isLoading: false 
      });
      
    } catch (error) {
      console.error('Error preparing confirmation:', error);
      handleError(
        'Error preparing confirmation dialog',
        'VALIDATION_FAILED'
      );
    }
  }, [validationResult, coupon, updateState, handleError]);
  
  /**
   * Step 3: Generate QR code after confirmation
   */
  const generateQRCode = useCallback(async (): Promise<boolean> => {
    updateState({ step: 'generating', isLoading: true, showConfirmation: false });
    
    try {
      // Generate unique codes
      const qrCode = generateUniqueQRCode();
      const displayCode = generateDisplayCode();
      
      // Calculate expiration (60 seconds from now)
      const expiresAt = new Date(Date.now() + 60 * 1000).toISOString();
      const redemptionMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
      
      // Create redemption record
      const { data: redemption, error } = await supabase
        .from('redemptions')
        .insert({
          user_uid: userUid,
          coupon_uid: coupon.uid,
          business_uid: coupon.businessUid,
          qr_code: qrCode,
          display_code: displayCode,
          status: 'pending',
          redemption_month: redemptionMonth,
          expires_at: expiresAt
        })
        .select()
        .single();
      
      if (error) {
        throw new Error(error.message);
      }
      
      // Create QR content
      const qrContent = JSON.stringify(createQRContent({
        couponId: coupon.uid,
        businessId: coupon.businessUid,
        userUid,
        redemptionId: redemption.uid,
        qrCode,
        displayCode
      }));
      
      updateState({
        step: 'success',
        isLoading: false,
        redemption,
        qrContent,
        displayCode
      });
      
      return true;
      
    } catch (error) {
      console.error('Error generating QR code:', error);
      handleError(
        error instanceof Error ? error.message : 'Failed to generate QR code',
        'VALIDATION_FAILED'
      );
      return false;
    }
  }, [userUid, coupon, updateState, handleError]);
  
  /**
   * Step 4: Show success animation
   */
  const showSuccessAnimation = useCallback(() => {
    if (!state.redemption || !confirmationData) return;
    
    const successData: RedemptionSuccessData = {
      redemptionId: state.redemption.uid,
      couponTitle: coupon.title,
      businessName: confirmationData.business.name,
      discountAmount: coupon.discount,
      savedAmount: confirmationData.estimatedSavings,
      redemptionCode: state.displayCode,
      timestamp: new Date().toISOString()
    };
    
    successAnimation.showSuccess(successData);
    updateState({ showSuccess: true });
    onSuccess?.(successData);
  }, [state.redemption, state.displayCode, confirmationData, coupon, successAnimation, updateState, onSuccess]);
  
  /**
   * Main redemption flow trigger
   */
  const startRedemption = useCallback(async () => {
    const isValid = await validateEligibility();
    if (isValid) {
      await showConfirmationDialog();
    }
  }, [validateEligibility, showConfirmationDialog]);
  
  /**
   * Confirmation handler
   */
  const confirmRedemption = useCallback(async () => {
    const success = await generateQRCode();
    if (success) {
      showSuccessAnimation();
    }
  }, [generateQRCode, showSuccessAnimation]);
  
  /**
   * Close confirmation dialog
   */
  const closeConfirmation = useCallback(() => {
    updateState({ 
      step: 'initial', 
      showConfirmation: false, 
      isLoading: false 
    });
    setConfirmationData(null);
  }, [updateState]);
  
  /**
   * Mark redemption as used (called by business)
   */
  const markAsRedeemed = useCallback(async (): Promise<boolean> => {
    if (!state.redemption) return false;
    
    try {
      const { error } = await supabase
        .from('redemptions')
        .update({
          status: 'redeemed',
          redeemed_at: new Date().toISOString()
        })
        .eq('uid', state.redemption.uid);
      
      if (error) {
        throw new Error(error.message);
      }
      
      updateState({
        redemption: {
          ...state.redemption,
          status: 'redeemed',
          redeemedAt: new Date().toISOString()
        }
      });
      
      return true;
    } catch (error) {
      console.error('Error marking as redeemed:', error);
      return false;
    }
  }, [state.redemption, updateState]);
  
  /**
   * Get current validation status
   */
  const getCurrentValidation = useCallback(async () => {
    return await validateRedemption(userUid, coupon.uid);
  }, [userUid, coupon.uid]);
  
  // Auto-expire redemptions
  useEffect(() => {
    if (state.redemption && state.redemption.status === 'pending') {
      const expiresAt = new Date(state.redemption.expires_at);
      const now = new Date();
      const timeLeft = expiresAt.getTime() - now.getTime();
      
      if (timeLeft > 0) {
        const timeout = setTimeout(() => {
          // Mark as expired
          supabase
            .from('redemptions')
            .update({ status: 'expired' })
            .eq('uid', state.redemption.uid);
          
          updateState({
            redemption: {
              ...state.redemption,
              status: 'expired'
            }
          });
        }, timeLeft);
        
        return () => clearTimeout(timeout);
      }
    }
  }, [state.redemption, updateState]);
  
  return {
    // State
    ...state,
    confirmationData,
    validationResult,
    
    // Success animation
    successAnimation,
    
    // Actions
    startRedemption,
    confirmRedemption,
    closeConfirmation,
    resetFlow,
    markAsRedeemed,
    getCurrentValidation,
    
    // Helpers
    canRedeem: validationResult?.canProceed || false,
    isRedemptionExpired: state.redemption?.status === 'expired',
    isRedemptionComplete: state.redemption?.status === 'redeemed'
  };
}