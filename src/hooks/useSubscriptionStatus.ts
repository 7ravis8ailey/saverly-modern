/**
 * useSubscriptionStatus Hook
 * Handles subscription status logic and view changes for consumers
 */

import { useEffect, useState } from 'react';
import { useAuthProvider } from './use-auth';
import { supabase } from '@/lib/supabase-api';

export interface SubscriptionStatus {
  isActive: boolean;
  status: 'free' | 'active' | 'cancelled' | 'past_due' | 'unpaid';
  periodEnd?: string;
  isExpired: boolean;
  daysUntilExpiry?: number;
}

export function useSubscriptionStatus() {
  const { user, profile: userProfile } = useAuthProvider();
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>({
    isActive: false,
    status: 'free',
    isExpired: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile) {
      setLoading(false);
      return;
    }

    checkSubscriptionStatus();
  }, [userProfile]);

  const checkSubscriptionStatus = () => {
    if (!userProfile) return;

    const now = new Date();
    const periodEnd = userProfile.subscription_period_end 
      ? new Date(userProfile.subscription_period_end) 
      : null;
    
    const isExpired = periodEnd ? now > periodEnd : false;
    const daysUntilExpiry = periodEnd 
      ? Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : undefined;

    // Determine if subscription is actually active
    const isActive = userProfile.subscription_status === 'active' && !isExpired;

    setSubscriptionStatus({
      isActive,
      status: userProfile.subscription_status || 'free',
      periodEnd: userProfile.subscription_period_end,
      isExpired,
      daysUntilExpiry: daysUntilExpiry && daysUntilExpiry > 0 ? daysUntilExpiry : undefined
    });
    
    setLoading(false);
  };

  // Real-time subscription updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('subscription-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          // Refresh subscription status when user record updates
          if (payload.new.subscription_status !== payload.old.subscription_status ||
              payload.new.subscription_period_end !== payload.old.subscription_period_end) {
            checkSubscriptionStatus();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    subscriptionStatus,
    loading,
    refreshStatus: checkSubscriptionStatus
  };
}

// Helper hook for view-specific logic
export function useSubscriptionViews() {
  const { subscriptionStatus } = useSubscriptionStatus();
  const { profile: userProfile } = useAuthProvider();

  const getViewType = (): 'free' | 'premium' | 'expired' | 'business' => {
    // Business users get business view regardless of subscription
    if (userProfile?.user_role === 'business') {
      return subscriptionStatus.isActive ? 'business' : 'expired';
    }

    // Consumer views based on subscription
    if (subscriptionStatus.isActive) {
      return 'premium';
    } else if (subscriptionStatus.status !== 'free' && subscriptionStatus.isExpired) {
      return 'expired';
    } else {
      return 'free';
    }
  };

  const showUpgradePrompt = (): boolean => {
    const viewType = getViewType();
    return viewType === 'free' || viewType === 'expired';
  };

  const getUpgradeMessage = (): string => {
    const viewType = getViewType();
    
    if (viewType === 'expired') {
      return 'Your subscription has expired. Renew to access premium features.';
    } else if (subscriptionStatus.daysUntilExpiry && subscriptionStatus.daysUntilExpiry <= 7) {
      return `Your subscription expires in ${subscriptionStatus.daysUntilExpiry} days.`;
    } else {
      return 'Upgrade to premium to unlock all features and unlimited coupon access.';
    }
  };

  return {
    viewType: getViewType(),
    showUpgradePrompt: showUpgradePrompt(),
    upgradeMessage: getUpgradeMessage(),
    subscriptionStatus
  };
}