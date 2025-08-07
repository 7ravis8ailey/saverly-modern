/**
 * Coupon Detail Page
 * Comprehensive coupon information with redemption CTA
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, MapPin, Clock, Users, Star, Gift, 
  Phone, Globe, Mail, Calendar, AlertCircle,
  Zap, Crown, Timer, Heart, Share2, Bookmark
} from 'lucide-react';
import type { CouponWithBusiness } from '@/hooks/useEnhancedCouponDiscovery';

interface CouponDetailPageProps {
  coupon: CouponWithBusiness;
  onBack: () => void;
  onRedeem: (coupon: CouponWithBusiness) => void;
  canRedeem: boolean;
  remainingUses: string;
  userLocation?: { lat: number; lng: number };
}

export default function CouponDetailPage({
  coupon,
  onBack,
  onRedeem,
  canRedeem,
  remainingUses,
  userLocation
}: CouponDetailPageProps) {
  const [isFavorited, setIsFavorited] = useState(false);

  // Calculate distance if user location provided
  const calculateDistance = () => {
    if (!userLocation || !coupon.business.latitude || !coupon.business.longitude) {
      return null;
    }
    
    const R = 3959; // Earth's radius in miles
    const dLat = (coupon.business.latitude - userLocation.lat) * Math.PI / 180;
    const dLon = (coupon.business.longitude - userLocation.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(userLocation.lat * Math.PI / 180) * Math.cos(coupon.business.latitude * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance < 1 ? `${(distance * 5280).toFixed(0)}ft` : `${distance.toFixed(1)}mi`;
  };

  // Format savings
  const formatSavings = () => {
    if (coupon.discount_type === 'percentage' && coupon.discount_value) {
      return `${coupon.discount_value}% OFF`;
    }
    if (coupon.discount_type === 'fixed_amount' && coupon.discount_value) {
      return `$${coupon.discount_value} OFF`;
    }
    return coupon.discount_text || 'Special Offer';
  };

  // Calculate estimated savings
  const getEstimatedSavings = () => {
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

  // Check if expires soon
  const isExpiringSoon = () => {
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    return new Date(coupon.end_date) <= threeDaysFromNow;
  };

  const distance = calculateDistance();
  const estimatedSavings = getEstimatedSavings();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white sticky top-0 z-40 border-b shadow-sm">
        <div className="flex items-center justify-between p-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFavorited(!isFavorited)}
            >
              <Heart className={`w-5 h-5 ${isFavorited ? 'fill-red-500 text-red-500' : ''}`} />
            </Button>
            <Button variant="ghost" size="sm">
              <Share2 className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="sm">
              <Bookmark className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Hero Card */}
        <Card className="overflow-hidden">
          <div className="relative">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-green-600"></div>
            <div className="absolute inset-0 bg-black/20"></div>
            
            {/* Featured & Expiring Badges */}
            <div className="absolute top-4 left-4 right-4 flex justify-between">
              {(coupon.featured || coupon.is_featured) && (
                <Badge className="bg-yellow-500 text-white">
                  <Star className="w-3 h-3 mr-1" />
                  Featured
                </Badge>
              )}
              {isExpiringSoon() && (
                <Badge variant="destructive" className="animate-pulse">
                  <Timer className="w-3 h-3 mr-1" />
                  Expiring Soon
                </Badge>
              )}
            </div>

            <CardContent className="relative p-8 text-white">
              {/* Business Info */}
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-2xl font-bold">
                  {coupon.business.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-2xl font-bold mb-1">{coupon.business.name}</h1>
                  <div className="flex items-center text-white/80">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span>{coupon.business.city}, {coupon.business.state}</span>
                    {distance && (
                      <>
                        <span className="mx-2">•</span>
                        <span>{distance} away</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Coupon Title */}
              <h2 className="text-3xl font-bold mb-4 leading-tight">
                {coupon.title}
              </h2>

              {/* Savings Display */}
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 mb-6">
                <div className="text-center">
                  <div className="text-4xl font-bold mb-2">
                    {formatSavings()}
                  </div>
                  {estimatedSavings > 0 && (
                    <div className="text-white/80">
                      Save up to ${estimatedSavings.toFixed(0)}
                    </div>
                  )}
                </div>
              </div>

              {/* Usage Status */}
              <div className="flex items-center justify-between">
                <Badge 
                  variant={canRedeem ? "secondary" : "destructive"}
                  className={`text-sm ${canRedeem ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                >
                  {remainingUses}
                </Badge>
                <div className="flex items-center text-white/80 text-sm">
                  <Users className="w-4 h-4 mr-1" />
                  <span>{coupon.current_usage_count || 0} people saved</span>
                </div>
              </div>
            </CardContent>
          </div>
        </Card>

        {/* Coupon Details */}
        <Card>
          <CardHeader>
            <h3 className="text-xl font-semibold flex items-center">
              <Gift className="w-5 h-5 mr-2 text-blue-600" />
              Coupon Details
            </h3>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Description */}
            <div>
              <h4 className="font-medium mb-2">Description</h4>
              <p className="text-gray-700 leading-relaxed">
                {coupon.description}
              </p>
            </div>

            {/* Terms & Conditions */}
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {coupon.minimum_purchase && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center">
                    <Zap className="w-4 h-4 mr-2 text-yellow-500" />
                    Minimum Purchase
                  </h4>
                  <p className="text-2xl font-bold text-green-600">
                    ${coupon.minimum_purchase}
                  </p>
                </div>
              )}

              {coupon.maximum_discount && (
                <div>
                  <h4 className="font-medium mb-2">Maximum Discount</h4>
                  <p className="text-2xl font-bold text-blue-600">
                    ${coupon.maximum_discount}
                  </p>
                </div>
              )}

              <div>
                <h4 className="font-medium mb-2 flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-purple-500" />
                  Valid Until
                </h4>
                <p className="text-gray-700">
                  {new Date(coupon.end_date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-2 flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-orange-500" />
                  Usage Limit
                </h4>
                <p className="text-gray-700">
                  {coupon.usage_limit === 'unlimited' && 'Unlimited uses'}
                  {coupon.usage_limit === 'once_per_user' && 'One time per user'}
                  {coupon.usage_limit?.includes('_per_month') && 
                    `${coupon.usage_limit.split('_')[0]} times per month`
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Information */}
        <Card>
          <CardHeader>
            <h3 className="text-xl font-semibold flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-green-600" />
              Business Information
            </h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Address</h4>
              <p className="text-gray-700">
                {coupon.business.formatted_address || 
                 `${coupon.business.city}, ${coupon.business.state}`}
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">Category</h4>
              <Badge variant="secondary">{coupon.business.category}</Badge>
            </div>

            {/* Contact buttons (if available) */}
            <div className="flex space-x-2 pt-4">
              <Button variant="outline" size="sm">
                <Phone className="w-4 h-4 mr-2" />
                Call
              </Button>
              <Button variant="outline" size="sm">
                <Globe className="w-4 h-4 mr-2" />
                Website
              </Button>
              <Button variant="outline" size="sm">
                <Mail className="w-4 h-4 mr-2" />
                Email
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Important Notice */}
        {!canRedeem && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-1" />
                <div>
                  <h4 className="font-medium text-red-800 mb-1">Cannot Redeem</h4>
                  <p className="text-red-700 text-sm">
                    {remainingUses === 'Used' && 'You have already used this coupon.'}
                    {remainingUses === 'Monthly limit reached' && 'You have reached the monthly limit for this coupon.'}
                    {remainingUses.includes('0 left') && 'You have no remaining uses for this month.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Redemption Button */}
        <div className="sticky bottom-0 bg-white p-4 border-t shadow-lg">
          <Button
            className={`w-full py-4 text-lg font-semibold transition-all duration-200 ${
              canRedeem 
                ? 'bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 shadow-lg hover:shadow-xl' 
                : 'bg-gray-400 cursor-not-allowed'
            }`}
            disabled={!canRedeem}
            onClick={() => canRedeem && onRedeem(coupon)}
          >
            <Gift className="w-5 h-5 mr-3" />
            {canRedeem ? 'Redeem This Coupon' : 'Cannot Redeem'}
            {canRedeem && estimatedSavings > 0 && (
              <span className="ml-2 bg-white/20 px-2 py-1 rounded text-sm">
                Save ${estimatedSavings.toFixed(0)}
              </span>
            )}
          </Button>
          
          {canRedeem && (
            <p className="text-center text-xs text-gray-500 mt-2">
              Tap to start 60-second redemption process
            </p>
          )}
        </div>
      </div>
    </div>
  );
}