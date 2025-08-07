import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { generateUniqueQRCode, generateDisplayCode, createQRContent } from '@/lib/qr-utils';
import type { Coupon, Redemption } from '@/types';

interface UseQRRedemptionParams {
  coupon: Coupon;
  userUid: string;
}

interface QRRedemptionState {
  isLoading: boolean;
  error: string | null;
  redemption: Redemption | null;
  timeLeft: number;
  progress: number;
  isExpired: boolean;
  qrContent: string;
  displayCode: string;
}

export function useQRRedemption({ coupon, userUid }: UseQRRedemptionParams) {
  const [state, setState] = useState<QRRedemptionState>({
    isLoading: false,
    error: null,
    redemption: null,
    timeLeft: 60,
    progress: 100,
    isExpired: false,
    qrContent: '',
    displayCode: ''
  });

  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  /**
   * Create a new redemption record in database
   */
  const createRedemption = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Generate unique codes
      const qrCode = generateUniqueQRCode();
      const displayCode = generateDisplayCode();
      
      // Calculate expiration time (60 seconds from now)
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

      setState(prev => ({
        ...prev,
        isLoading: false,
        redemption,
        qrContent,
        displayCode,
        timeLeft: 60,
        progress: 100,
        isExpired: false
      }));

      return redemption;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create redemption'
      }));
      return null;
    }
  }, [coupon, userUid]);

  /**
   * Start the 60-second countdown timer
   */
  const startTimer = useCallback(() => {
    if (intervalId) {
      clearInterval(intervalId);
    }

    const newIntervalId = setInterval(() => {
      setState(prev => {
        const newTimeLeft = prev.timeLeft - 1;
        const newProgress = (newTimeLeft / 60) * 100;
        
        if (newTimeLeft <= 0) {
          return {
            ...prev,
            timeLeft: 0,
            progress: 0,
            isExpired: true
          };
        }

        return {
          ...prev,
          timeLeft: newTimeLeft,
          progress: newProgress
        };
      });
    }, 1000);

    setIntervalId(newIntervalId);
  }, [intervalId]);

  /**
   * Stop the countdown timer
   */
  const stopTimer = useCallback(() => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
  }, [intervalId]);

  /**
   * Reset the QR redemption state
   */
  const reset = useCallback(() => {
    stopTimer();
    setState({
      isLoading: false,
      error: null,
      redemption: null,
      timeLeft: 60,
      progress: 100,
      isExpired: false,
      qrContent: '',
      displayCode: ''
    });
  }, [stopTimer]);

  /**
   * Initialize QR redemption - creates redemption and starts timer
   */
  const initializeQR = useCallback(async () => {
    const redemption = await createRedemption();
    if (redemption) {
      startTimer();
    }
    return redemption;
  }, [createRedemption, startTimer]);

  /**
   * Update redemption status to redeemed
   */
  const markAsRedeemed = useCallback(async () => {
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

      setState(prev => ({
        ...prev,
        redemption: prev.redemption ? {
          ...prev.redemption,
          status: 'redeemed',
          redeemedAt: new Date().toISOString()
        } : null
      }));

      stopTimer();
      return true;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to mark as redeemed'
      }));
      return false;
    }
  }, [state.redemption, stopTimer]);

  /**
   * Clean up timer on unmount
   */
  useEffect(() => {
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [intervalId]);

  /**
   * Auto-expire when timer reaches 0
   */
  useEffect(() => {
    if (state.isExpired && state.redemption && state.redemption.status === 'pending') {
      // Mark as expired in database
      supabase
        .from('redemptions')
        .update({ status: 'expired' })
        .eq('uid', state.redemption.uid)
        .then(() => {
          stopTimer();
        });
    }
  }, [state.isExpired, state.redemption, stopTimer]);

  /**
   * Format time as MM:SS
   */
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, []);

  return {
    ...state,
    initializeQR,
    reset,
    markAsRedeemed,
    formatTime,
    formattedTime: formatTime(state.timeLeft),
    isLowTime: state.progress <= 25
  };
}