import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CategoryIcon } from '@/lib/category-icons'
import {
  MapPin,
  Clock,
  Users,
  Phone,
  Mail,
  Calendar,
  Star,
  X,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { Coupon, Business } from '@/types'

interface CouponWithBusiness extends Coupon {
  business: Business
  distance?: number
  redemptionCount?: number
}

interface CouponDetailModalProps {
  coupon: CouponWithBusiness | null
  isOpen: boolean
  onClose: () => void
  onRedeem: (coupon: CouponWithBusiness) => void
  formatDistance?: (distance: number) => string
  isExpiringSoon?: (endDate: string) => boolean
}

export function CouponDetailModal({
  coupon,
  isOpen,
  onClose,
  onRedeem,
  formatDistance,
  isExpiringSoon
}: CouponDetailModalProps) {
  const { toast } = useToast()
  const [copiedPhone, setCopiedPhone] = useState(false)
  const [copiedAddress, setCopiedAddress] = useState(false)

  useEffect(() => {
    if (copiedPhone) {
      const timeout = setTimeout(() => setCopiedPhone(false), 2000)
      return () => clearTimeout(timeout)
    }
  }, [copiedPhone])

  useEffect(() => {
    if (copiedAddress) {
      const timeout = setTimeout(() => setCopiedAddress(false), 2000)
      return () => clearTimeout(timeout)
    }
  }, [copiedAddress])

  if (!coupon) return null

  const expiresAt = new Date(coupon.endDate)
  const startsAt = new Date(coupon.startDate)
  const isExpiring = isExpiringSoon?.(coupon.endDate) || false
  const isActive = new Date() >= startsAt && new Date() <= expiresAt
  
  const daysUntilExpiry = Math.ceil(
    (expiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  )

  const handleRedeem = () => {
    onRedeem(coupon)
    onClose()
  }

  const handleCopyPhone = async () => {
    if (coupon.business.phone) {
      try {
        await navigator.clipboard.writeText(coupon.business.phone)
        setCopiedPhone(true)
        toast({
          title: "Phone copied",
          description: "Phone number copied to clipboard"
        })
      } catch (error) {
        toast({
          title: "Copy failed",
          description: "Failed to copy phone number",
          variant: "destructive"
        })
      }
    }
  }

  const handleCopyAddress = async () => {
    const fullAddress = `${coupon.business.address}, ${coupon.business.city}, ${coupon.business.state} ${coupon.business.zipCode}`
    try {
      await navigator.clipboard.writeText(fullAddress)
      setCopiedAddress(true)
      toast({
        title: "Address copied",
        description: "Address copied to clipboard"
      })
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy address",
        variant: "destructive"
      })
    }
  }

  const handleDirections = () => {
    const address = encodeURIComponent(
      `${coupon.business.address}, ${coupon.business.city}, ${coupon.business.state} ${coupon.business.zipCode}`
    )
    window.open(`https://maps.google.com/maps?daddr=${address}`, '_blank')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <CategoryIcon 
                category={coupon.business.category} 
                size={32}
                showBackground
              />
              <div>
                <DialogTitle className="text-xl font-bold text-gray-900">
                  {coupon.title}
                </DialogTitle>
                <p className="text-gray-600 mt-1">
                  {coupon.business.name}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {coupon.distance && formatDistance && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {formatDistance(coupon.distance)}
                </Badge>
              )}
              
              <Badge 
                variant={isActive ? "default" : "secondary"}
                className={isActive ? "bg-green-500" : ""}
              >
                {isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        {/* Main Content - Two Column Layout */}
        <div className="grid md:grid-cols-2 gap-6 p-6">
          {/* Left Column - Coupon Details */}
          <div className="space-y-6">
            {/* Discount Highlight */}
            <div className="bg-gradient-to-r from-saverly-green to-saverly-teal p-6 rounded-lg text-center">
              <h2 className="text-2xl font-bold text-white mb-2">
                {coupon.discount}
              </h2>
              <p className="text-white/90">
                Save with this exclusive offer
              </p>
            </div>

            {/* Description */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-600 leading-relaxed">
                {coupon.description}
              </p>
            </div>

            {/* Validity & Usage */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Validity & Usage</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-gray-500">Valid From</p>
                    <p className="font-medium">
                      {startsAt.toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-gray-500">Expires</p>
                    <p className={`font-medium ${isExpiring ? 'text-red-600' : ''}`}>
                      {expiresAt.toLocaleDateString()}
                      {isExpiring && (
                        <span className="block text-xs text-red-600">
                          ({daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''} left)
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline" className="text-xs">
                  {getUsageLimitText(coupon.usageLimit)}
                </Badge>
                {coupon.redemptionCount !== undefined && (
                  <div className="flex items-center gap-1 text-gray-500">
                    <Users className="w-3 h-3" />
                    <span>{coupon.redemptionCount} people used this</span>
                  </div>
                )}
              </div>
            </div>

            {/* Redeem Button */}
            <div className="pt-4">
              <Button
                onClick={handleRedeem}
                variant="saverly"
                size="lg"
                className="w-full font-semibold"
                disabled={!isActive}
              >
                {isActive ? 'Redeem This Offer' : 'Offer Not Active'}
              </Button>
              
              {!isActive && (
                <p className="text-xs text-gray-500 text-center mt-2">
                  This offer is not currently active
                </p>
              )}
            </div>
          </div>

          {/* Right Column - Business Details */}
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Business Information</h3>
              
              <div className="space-y-4">
                {/* Business Name & Category */}
                <div>
                  <h4 className="font-medium text-gray-900">
                    {coupon.business.name}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {coupon.business.category}
                  </p>
                  {coupon.business.description && (
                    <p className="text-sm text-gray-600 mt-1">
                      {coupon.business.description}
                    </p>
                  )}
                </div>

                {/* Contact Information */}
                <div className="space-y-3">
                  {coupon.business.phone && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">
                          {coupon.business.phone}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyPhone}
                        className="h-8 w-8 p-0"
                      >
                        {copiedPhone ? (
                          <Check className="w-3 h-3 text-green-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">
                      {coupon.business.email}
                    </span>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2 flex-1">
                      <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                      <div className="text-sm">
                        <p>{coupon.business.address}</p>
                        <p className="text-gray-600">
                          {coupon.business.city}, {coupon.business.state} {coupon.business.zipCode}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyAddress}
                      className="h-8 w-8 p-0 flex-shrink-0"
                    >
                      {copiedAddress ? (
                        <Check className="w-3 h-3 text-green-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </Button>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDirections}
                    className="mt-2 w-full text-xs"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Get Directions
                  </Button>
                </div>

                {/* Business Stats */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <h4 className="font-medium text-gray-900 mb-2 text-sm">
                    Quick Stats
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-gray-500">Category</p>
                      <p className="font-medium">{coupon.business.category}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Contact</p>
                      <p className="font-medium">{coupon.business.contactName}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Map placeholder or additional info */}
            <div className="bg-gray-100 rounded-lg p-4 text-center">
              <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">
                Business Location
              </p>
              <p className="text-xs text-gray-500">
                {coupon.business.city}, {coupon.business.state}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function getUsageLimitText(usageLimit: string): string {
  switch (usageLimit) {
    case 'one_time':
      return 'One-time use only'
    case 'daily':
      return 'Can be used daily'
    case 'monthly_one':
      return 'Once per month'
    case 'monthly_two':
      return 'Twice per month'
    case 'monthly_four':
      return '4 times per month'
    default:
      return 'Limited usage'
  }
}