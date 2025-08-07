import React, { memo, useMemo, useCallback } from 'react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CategoryIcon } from '@/lib/category-icons'
import { MapPin, Clock, Users } from 'lucide-react'
import { getUsageLimitText } from '@/lib/usage-limit-text'
import type { Coupon, Business } from '@/types'

interface CouponWithBusiness extends Coupon {
  business: Business
  distance?: number
  redemptionCount?: number
  savingsAmount?: number
  isNew?: boolean
  isFeatured?: boolean
}

interface CouponCardProps {
  coupon: CouponWithBusiness
  onRedeem: (coupon: CouponWithBusiness) => void
  onViewDetails: (coupon: CouponWithBusiness) => void
  formatDistance?: (distance: number) => string
  isExpiringSoon?: (endDate: string) => boolean
  showDistance?: boolean
  showSavingsAmount?: boolean
  showNewBadge?: boolean
  showFeaturedBadge?: boolean
  className?: string
}

export const CouponCard = memo(function CouponCard({
  coupon,
  onRedeem,
  onViewDetails,
  formatDistance,
  isExpiringSoon,
  showDistance = false,
  showSavingsAmount = false,
  showNewBadge = false,
  showFeaturedBadge = false,
  className = ''
}: CouponCardProps) {
  // PERFORMANCE OPTIMIZATION: Memoize expensive calculations
  const expiryData = useMemo(() => {
    const expiresAt = new Date(coupon.endDate)
    const isExpiring = isExpiringSoon?.(coupon.endDate) || false
    const daysUntilExpiry = Math.ceil(
      (expiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    )
    return { expiresAt, isExpiring, daysUntilExpiry }
  }, [coupon.endDate, isExpiringSoon])

  // PERFORMANCE OPTIMIZATION: Memoize formatted distance
  const formattedDistance = useMemo(() => {
    return coupon.distance && formatDistance ? formatDistance(coupon.distance) : null
  }, [coupon.distance, formatDistance])

  // PERFORMANCE OPTIMIZATION: Use useCallback for event handlers
  const handleRedeem = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onRedeem(coupon)
  }, [onRedeem, coupon])

  const handleViewDetails = useCallback(() => {
    onViewDetails(coupon)
  }, [onViewDetails, coupon])

  return (
    <Card 
      className={`
        saverly-card-hover cursor-pointer border-0 shadow-md bg-white
        ${className}
      `}
      onClick={handleViewDetails}
    >
      <CardContent className="p-4">
        {/* Header with category icon and business name */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <CategoryIcon 
              category={coupon.business.category} 
              size={24}
              showBackground
              className="flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-gray-900 truncate text-sm">
                {coupon.business.name}
              </h3>
              <p className="text-xs text-gray-500 truncate">
                {coupon.business.category}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col gap-1 flex-shrink-0">
            {/* Featured badge */}
            {showFeaturedBadge && coupon.isFeatured && (
              <Badge variant="default" className="text-xs bg-yellow-500 hover:bg-yellow-600">
                ⭐ Featured
              </Badge>
            )}
            
            {/* New badge */}
            {showNewBadge && coupon.isNew && (
              <Badge variant="default" className="text-xs bg-green-500 hover:bg-green-600">
                🆕 New
              </Badge>
            )}
            
            {/* Distance badge */}
            {showDistance && formattedDistance && (
              <Badge variant="outline" className="text-xs">
                <MapPin className="w-3 h-3 mr-1" />
                {formattedDistance}
              </Badge>
            )}
          </div>
        </div>

        {/* Coupon details */}
        <div className="space-y-2">
          <h4 className="font-bold text-gray-900 leading-tight">
            {coupon.title}
          </h4>
          
          <p className="text-sm text-gray-600 overflow-hidden" style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            lineHeight: '1.4em',
            maxHeight: '2.8em'
          }}>
            {coupon.description}
          </p>

          {/* Discount highlight */}
          <div className="bg-gradient-to-r from-saverly-green to-saverly-teal p-3 rounded-lg">
            <div className="text-white text-center">
              <p className="font-bold">
                {coupon.discount_text || coupon.discount}
              </p>
              {showSavingsAmount && coupon.savingsAmount && (
                <p className="text-xs opacity-90 mt-1">
                  Save up to ${coupon.savingsAmount.toFixed(0)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Usage and expiry info */}
        <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {expiryData.isExpiring ? (
              <span className="text-red-600 font-medium">
                Expires in {expiryData.daysUntilExpiry} day{expiryData.daysUntilExpiry !== 1 ? 's' : ''}
              </span>
            ) : (
              <span>
                Valid until {expiryData.expiresAt.toLocaleDateString()}
              </span>
            )}
          </div>
          
          {coupon.redemptionCount !== undefined && (
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>{coupon.redemptionCount} used</span>
            </div>
          )}
        </div>

        {/* Usage limit indicator */}
        <div className="mt-2">
          <Badge 
            variant="secondary" 
            className="text-xs"
          >
            {getUsageLimitText(coupon.usageLimit)}
          </Badge>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button
          onClick={handleRedeem}
          variant="saverly"
          className="w-full font-semibold"
          size="sm"
        >
          Redeem Now
        </Button>
      </CardFooter>
    </Card>
  )
})