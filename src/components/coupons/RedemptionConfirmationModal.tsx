/**
 * Redemption Confirmation Modal
 * Best-in-class UX for confirming coupon redemption
 */

import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Gift, AlertTriangle, CheckCircle, Clock, 
  Sparkles, Zap, Users, Star, Timer
} from 'lucide-react';
import type { CouponWithBusiness } from '@/hooks/useEnhancedCouponDiscovery';

interface RedemptionConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  coupon: CouponWithBusiness;
  remainingUses: string;
  estimatedSavings: number;
}

export default function RedemptionConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  coupon,
  remainingUses,
  estimatedSavings
}: RedemptionConfirmationModalProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  // Auto-close countdown for dramatic effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isConfirming && countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            setIsConfirming(false);
            setShowSuccess(true);
            setTimeout(() => {
              setShowSuccess(false);
              onConfirm();
            }, 1500);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isConfirming, countdown, onConfirm]);

  const handleConfirm = () => {
    setIsConfirming(true);
    setCountdown(3); // 3-second dramatic countdown
  };

  const handleCancel = () => {
    if (isConfirming) return; // Prevent cancel during confirmation
    onClose();
  };

  // Reset states when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsConfirming(false);
      setCountdown(0);
      setShowSuccess(false);
    }
  }, [isOpen]);

  // Format savings display
  const formatSavings = () => {
    if (coupon.discount_type === 'percentage' && coupon.discount_value) {
      return `${coupon.discount_value}% OFF`;
    }
    if (coupon.discount_type === 'fixed_amount' && coupon.discount_value) {
      return `$${coupon.discount_value} OFF`;
    }
    return coupon.discount_text || 'Special Offer';
  };

  // Success animation content
  if (showSuccess) {
    return (
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-8">
            <div className="relative mb-6">
              <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 animate-pulse">
                <Sparkles className="w-8 h-8 text-yellow-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Redemption Starting!
            </h2>
            <p className="text-gray-600">
              Generating your QR code now...
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Confirmation countdown content
  if (isConfirming) {
    return (
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-8">
            <div className="relative mb-6">
              <div className="w-24 h-24 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center mx-auto animate-pulse">
                <Timer className="w-12 h-12 text-white" />
              </div>
              <div className="absolute inset-0 border-4 border-orange-400 rounded-full animate-ping"></div>
            </div>
            
            <div className="text-6xl font-bold text-orange-500 mb-4 animate-bounce">
              {countdown}
            </div>
            
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Starting Redemption...
            </h2>
            <p className="text-gray-600 text-sm">
              Please don't close this window
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-center pb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Gift className="w-8 h-8 text-white" />
          </div>
          <DialogTitle className="text-2xl font-bold">
            Ready to Redeem?
          </DialogTitle>
          <p className="text-gray-600 mt-2">
            This will use one of your available redemptions
          </p>
        </DialogHeader>

        {/* Coupon Summary */}
        <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-6 mb-6">
          <div className="text-center mb-4">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {coupon.title}
            </h3>
            <div className="flex items-center justify-center space-x-2 mb-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                {coupon.business.name.charAt(0)}
              </div>
              <span className="font-medium text-gray-700">{coupon.business.name}</span>
            </div>
          </div>

          {/* Savings Highlight */}
          <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Zap className="w-5 h-5 text-yellow-500 mr-2" />
                <span className="font-semibold">Your Savings:</span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">
                  {formatSavings()}
                </div>
                {estimatedSavings > 0 && (
                  <div className="text-sm text-gray-600">
                    Up to ${estimatedSavings.toFixed(0)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Usage Information */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <Clock className="w-4 h-4 text-gray-400 mr-1" />
              <span className="text-gray-600">Remaining uses:</span>
            </div>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {remainingUses}
            </Badge>
          </div>
        </div>

        {/* Important Information */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-1 flex-shrink-0" />
            <div className="text-sm">
              <h4 className="font-medium text-amber-800 mb-2">
                Before you redeem:
              </h4>
              <ul className="space-y-1 text-amber-700">
                <li>• You'll have 60 seconds to show the QR code</li>
                <li>• This action cannot be undone</li>
                <li>• Make sure you're ready to visit the business</li>
                {coupon.minimum_purchase && (
                  <li>• Minimum purchase: ${coupon.minimum_purchase}</li>
                )}
              </ul>
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Social Proof */}
        <div className="flex items-center justify-center space-x-4 text-sm text-gray-500 mb-6">
          <div className="flex items-center">
            <Users className="w-4 h-4 mr-1" />
            <span>{coupon.current_usage_count || 0} people saved</span>
          </div>
          {(coupon.featured || coupon.is_featured) && (
            <div className="flex items-center">
              <Star className="w-4 h-4 mr-1 text-yellow-500" />
              <span>Featured deal</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleCancel}
            disabled={isConfirming}
          >
            Maybe Later
          </Button>
          <Button
            className="flex-1 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 shadow-lg hover:shadow-xl transition-all duration-200"
            onClick={handleConfirm}
            disabled={isConfirming}
          >
            <Gift className="w-4 h-4 mr-2" />
            Yes, Redeem Now!
          </Button>
        </div>

        {/* Fine Print */}
        <p className="text-xs text-gray-500 text-center mt-4">
          By redeeming, you agree to the coupon terms and conditions
        </p>
      </DialogContent>
    </Dialog>
  );
}