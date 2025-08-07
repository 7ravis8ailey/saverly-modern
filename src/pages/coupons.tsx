import React, { useState } from 'react'
import { CouponGrid } from '@/components/coupon-grid'
import { CouponDetailModal } from '@/components/coupon-detail-modal'
import { EnhancedQRModal } from '@/components/enhanced-qr-modal'
import { useAuth } from '@/components/auth/auth-provider'
import { useCoupons } from '@/hooks/use-coupons'
import { useToast } from '@/hooks/use-toast'
import type { Coupon, Business } from '@/types'

interface CouponWithBusiness extends Coupon {
  business: Business
  distance?: number
  redemptionCount?: number
}

export default function CouponsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { formatDistance, isExpiringSoon } = useCoupons()
  const [selectedCoupon, setSelectedCoupon] = useState<CouponWithBusiness | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [selectedCouponForRedemption, setSelectedCouponForRedemption] = useState<CouponWithBusiness | null>(null)

  const handleRedeemCoupon = async (coupon: CouponWithBusiness) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to redeem coupons",
        variant: "destructive"
      })
      return
    }

    if (user.subscriptionStatus !== 'active') {
      toast({
        title: "Subscription Required",
        description: "You need an active subscription to redeem coupons",
        variant: "destructive"
      })
      return
    }

    setSelectedCouponForRedemption(coupon)
    setShowQRModal(true)
  }

  const handleViewCouponDetails = (coupon: CouponWithBusiness) => {
    setSelectedCoupon(coupon)
    setShowDetailModal(true)
  }

  const handleCloseDetailModal = () => {
    setShowDetailModal(false)
    setSelectedCoupon(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Local Savings
            </h1>
            <p className="text-gray-600">
              Discover exclusive offers from local businesses in your area
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <CouponGrid
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
        formatDistance={formatDistance}
        isExpiringSoon={isExpiringSoon}
      />

      {/* QR Redemption Modal */}
      {selectedCouponForRedemption && user && (
        <EnhancedQRModal
          isOpen={showQRModal}
          onClose={() => {
            setShowQRModal(false)
            setSelectedCouponForRedemption(null)
          }}
          coupon={selectedCouponForRedemption}
          userUid={user.uid}
          onRedemptionSuccess={(data) => {
            toast({
              title: "Coupon Redeemed!",
              description: `Successfully redeemed: ${selectedCouponForRedemption.title}`,
            })
            setShowQRModal(false)
            setSelectedCouponForRedemption(null)
          }}
          onRedemptionError={(error, errorType) => {
            toast({
              title: "Redemption Failed",
              description: error,
              variant: "destructive"
            })
          }}
        />
      )}
    </div>
  )
}