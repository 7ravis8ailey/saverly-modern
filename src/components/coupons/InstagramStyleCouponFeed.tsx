/**
 * Instagram-Style Coupon Feed
 * Beautiful scrollable coupon cards for active subscribers
 */

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Heart, MapPin, Clock, Star, Users, ChevronRight,
  Zap, Gift, TrendingUp, Timer, Bookmark
} from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { supabase } from '@/lib/supabase';
import type { CouponWithBusiness } from '@/hooks/useEnhancedCouponDiscovery';

interface InstagramCouponFeedProps {
  onViewDetails: (coupon: CouponWithBusiness) => void;
  onRedeemCoupon: (coupon: CouponWithBusiness) => void;
}

interface CouponUsage {
  coupon_id: string;
  usage_count: number;
  usage_limit: string;
  last_used: string | null;
}

export default function InstagramStyleCouponFeed({
  onViewDetails,
  onRedeemCoupon
}: InstagramCouponFeedProps) {
  const { user } = useAuth();
  const { subscriptionStatus } = useSubscriptionStatus();
  const [coupons, setCoupons] = useState<CouponWithBusiness[]>([]);
  const [usage, setUsage] = useState<Record<string, CouponUsage>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);

  // Load coupons and usage data
  const loadCouponsAndUsage = async () => {
    if (!user || !subscriptionStatus.isActive) return;

    try {
      // Load coupons
      const { data: couponsData, error: couponsError } = await supabase
        .from('coupons')
        .select(`
          *,
          business:businesses (
            id, name, category, formatted_address, 
            city, state, latitude, longitude
          )
        `)
        .eq('active', true)
        .gte('end_date', new Date().toISOString())
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (couponsError) throw couponsError;

      // Load user's coupon usage
      const { data: usageData, error: usageError } = await supabase
        .from('coupon_redemptions')
        .select('coupon_id, redeemed_at')
        .eq('user_id', user.uid);

      if (usageError) throw usageError;

      // Process usage data
      const usageMap: Record<string, CouponUsage> = {};
      couponsData?.forEach(coupon => {
        const redemptions = usageData?.filter(u => u.coupon_id === coupon.id) || [];
        const currentMonthStart = getCurrentMonthStart();
        const monthlyRedemptions = redemptions.filter(r => 
          new Date(r.redeemed_at) >= currentMonthStart
        );

        usageMap[coupon.id] = {
          coupon_id: coupon.id,
          usage_count: coupon.usage_limit === 'unlimited' 
            ? redemptions.length 
            : monthlyRedemptions.length,
          usage_limit: coupon.usage_limit,
          last_used: redemptions.length > 0 ? redemptions[redemptions.length - 1].redeemed_at : null
        };
      });

      setCoupons(couponsData || []);
      setUsage(usageMap);
    } catch (error) {
      console.error('Error loading coupons:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Get current month start based on subscription date
  const getCurrentMonthStart = () => {
    const now = new Date();
    const subscriptionStart = subscriptionStatus.periodStart ? new Date(subscriptionStatus.periodStart) : now;
    
    // Calculate current billing period start
    const currentPeriodStart = new Date(subscriptionStart);
    currentPeriodStart.setMonth(now.getMonth());
    currentPeriodStart.setFullYear(now.getFullYear());
    
    // If we're before the billing day this month, use last month
    if (now.getDate() < subscriptionStart.getDate()) {
      currentPeriodStart.setMonth(currentPeriodStart.getMonth() - 1);
    }
    
    return currentPeriodStart;
  };

  // Calculate remaining uses for display
  const getRemainingUses = (coupon: CouponWithBusiness) => {
    const couponUsage = usage[coupon.id];
    if (!couponUsage) return null;

    if (coupon.usage_limit === 'unlimited') {
      return 'Unlimited';
    }

    if (coupon.usage_limit === 'once_per_user') {
      return couponUsage.usage_count > 0 ? 'Used' : '1 time only';
    }

    // Extract number from usage_limit (e.g., "3_per_month" -> 3)
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

  // Format distance
  const formatDistance = (distance?: number) => {
    if (!distance) return '';
    if (distance < 1) return `${(distance * 5280).toFixed(0)}ft`;
    return `${distance.toFixed(1)}mi`;
  };

  // Format savings
  const formatSavings = (coupon: CouponWithBusiness) => {
    if (coupon.discount_type === 'percentage' && coupon.discount_value) {
      return `${coupon.discount_value}% OFF`;
    }
    if (coupon.discount_type === 'fixed_amount' && coupon.discount_value) {
      return `$${coupon.discount_value} OFF`;
    }
    return coupon.discount_text || 'Special Offer';
  };

  // Calculate estimated savings
  const getEstimatedSavings = (coupon: CouponWithBusiness) => {
    if (coupon.discount_type === 'percentage' && coupon.discount_value) {
      const avgSpend = coupon.minimum_purchase || 50;
      let savings = avgSpend * (coupon.discount_value / 100);
      if (coupon.maximum_discount) {
        savings = Math.min(savings, coupon.maximum_discount);
      }
      return `Save up to $${savings.toFixed(0)}`;
    }
    if (coupon.discount_type === 'fixed_amount' && coupon.discount_value) {
      return `Save $${coupon.discount_value}`;
    }
    return null;
  };

  // Check if coupon expires soon (within 3 days)
  const isExpiringSoon = (endDate: string) => {
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    return new Date(endDate) <= threeDaysFromNow;
  };

  useEffect(() => {
    loadCouponsAndUsage();
  }, [user, subscriptionStatus.isActive]);

  // Pull to refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCouponsAndUsage();
  };

  if (!subscriptionStatus.isActive) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Subscribe to access exclusive coupons</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-6 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div 
      ref={feedRef}
      className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto pb-20"
      style={{ scrollBehavior: 'smooth' }}
    >
      {/* Pull to refresh indicator */}
      {refreshing && (
        <div className="text-center py-4">
          <div className="inline-flex items-center text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            Refreshing coupons...
          </div>
        </div>
      )}

      {coupons.map((coupon, index) => {
        const remaining = getRemainingUses(coupon);
        const canUse = canRedeem(coupon);
        const estimatedSavings = getEstimatedSavings(coupon);
        const expiringSoon = isExpiringSoon(coupon.end_date);

        return (
          <Card 
            key={coupon.id}
            className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] cursor-pointer group ${
              !canUse ? 'opacity-75' : ''
            }`}
            onClick={() => onViewDetails(coupon)}
          >
            {/* Featured Badge */}
            {(coupon.featured || coupon.is_featured) && (
              <div className="absolute top-4 left-4 z-10">
                <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs">
                  <Star className="w-3 h-3 mr-1" />
                  Featured
                </Badge>
              </div>
            )}

            {/* Expiring Soon Badge */}
            {expiringSoon && (
              <div className="absolute top-4 right-4 z-10">
                <Badge variant="destructive" className="text-xs animate-pulse">
                  <Timer className="w-3 h-3 mr-1" />
                  Expiring Soon
                </Badge>
              </div>
            )}

            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-green-50 opacity-60"></div>
            
            <CardContent className="relative p-6">
              {/* Business Info Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {coupon.business.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg leading-tight">
                      {coupon.business.name}
                    </h3>
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <MapPin className="w-3 h-3 mr-1" />
                      <span>{coupon.business.city}, {coupon.business.state}</span>
                      {coupon.distance && (
                        <>
                          <span className="mx-2">•</span>
                          <span>{formatDistance(coupon.distance)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Usage Count */}
                <div className="text-right">
                  <div className="flex items-center text-sm text-gray-500">
                    <Users className="w-4 h-4 mr-1" />
                    <span>{coupon.current_usage_count || 0} used</span>
                  </div>
                </div>
              </div>

              {/* Coupon Title */}
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {coupon.title}
                </h2>
                <p className="text-gray-600 line-clamp-2">
                  {coupon.description}
                </p>
              </div>

              {/* Savings Display */}
              <div className="bg-gradient-to-r from-green-100 to-blue-100 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold text-green-600 mb-1">
                      {formatSavings(coupon)}
                    </div>
                    {estimatedSavings && (
                      <div className="text-sm text-gray-600">{estimatedSavings}</div>
                    )}
                  </div>
                  <div className="text-right">
                    <Zap className="w-8 h-8 text-yellow-500 mb-1" />
                    {coupon.minimum_purchase && (
                      <div className="text-xs text-gray-500">
                        Min. ${coupon.minimum_purchase}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Usage Status */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant={canUse ? "default" : "secondary"}
                    className={`text-xs ${canUse ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}
                  >
                    {remaining}
                  </Badge>
                  {coupon.usage_limit !== 'unlimited' && (
                    <div className="text-xs text-gray-500">
                      Resets {getCurrentMonthStart().getDate()}th each month
                    </div>
                  )}
                </div>

                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="w-4 h-4 mr-1" />
                  <span>Until {new Date(coupon.end_date).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  className="flex-1 group-hover:border-blue-500 group-hover:text-blue-600 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDetails(coupon);
                  }}
                >
                  <Bookmark className="w-4 h-4 mr-2" />
                  View Details
                </Button>

                <Button
                  className={`flex-1 transition-all duration-200 ${
                    canUse 
                      ? 'bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 shadow-lg hover:shadow-xl' 
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                  disabled={!canUse}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (canUse) onRedeemCoupon(coupon);
                  }}
                >
                  <Gift className="w-4 h-4 mr-2" />
                  {canUse ? 'Redeem Now' : 'Not Available'}
                  {canUse && <ChevronRight className="w-4 h-4 ml-2" />}
                </Button>
              </div>

              {/* Trending Indicator */}
              {(coupon.current_usage_count || 0) > 10 && (
                <div className="absolute bottom-2 right-2">
                  <div className="flex items-center text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Trending
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {coupons.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Coupons Available</h3>
          <p className="text-gray-500 mb-4">
            Check back soon for new deals from local businesses!
          </p>
          <Button onClick={handleRefresh} variant="outline">
            Refresh
          </Button>
        </div>
      )}

      {/* Load More / End of Feed */}
      {coupons.length > 0 && (
        <div className="text-center py-8">
          <div className="inline-flex items-center text-gray-500 text-sm">
            <Heart className="w-4 h-4 mr-2 text-red-400" />
            You've seen all available coupons
          </div>
        </div>
      )}
    </div>
  );
}