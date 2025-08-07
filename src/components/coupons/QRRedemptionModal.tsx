/**
 * QR Code Redemption Modal
 * Displays QR code with 60-second countdown timer and visual indicators
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Dialog, 
  DialogContent 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  QrCode, Clock, CheckCircle, AlertTriangle, 
  Gift, Sparkles, Timer, Zap, X, Smartphone
} from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { supabase } from '@/lib/supabase';
import QRCodeLib from 'qrcode';
import type { CouponWithBusiness } from '@/hooks/useEnhancedCouponDiscovery';

interface QRRedemptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRedemptionComplete: (redemptionId: string) => void;
  coupon: CouponWithBusiness;
}

interface RedemptionData {
  id: string;
  qr_data: string;
  expires_at: string;
}

export default function QRRedemptionModal({
  isOpen,
  onClose,
  onRedemptionComplete,
  coupon
}: QRRedemptionModalProps) {
  const { user } = useAuth();
  const [timeLeft, setTimeLeft] = useState(60);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [redemptionData, setRedemptionData] = useState<RedemptionData | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [isGenerating, setIsGenerating] = useState(true);

  // Generate QR code and redemption record
  const generateRedemption = useCallback(async () => {
    if (!user) return;

    setIsGenerating(true);
    try {
      // Generate unique redemption ID
      const redemptionId = `redemption_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const expiresAt = new Date(Date.now() + 60000).toISOString(); // 60 seconds from now
      
      // QR Code data - includes redemption ID for tracking
      const qrData = {
        redemption_id: redemptionId,
        coupon_id: coupon.id,
        user_id: user.uid,
        business_id: coupon.business.id,
        timestamp: Date.now(),
        expires_at: expiresAt
      };

      // Generate QR code image
      const qrCodeUrl = await QRCodeLib.toDataURL(JSON.stringify(qrData), {
        width: 280,
        margin: 2,
        color: {
          dark: '#1f2937',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'H'
      });

      // Store redemption in database (considered successful redemption)
      const { error: insertError } = await supabase
        .from('coupon_redemptions')
        .insert({
          id: redemptionId,
          coupon_id: coupon.id,
          user_id: user.uid,
          qr_data: JSON.stringify(qrData),
          redeemed_at: new Date().toISOString(),
          expires_at: expiresAt,
          status: 'active'
        });

      if (insertError) {
        console.error('Error storing redemption:', insertError);
        // Continue anyway - we still show QR code for better UX
      }

      setQrCodeUrl(qrCodeUrl);
      setRedemptionData({
        id: redemptionId,
        qr_data: JSON.stringify(qrData),
        expires_at: expiresAt
      });
    } catch (error) {
      console.error('Error generating QR code:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [user, coupon]);

  // Start countdown and QR generation when modal opens
  useEffect(() => {
    if (isOpen && !redemptionData) {
      setTimeLeft(60);
      setIsComplete(false);
      generateRedemption();
    }
  }, [isOpen, redemptionData, generateRedemption]);

  // Countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isOpen && timeLeft > 0 && !isComplete && !isGenerating) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsComplete(true);
            // Update redemption status to expired
            if (redemptionData) {
              supabase
                .from('coupon_redemptions')
                .update({ status: 'expired' })
                .eq('id', redemptionData.id)
                .then(() => {
                  onRedemptionComplete(redemptionData.id);
                });
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen, timeLeft, isComplete, isGenerating, redemptionData, onRedemptionComplete]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(60);
      setQrCodeUrl('');
      setRedemptionData(null);
      setIsComplete(false);
      setIsGenerating(true);
    }
  }, [isOpen]);

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get timer color based on remaining time
  const getTimerColor = () => {
    if (timeLeft <= 10) return 'text-red-600 animate-pulse';
    if (timeLeft <= 30) return 'text-orange-600';
    return 'text-green-600';
  };

  // Get progress percentage
  const getProgress = () => {
    return ((60 - timeLeft) / 60) * 100;
  };

  // Completion screen
  if (isComplete) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-8">
            <div className="relative mb-6">
              <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 animate-bounce">
                <Sparkles className="w-8 h-8 text-yellow-400" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Coupon Redeemed Successfully!
            </h2>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-800 text-sm">
                Your coupon has been marked as used. Thank you for supporting{' '}
                <span className="font-semibold">{coupon.business.name}</span>!
              </p>
            </div>

            <div className="space-y-3 text-sm text-gray-600 mb-6">
              <div className="flex justify-between">
                <span>Coupon:</span>
                <span className="font-medium">{coupon.title}</span>
              </div>
              <div className="flex justify-between">
                <span>Business:</span>
                <span className="font-medium">{coupon.business.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Redeemed:</span>
                <span className="font-medium">{new Date().toLocaleString()}</span>
              </div>
              {redemptionData && (
                <div className="flex justify-between">
                  <span>Reference:</span>
                  <span className="font-mono text-xs">{redemptionData.id.slice(-8)}</span>
                </div>
              )}
            </div>

            <Button 
              onClick={onClose}
              className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
            >
              <Gift className="w-4 h-4 mr-2" />
              Continue Saving
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Loading screen
  if (isGenerating) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-spin">
              <QrCode className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Generating Your QR Code...
            </h2>
            <p className="text-gray-600 text-sm">
              Please wait while we prepare your redemption
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}} /* Prevent closing during active redemption */>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white p-6 text-center relative">
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-4 right-4 text-white hover:bg-white/20"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>

          <div className="mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Smartphone className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold">Show This QR Code</h2>
            <p className="text-white/90 text-sm">Present to cashier at payment</p>
          </div>

          {/* Timer Display */}
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Timer className={`w-5 h-5 ${timeLeft <= 10 ? 'animate-pulse' : ''}`} />
              <span className="text-2xl font-bold">
                {formatTime(timeLeft)}
              </span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${
                  timeLeft <= 10 ? 'bg-red-400 animate-pulse' : 'bg-white'
                }`}
                style={{ width: `${getProgress()}%` }}
              />
            </div>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="p-6">
          <Card className="mb-6">
            <CardContent className="p-8 text-center">
              {qrCodeUrl && (
                <div className="mb-4">
                  <img 
                    src={qrCodeUrl} 
                    alt="Redemption QR Code"
                    className="mx-auto mb-4 border-4 border-gray-200 rounded-xl shadow-lg"
                  />
                  
                  {/* UUID Display */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <p className="text-xs text-gray-600 mb-1">Redemption ID:</p>
                    <p className="font-mono text-sm text-gray-800 break-all">
                      {redemptionData?.id || 'Loading...'}
                    </p>
                  </div>
                </div>
              )}

              {/* Instructions */}
              <div className={`rounded-lg p-4 mb-4 ${
                timeLeft <= 10 
                  ? 'bg-red-50 border border-red-200 animate-pulse' 
                  : 'bg-blue-50 border border-blue-200'
              }`}>
                <div className={`flex items-center justify-center space-x-2 mb-2 ${
                  timeLeft <= 10 ? 'text-red-700' : 'text-blue-700'
                }`}>
                  {timeLeft <= 10 ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : (
                    <Clock className="w-5 h-5" />
                  )}
                  <span className="font-semibold">
                    {timeLeft <= 10 ? 'Hurry! Time running out' : 'Show this to cashier'}
                  </span>
                </div>
                <p className={`text-sm ${timeLeft <= 10 ? 'text-red-600' : 'text-blue-600'}`}>
                  {timeLeft <= 10 
                    ? 'QR code expires in less than 10 seconds!'
                    : 'Present this QR code at checkout to redeem your discount'
                  }
                </p>
              </div>

              {/* Coupon Details */}
              <div className="text-left space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Coupon:</span>
                  <span className="font-semibold text-sm">{coupon.title}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Business:</span>
                  <span className="font-semibold text-sm">{coupon.business.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Discount:</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {coupon.discount_text}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Warning for low time */}
          {timeLeft <= 30 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
                <div className="text-sm text-amber-700">
                  <p className="font-medium">Time is running low!</p>
                  <p>Make sure you're ready at checkout</p>
                </div>
              </div>
            </div>
          )}

          {/* Success Tips */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2 flex items-center">
              <Zap className="w-4 h-4 mr-2 text-yellow-500" />
              Redemption Tips:
            </h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Have your items ready before showing the code</li>
              <li>• Ensure your phone screen brightness is up</li>
              <li>• If code expires, you can generate a new one</li>
              <li>• Ask staff if you need help with redemption</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}