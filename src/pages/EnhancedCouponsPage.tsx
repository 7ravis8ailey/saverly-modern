/**
 * Enhanced Coupons Page
 * Consumer coupon discovery with advanced filtering for active subscribers
 */

import React, { useState } from 'react';
import { EnhancedCouponDiscovery } from '@/components/consumer/EnhancedCouponDiscovery';
import { CouponDetailModal } from '@/components/coupon-detail-modal';
import { EnhancedQRModal } from '@/components/enhanced-qr-modal';
import { useAuth } from '@/components/auth/auth-provider';
import { useSubscriptionViews } from '@/hooks/useSubscriptionStatus';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Zap, Search, Star, MapPin } from 'lucide-react';
import type { CouponWithBusiness } from '@/hooks/useEnhancedCouponDiscovery';

export default function EnhancedCouponsPage() {
  const { user } = useAuth();
  const { viewType, showUpgradePrompt, upgradeMessage } = useSubscriptionViews();
  const { toast } = useToast();
  
  const [selectedCoupon, setSelectedCoupon] = useState<CouponWithBusiness | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedCouponForRedemption, setSelectedCouponForRedemption] = useState<CouponWithBusiness | null>(null);

  const handleRedeemCoupon = async (coupon: CouponWithBusiness) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to redeem coupons",
        variant: "destructive"
      });
      return;
    }

    if (showUpgradePrompt) {
      toast({
        title: "Subscription Required",
        description: upgradeMessage,
        variant: "destructive"
      });
      return;
    }

    setSelectedCouponForRedemption(coupon);
    setShowQRModal(true);
  };

  const handleViewCouponDetails = (coupon: CouponWithBusiness) => {
    setSelectedCoupon(coupon);
    setShowDetailModal(true);
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedCoupon(null);
  };

  const premiumFeatures = [
    { icon: Search, text: "Business search" },
    { icon: MapPin, text: "Advanced location filtering" },
    { icon: Star, text: "Featured coupons" },
    { icon: Zap, text: "Smart savings calculator" }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                  Local Savings
                  {viewType === 'premium' && (
                    <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                      <Crown className="w-3 h-3 mr-1" />
                      Premium
                    </Badge>
                  )}
                </h1>
                <p className="text-gray-600">
                  {viewType === 'premium' 
                    ? "Discover exclusive offers with advanced filtering and business search"
                    : "Discover exclusive offers from local businesses in your area"
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Features Banner */}
      {showUpgradePrompt && (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="container mx-auto px-4 py-4">
            <div className="max-w-4xl mx-auto">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                        <Crown className="w-5 h-5" />
                        Unlock Premium Features
                      </h3>
                      <p className="text-white/90 text-sm mb-3">
                        {upgradeMessage}
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                        {premiumFeatures.map((feature, index) => (
                          <div key={index} className="flex items-center gap-2 text-white/80 text-xs">
                            <feature.icon className="w-4 h-4" />
                            <span>{feature.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="ml-4">
                      <Button 
                        className="bg-white text-blue-600 hover:bg-gray-100"
                        onClick={() => window.location.href = '/upgrade'}
                      >
                        <Crown className="w-4 h-4 mr-2" />
                        Upgrade Now
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <EnhancedCouponDiscovery
            onRedeemCoupon={handleRedeemCoupon}
            onViewCouponDetails={handleViewCouponDetails}
          />
        </div>
      </div>

      {/* Coupon Detail Modal */}
      <CouponDetailModal
        coupon={selectedCoupon}
        isOpen={showDetailModal}
        onClose={handleCloseDetailModal}
        onRedeem={handleRedeemCoupon}
        formatDistance={(distance: number) => {
          if (distance < 1) {
            return `${(distance * 5280).toFixed(0)} ft`;
          }
          return `${distance.toFixed(1)} mi`;
        }}
        isExpiringSoon={(endDate: string) => {
          const sevenDaysFromNow = new Date();
          sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
          return new Date(endDate) <= sevenDaysFromNow;
        }}
      />

      {/* QR Redemption Modal */}
      {selectedCouponForRedemption && user && (
        <EnhancedQRModal
          isOpen={showQRModal}
          onClose={() => {
            setShowQRModal(false);
            setSelectedCouponForRedemption(null);
          }}
          coupon={selectedCouponForRedemption}
          userUid={user.uid}
          onRedemptionSuccess={(data) => {
            toast({
              title: "Coupon Redeemed!",
              description: `Successfully redeemed: ${selectedCouponForRedemption.title}`,
            });
            setShowQRModal(false);
            setSelectedCouponForRedemption(null);
          }}
          onRedemptionError={(error, errorType) => {
            toast({
              title: "Redemption Failed",
              description: error,
              variant: "destructive"
            });
          }}
        />
      )}
    </div>
  );
}