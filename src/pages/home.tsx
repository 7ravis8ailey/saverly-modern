import { useState } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SubscriptionDialog } from '@/components/payment/subscription-dialog'
import { ManageSubscription } from '@/components/payment/manage-subscription'
import { QRCodeModal } from '@/components/qr-code-modal'
import { MapPin, Clock, QrCode, Star, CreditCard, User, Settings, CheckCircle } from 'lucide-react'
import type { Coupon } from '@/types'
import { toast } from '@/hooks/use-toast'
import { Link, useSearchParams } from 'react-router-dom'

// Keep the existing CouponCard component for subscribers
function CouponCard({ coupon }: { coupon: Coupon & { business: any } }) {
  const { user } = useAuth()
  const [showQR, setShowQR] = useState(false)
  const [redemptionId, setRedemptionId] = useState<string>('')

  // Get user's current usage for this coupon
  const { data: usageStats, refetch: refetchUsage } = useQuery({
    queryKey: ['user-coupon-usage', coupon.uid, user?.uid],
    queryFn: async () => {
      if (!user?.uid) return null
      
      const { data, error } = await supabase.rpc('get_user_coupon_usage', {
        p_user_uid: user.uid,
        p_coupon_uid: coupon.uid
      })
      
      if (error) {
        console.error('Error fetching usage stats:', error)
        return null
      }
      
      return data
    },
    enabled: !!user?.uid
  })

  const handleRedeem = async () => {
    if (!user?.uid) return

    try {
      // First validate usage limits
      const { data: validationResult, error: validationError } = await supabase.rpc('check_usage_limit', {
        p_user_uid: user.uid,
        p_coupon_uid: coupon.uid,
        p_usage_limit: coupon.usageLimit,
        p_monthly_limit: coupon.monthlyLimit
      })

      if (validationError) {
        console.error('Validation error:', validationError)
        toast({
          title: "Error",
          description: "Unable to validate usage limits. Please try again.",
          variant: "destructive"
        })
        return
      }

      if (!validationResult?.can_redeem) {
        const message = coupon.usageLimit === 'one_time' 
          ? 'You have already used this coupon.'
          : coupon.usageLimit === 'daily'
          ? 'You have already used this coupon today. Try again tomorrow.'
          : `You have reached the monthly limit of ${coupon.monthlyLimit || 1} uses. Resets on the 1st.`
          
        toast({
          title: "Usage Limit Reached",
          description: message,
          variant: "destructive"
        })
        return
      }

      // Create redemption record
      const { data, error } = await supabase
        .from('redemptions')
        .insert([{
          coupon_uid: coupon.uid,
          business_uid: coupon.businessUid,
          qr_code: `qr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          display_code: `DC_${Date.now().toString().slice(-6)}`,
          redemption_month: new Date().toISOString(),
          expires_at: new Date(Date.now() + 60 * 1000).toISOString(), // 60 seconds
        }])
        .select()
        .single()

      if (error) {
        console.error('Failed to create redemption:', error)
        toast({
          title: "Error",
          description: "Failed to create redemption. Please try again.",
          variant: "destructive"
        })
        return
      }

      // Refresh usage stats after successful redemption
      refetchUsage()
      
      setRedemptionId(data.uid)
      setShowQR(true)
      toast({
        title: "Success",
        description: "QR code generated! Show this to the business to redeem.",
        variant: "success"
      })
    } catch (error) {
      console.error('Redemption error:', error)
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      })
    }
  }

  const isExpired = new Date(coupon.endDate) < new Date()
  const isNotStarted = new Date(coupon.startDate) > new Date()
  
  // Determine if coupon can be redeemed based on usage limits
  const canRedeem = usageStats?.can_redeem !== false && !isExpired && !isNotStarted
  const isUsageLimitReached = usageStats?.can_redeem === false

  // Get usage limit display text
  const getUsageLimitText = () => {
    switch (coupon.usageLimit) {
      case 'one_time':
        return 'One time use'
      case 'daily':
        return 'Once per day'
      case 'monthly_one':
      case 'monthly_two':
      case 'monthly_four':
        return `${coupon.monthlyLimit || 1} uses per month`
      default:
        return 'Limited use'
    }
  }

  // Get remaining uses text
  const getRemainingUsesText = () => {
    if (!usageStats) return null
    
    if (coupon.usageLimit === 'one_time') {
      return usageStats.current_usage > 0 ? 'Already used' : 'Available'
    }
    
    if (coupon.usageLimit === 'daily') {
      return usageStats.current_usage > 0 ? 'Used today' : 'Available today'
    }
    
    if (['monthly_one', 'monthly_two', 'monthly_four'].includes(coupon.usageLimit)) {
      const remaining = usageStats.remaining || 0
      if (remaining === 0) {
        return 'Monthly limit reached'
      }
      return `${remaining} ${remaining === 1 ? 'use' : 'uses'} left this month`
    }
    
    return null
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{coupon.title}</CardTitle>
            <CardDescription className="flex items-center mt-1">
              <MapPin className="h-4 w-4 mr-1" />
              {coupon.business?.name}
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge 
              variant={isExpired || isNotStarted ? "secondary" : "default"}
              className="bg-saverly-green text-white"
            >
              {coupon.discount}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {getUsageLimitText()}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <p className="text-sm text-gray-600 mb-3">{coupon.description}</p>
        
        <div className="space-y-2 mb-3">
          <div className="flex items-center text-sm text-gray-500">
            <Clock className="h-4 w-4 mr-1" />
            Valid until {new Date(coupon.endDate).toLocaleDateString()}
          </div>
          
          {/* Usage limit status */}
          {usageStats && (
            <div className="flex items-center text-sm">
              <QrCode className="h-4 w-4 mr-1" />
              <span className={`${
                isUsageLimitReached ? 'text-red-600' : 'text-green-600'
              }`}>
                {getRemainingUsesText()}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-500">
            <Star className="h-4 w-4 mr-1 text-yellow-400" />
            {coupon.business?.category}
          </div>
          
          <Button 
            size="sm" 
            disabled={!canRedeem}
            onClick={handleRedeem}
          >
            <QrCode className="h-4 w-4 mr-2" />
            {isExpired ? 'Expired' 
             : isNotStarted ? 'Not Started' 
             : isUsageLimitReached ? 'Limit Reached'
             : 'Redeem'}
          </Button>

          <QRCodeModal
            isOpen={showQR}
            onClose={() => setShowQR(false)}
            coupon={coupon}
            userUid={user?.uid || ''}
          />
        </div>
      </CardContent>
    </Card>
  )
}

// Non-Subscriber View - Only shows subscription value proposition
function WelcomePage() {
  const { user } = useAuth()
  const [showSubscription, setShowSubscription] = useState(false)

  const benefits = [
    "Access to exclusive local deals and discounts",
    "Unlimited coupon redemptions per month",
    "New deals added regularly from local businesses",
    "Priority customer support",
    "Cancel anytime - no long-term commitment"
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome to Saverly, {user?.profile?.firstName || 'there'}!
          </h1>
          <p className="mt-2 text-gray-600">
            Subscribe to unlock exclusive deals and discounts from local businesses in your area.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Subscription Card */}
          <div className="lg:col-span-2">
            <Card className="border-2 border-saverly-green">
              <CardHeader className="text-center border-b bg-card">
                <CreditCard className="h-12 w-12 mx-auto text-saverly-green mb-4" />
                <CardTitle className="text-2xl">Unlock Local Deals</CardTitle>
                <p className="text-muted-foreground mt-2">
                  Subscribe to access exclusive deals and discounts from local businesses in your area
                </p>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <span className="text-4xl font-bold text-saverly-green">$4.99</span>
                  <span className="text-lg text-muted-foreground">/month</span>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">What you get with a subscription:</h4>
                  <ul className="space-y-2">
                    {benefits.map((benefit, index) => (
                      <li key={index} className="flex items-center text-sm">
                        <CheckCircle className="mr-3 h-4 w-4 text-saverly-green flex-shrink-0" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <Button 
                  size="lg"
                  className="w-full bg-saverly-green hover:bg-saverly-dark-green"
                  onClick={() => setShowSubscription(true)}
                >
                  Subscribe for $4.99/month
                </Button>
                
                <p className="text-xs text-gray-500 text-center mt-3">
                  Cancel anytime. No hidden fees.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Account Management Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Account Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Profile
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <User className="h-4 w-4 mr-2" />
                  Update Personal Info
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    <strong>Email:</strong> {user?.email}
                  </p>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      <strong>Status:</strong> <Badge variant="secondary">Free Account</Badge>
                    </p>
                    <p className="text-xs text-gray-500">
                      Subscribe to access exclusive deals
                    </p>
                  </div>
                  <p className="text-sm text-gray-600">
                    <strong>Member since:</strong> {user?.profile?.createdAt ? new Date(user.profile.createdAt).toLocaleDateString() : 'Recently'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Subscription Modal */}
        <SubscriptionDialog
          isOpen={showSubscription}
          onClose={() => setShowSubscription(false)}
          onSuccess={() => {
            setShowSubscription(false)
            // Refresh page data to show subscriber view
            window.location.reload()
          }}
        />
      </div>
    </div>
  )
}

// Main HomePage Component with Dual Views
export function HomePage() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()

  // Show loading state while user data is being fetched
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-saverly-green"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Check if we should force showing the welcome page (for new registrations)
  const forceWelcome = searchParams.get('subscriber') === 'false'

  // For non-active subscribers or forced welcome, show the welcome page with subscription option
  if (user.subscriptionStatus !== 'active' || forceWelcome) {
    return <WelcomePage />
  }

  // For active subscribers, show the full deals dashboard
  const { data: coupons, isLoading } = useQuery({
    queryKey: ['coupons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coupons')
        .select(`
          *,
          business:businesses(*)
        `)
        .eq('active', true)
        .gte('end_date', new Date().toISOString())
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as (Coupon & { business: any })[]
    },
    enabled: !!user && user.subscriptionStatus === 'active'
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 space-y-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Available Deals
            </h1>
            <p className="mt-2 text-gray-600">
              Discover exclusive offers from local businesses
            </p>
          </div>
          
          <ManageSubscription />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : coupons?.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500">No deals available at the moment.</p>
              <p className="text-sm text-gray-400 mt-2">
                Check back soon for new offers!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coupons?.map((coupon) => (
              <CouponCard key={coupon.uid} coupon={coupon} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}