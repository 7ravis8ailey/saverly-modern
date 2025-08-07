/**
 * Coupons Page
 * Instagram-style coupon feed with complete redemption flow
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { useToast } from '@/hooks/use-toast';
import InstagramStyleCouponFeed from '@/components/coupons/InstagramStyleCouponFeed';
import CouponDetailPage from '@/components/coupons/CouponDetailPage';
import RedemptionConfirmationModal from '@/components/coupons/RedemptionConfirmationModal';
import QRRedemptionModal from '@/components/coupons/QRRedemptionModal';
import SubscriptionMarketingPage from './SubscriptionMarketingPage';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, Gift, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { CouponWithBusiness } from '@/hooks/useEnhancedCouponDiscovery';

type ViewMode = 'feed' | 'detail' | 'confirmation' | 'qr';

interface CouponUsage {
  coupon_id: string;
  usage_count: number;
  usage_limit: string;
  last_used: string | null;
}

export default function CouponsPage() {
  const { user, loading: authLoading } = useAuth();
  const { subscriptionStatus, isLoading: subscriptionLoading } = useSubscriptionStatus();
  const { toast } = useToast();

  const [viewMode, setViewMode] = useState<ViewMode>('feed');
  const [selectedCoupon, setSelectedCoupon] = useState<CouponWithBusiness | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [usage, setUsage] = useState<Record<string, CouponUsage>>({});

  // Get user's location for distance calculations
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('Geolocation error:', error);
          // Non-blocking - app still works without location
        }
      );
    }
  }, []);

  // Load user's coupon usage data
  const loadUsageData = async (coupon: CouponWithBusiness) => {
    if (!user || usage[coupon.id]) return usage[coupon.id];

    try {
      const { data: redemptions, error } = await supabase
        .from('coupon_redemptions')
        .select('redeemed_at')
        .eq('user_id', user.uid)
        .eq('coupon_id', coupon.id);

      if (error) throw error;

      const currentMonthStart = getCurrentMonthStart();
      const monthlyRedemptions = redemptions?.filter(r => 
        new Date(r.redeemed_at) >= currentMonthStart
      ) || [];

      const couponUsage: CouponUsage = {
        coupon_id: coupon.id,
        usage_count: coupon.usage_limit === 'unlimited' 
          ? redemptions?.length || 0
          : monthlyRedemptions.length,
        usage_limit: coupon.usage_limit,
        last_used: redemptions && redemptions.length > 0 
          ? redemptions[redemptions.length - 1].redeemed_at 
          : null
      };

      setUsage(prev => ({ ...prev, [coupon.id]: couponUsage }));
      return couponUsage;
    } catch (error) {
      console.error('Error loading usage data:', error);
      return {
        coupon_id: coupon.id,
        usage_count: 0,
        usage_limit: coupon.usage_limit,
        last_used: null
      };
    }
  };

  // Get current month start based on subscription date
  const getCurrentMonthStart = () => {
    const now = new Date();
    const subscriptionStart = subscriptionStatus.periodStart ? new Date(subscriptionStatus.periodStart) : now;
    
    const currentPeriodStart = new Date(subscriptionStart);
    currentPeriodStart.setMonth(now.getMonth());
    currentPeriodStart.setFullYear(now.getFullYear());
    
    if (now.getDate() < subscriptionStart.getDate()) {
      currentPeriodStart.setMonth(currentPeriodStart.getMonth() - 1);
    }
    
    return currentPeriodStart;
  };

  // Calculate remaining uses for display
  const getRemainingUses = (coupon: CouponWithBusiness) => {
    const couponUsage = usage[coupon.id];
    if (!couponUsage) return 'Loading...';

    if (coupon.usage_limit === 'unlimited') {
      return 'Unlimited';
    }

    if (coupon.usage_limit === 'once_per_user') {
      return couponUsage.usage_count > 0 ? 'Used' : '1 time only';
    }

    const limitMatch = coupon.usage_limit.match(/(\d+)_per_month/);
    if (limitMatch) {
      const monthlyLimit = parseInt(limitMatch[1]);
      const remaining = monthlyLimit - couponUsage.usage_count;
      return remaining > 0 ? `${remaining} left this month` : 'Monthly limit reached';
    }

    return 'Available';
  };

  // Check if coupon can be redeemed
  const canRedeem = (coupon: CouponWithBusiness) => {
    const couponUsage = usage[coupon.id];
    if (!couponUsage) return true;

    if (coupon.usage_limit === 'unlimited') return true;
    if (coupon.usage_limit === 'once_per_user') return couponUsage.usage_count === 0;

    const limitMatch = coupon.usage_limit.match(/(\d+)_per_month/);
    if (limitMatch) {
      const monthlyLimit = parseInt(limitMatch[1]);
      return couponUsage.usage_count < monthlyLimit;
    }

    return true;
  };

  // Calculate estimated savings
  const getEstimatedSavings = (coupon: CouponWithBusiness) => {
    if (coupon.discount_type === 'percentage' && coupon.discount_value) {
      const avgSpend = coupon.minimum_purchase || 50;
      let savings = avgSpend * (coupon.discount_value / 100);
      if (coupon.maximum_discount) {
        savings = Math.min(savings, coupon.maximum_discount);
      }
      return savings;
    }
    if (coupon.discount_type === 'fixed_amount' && coupon.discount_value) {
      return coupon.discount_value;
    }
    return 0;
  };

  // Handlers
  const handleViewDetails = async (coupon: CouponWithBusiness) => {
    await loadUsageData(coupon);
    setSelectedCoupon(coupon);
    setViewMode('detail');
  };

  const handleStartRedemption = async (coupon: CouponWithBusiness) => {
    if (!subscriptionStatus.isActive) {
      toast({
        title: "Subscription Required",
        description: "Please upgrade to redeem coupons.",
        variant: "destructive"
      });
      return;
    }

    await loadUsageData(coupon);
    if (!canRedeem(coupon)) {
      toast({
        title: "Cannot Redeem",
        description: "You have reached the usage limit for this coupon.",
        variant: "destructive"
      });
      return;
    }

    setSelectedCoupon(coupon);
    setViewMode('confirmation');
  };

  const handleConfirmRedemption = () => {
    setViewMode('qr');
  };

  const handleRedemptionComplete = (redemptionId: string) => {
    // Update local usage data
    if (selectedCoupon) {
      const couponUsage = usage[selectedCoupon.id];
      if (couponUsage) {
        setUsage(prev => ({
          ...prev,
          [selectedCoupon.id]: {
            ...couponUsage,
            usage_count: couponUsage.usage_count + 1,
            last_used: new Date().toISOString()
          }
        }));
      }
    }

    toast({
      title: "Coupon Redeemed Successfully!",
      description: selectedCoupon ? `You saved money at ${selectedCoupon.business.name}!` : 'Coupon redeemed successfully!',
    });

    handleBackToFeed();
  };

  const handleBackToFeed = () => {
    setViewMode('feed');
    setSelectedCoupon(null);
  };

  const handleCloseModal = () => {
    setViewMode('feed');
  };

  // Loading states
  if (authLoading || subscriptionLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span>Loading...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Non-subscribers see marketing page
  if (!subscriptionStatus.isActive) {
    return <SubscriptionMarketingPage />;
  }

  // Render based on current view mode
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header for active subscribers */}
      {viewMode === 'feed' && (
        <div className="bg-white shadow-sm border-b sticky top-0 z-30">
          <div className="container mx-auto px-4 py-6">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                    <Gift className="w-8 h-8 text-blue-600" />
                    Your Coupons
                    <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                      <Crown className="w-3 h-3 mr-1" />
                      Premium
                    </Badge>
                  </h1>
                  <p className="text-gray-600">
                    Discover and redeem exclusive offers from local businesses
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {viewMode === 'feed' && (
            <InstagramStyleCouponFeed
              onViewDetails={handleViewDetails}
              onRedeemCoupon={handleStartRedemption}
            />
          )}

          {viewMode === 'detail' && selectedCoupon && (
            <CouponDetailPage
              coupon={selectedCoupon}
              onBack={handleBackToFeed}
              onRedeem={handleStartRedemption}
              canRedeem={canRedeem(selectedCoupon)}
              remainingUses={getRemainingUses(selectedCoupon)}
              userLocation={userLocation || undefined}
            />
          )}

          {/* Confirmation Modal */}
          {viewMode === 'confirmation' && selectedCoupon && (
            <RedemptionConfirmationModal
              isOpen={true}
              onClose={handleCloseModal}
              onConfirm={handleConfirmRedemption}
              coupon={selectedCoupon}
              remainingUses={getRemainingUses(selectedCoupon)}
              estimatedSavings={getEstimatedSavings(selectedCoupon)}
            />
          )}

          {/* QR Code Modal */}
          {viewMode === 'qr' && selectedCoupon && (
            <QRRedemptionModal
              isOpen={true}
              onClose={handleBackToFeed}
              onRedemptionComplete={handleRedemptionComplete}
              coupon={selectedCoupon}
            />
          )}
        </div>
      </div>
    </div>
  );
}