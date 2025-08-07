/**
 * SubscriptionGate Component
 * Controls what content users see based on their subscription status
 */

import React from 'react';
import { useSubscriptionViews } from '../hooks/useSubscriptionStatus';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Crown, Star, Clock, X } from 'lucide-react';

interface SubscriptionGateProps {
  children: React.ReactNode;
  requiredPlan?: 'free' | 'premium' | 'business';
  fallback?: React.ReactNode;
}

export function SubscriptionGate({ children, requiredPlan = 'free', fallback }: SubscriptionGateProps) {
  const { viewType, showUpgradePrompt, upgradeMessage } = useSubscriptionViews();

  // Always allow free content
  if (requiredPlan === 'free') {
    return <>{children}</>;
  }

  // Check access based on view type
  const hasAccess = (() => {
    switch (requiredPlan) {
      case 'premium':
        return viewType === 'premium' || viewType === 'business';
      case 'business':
        return viewType === 'business';
      default:
        return true;
    }
  })();

  if (hasAccess) {
    return <>{children}</>;
  }

  // Show fallback or default upgrade prompt
  if (fallback) {
    return <>{fallback}</>;
  }

  return <UpgradePrompt requiredPlan={requiredPlan} message={upgradeMessage} />;
}

interface UpgradePromptProps {
  requiredPlan: 'premium' | 'business';
  message: string;
}

function UpgradePrompt({ requiredPlan, message }: UpgradePromptProps) {
  const handleUpgrade = () => {
    // Navigate to upgrade page
    window.location.href = '/upgrade';
  };

  const getPlanIcon = () => {
    switch (requiredPlan) {
      case 'premium':
        return <Star className="h-8 w-8 text-yellow-500" />;
      case 'business':
        return <Crown className="h-8 w-8 text-purple-500" />;
    }
  };

  const getPlanColor = () => {
    switch (requiredPlan) {
      case 'premium':
        return 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200';
      case 'business':
        return 'bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200';
    }
  };

  return (
    <Card className={`text-center ${getPlanColor()}`}>
      <CardHeader>
        <div className="flex justify-center mb-4">
          {getPlanIcon()}
        </div>
        <CardTitle className="flex items-center justify-center gap-2">
          {requiredPlan === 'premium' ? 'Premium' : 'Business'} Feature
          <Badge variant="secondary" className="ml-2">
            {requiredPlan.toUpperCase()}
          </Badge>
        </CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={handleUpgrade} className="w-full mb-4">
          Upgrade to {requiredPlan === 'premium' ? 'Premium' : 'Business'}
        </Button>
        <p className="text-sm text-muted-foreground">
          {requiredPlan === 'premium' 
            ? 'Get unlimited coupon access, exclusive deals, and priority support.'
            : 'Create and manage your own coupons, track analytics, and grow your business.'
          }
        </p>
      </CardContent>
    </Card>
  );
}

// Status Badge Component
export function SubscriptionStatusBadge() {
  const { viewType, subscriptionStatus } = useSubscriptionViews();

  const getBadgeProps = () => {
    switch (viewType) {
      case 'free':
        return { variant: 'secondary' as const, text: 'Free', icon: null };
      case 'premium':
        return { variant: 'default' as const, text: 'Premium', icon: <Star className="h-3 w-3" /> };
      case 'business':
        return { variant: 'default' as const, text: 'Business', icon: <Crown className="h-3 w-3" /> };
      case 'expired':
        return { variant: 'destructive' as const, text: 'Expired', icon: <X className="h-3 w-3" /> };
    }
  };

  const { variant, text, icon } = getBadgeProps();

  return (
    <Badge variant={variant} className="flex items-center gap-1">
      {icon}
      {text}
      {subscriptionStatus.daysUntilExpiry && subscriptionStatus.daysUntilExpiry <= 7 && (
        <Clock className="h-3 w-3 ml-1" />
      )}
    </Badge>
  );
}

// Coupon Limit Component
export function CouponLimitDisplay() {
  const { viewType } = useSubscriptionViews();

  const getLimitInfo = () => {
    switch (viewType) {
      case 'free':
        return { limit: 5, text: '5 coupons per month' };
      case 'premium':
      case 'business':
        return { limit: null, text: 'Unlimited coupons' };
      case 'expired':
        return { limit: 0, text: 'No access - subscription expired' };
    }
  };

  const { limit, text } = getLimitInfo();

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      {limit === null ? (
        <Star className="h-4 w-4 text-yellow-500" />
      ) : limit === 0 ? (
        <X className="h-4 w-4 text-red-500" />
      ) : (
        <span className="font-medium">{limit}</span>
      )}
      {text}
    </div>
  );
}