import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/components/auth/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SaverlyLogo } from '@/components/ui/saverly-logo'
import { SubscriptionDialog } from '@/components/payment/subscription-dialog'
import { 
  MapPin, 
  Percent, 
  Users, 
  Star,
  CheckCircle,
  ArrowRight,
  CreditCard
} from 'lucide-react'

export function LandingPage() {
  const { user, profile, loading } = useAuth()
  const navigate = useNavigate()

  // Handle authenticated user routing
  useEffect(() => {
    // Don't redirect while loading or if no user
    if (loading || !user) return

    console.log('🔍 Landing Page Debug:', {
      user: user,
      profile: profile,
      userEmail: user.email,
      profileAccountType: profile?.account_type,
      profileIsAdmin: profile?.is_admin
    })

    // Check if user is admin - with multiple fallbacks including direct email check
    const isAdmin = profile?.user_role === 'admin' ||
                   profile?.is_admin === true ||
                   profile?.email?.includes('admin') || 
                   user.email === 'admin@test.saverly' ||
                   user.email?.includes('admin')
    
    console.log('🏛️ Admin check result:', isAdmin)
    
    if (isAdmin) {
      console.log('🚀 Redirecting to admin dashboard')
      navigate('/admin', { replace: true })
      return
    }
    
    // Check subscription status for regular users
    if (profile?.subscription_status === 'active') {
      console.log('🎯 Redirecting to active user dashboard')
      navigate('/dashboard', { replace: true })
    } else {
      console.log('🎯 Redirecting to inactive user dashboard')
      navigate('/dashboard?subscriber=false', { replace: true })
    }
  }, [user, profile, loading, navigate])

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-saverly-green"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Only show landing page for non-authenticated users
  if (user) return null
  const [showSubscription, setShowSubscription] = useState(false)

  const features = [
    {
      icon: MapPin,
      title: "Local Business Deals",
      description: "Find exclusive deals and discounts from restaurants, shops, and services in your area"
    },
    {
      icon: Percent,
      title: "Exclusive Access",
      description: "Get access to member-only deals you won't find anywhere else"
    },
    {
      icon: Users,
      title: "Support Local",
      description: "Help support your local community by discovering and supporting local businesses"
    }
  ]

  const benefits = [
    "Unlimited coupon redemptions",
    "Access to exclusive deals",
    "Priority customer support",
    "New deals added regularly from local businesses",
    "Cancel anytime - no long-term commitment"
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content - Matches Original Dashboard */}
      <section className="py-12 bg-gradient-to-br from-primary/10 to-primary/5">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="border-2 border-primary">
            <CardHeader className="text-center border-b bg-card">
              <CreditCard className="h-12 w-12 mx-auto text-primary mb-4" />
              <CardTitle className="text-2xl">Save Money with Local Deals</CardTitle>
              <p className="text-muted-foreground mt-2">
                Subscribe for exclusive access to deals and discounts from local businesses for just $4.99/month
              </p>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>Free Account:</strong> Create an account to browse businesses and see available deals<br/>
                  <strong>Subscription:</strong> Unlock exclusive deals and unlimited coupon redemptions
                </p>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <span className="text-4xl font-bold">$4.99</span>
                <span className="text-lg text-muted-foreground">/month</span>
              </div>
              
              <ul className="space-y-3 mb-6">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center">
                    <CheckCircle className="mr-3 h-5 w-5 text-primary" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
              
              <div className="space-y-3">
                <Button 
                  size="lg"
                  className="w-full"
                  onClick={() => setShowSubscription(true)}
                >
                  Subscribe Now - $4.99/month
                </Button>
                <Link to="/auth">
                  <Button variant="outline" size="lg" className="w-full">
                    Create Free Account
                  </Button>
                </Link>
                <p className="text-xs text-center text-muted-foreground">
                  Free accounts can browse businesses and see deals. Subscribe to unlock exclusive offers and unlimited redemptions.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How Saverly Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Simple, secure, and savings-focused. Get deals from local businesses
              with just a few taps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} hover className="text-center">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-saverly-green/10 rounded-full flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-saverly-green" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, Affordable Pricing
          </h2>
          <p className="text-xl text-gray-600 mb-6">
            Subscribe for unlimited access to exclusive local deals
          </p>
          <div className="max-w-2xl mx-auto mb-12 p-4 bg-gray-100 rounded-lg">
            <p className="text-gray-700">
              <strong>Free Account:</strong> Browse businesses, see available deals, create your profile<br/>
              <strong>Subscription ($4.99/month):</strong> Access exclusive member-only deals, unlimited coupon redemptions, priority support
            </p>
          </div>

          <Card className="max-w-md mx-auto border-2 border-saverly-green">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-3xl font-bold text-saverly-green">
                $4.99
                <span className="text-lg font-normal text-gray-600">/month</span>
              </CardTitle>
              <CardDescription className="text-lg">
                All-access membership
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-saverly-green mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </li>
                ))}
              </ul>
              
              <Button 
                variant="saverly"
                className="w-full mt-6" 
                size="lg"
                onClick={() => setShowSubscription(true)}
              >
                Subscribe Now
              </Button>
              
              <p className="text-xs text-gray-500 mt-4">
                Cancel anytime. No long-term commitment required.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-saverly-green text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Start Saving?
          </h2>
          <p className="text-xl mb-8">
            Join Saverly today and discover amazing deals at local businesses in your area.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <Button 
              size="lg" 
              className="bg-white text-saverly-green hover:bg-gray-100"
              onClick={() => setShowSubscription(true)}
            >
              Subscribe for $4.99/month
            </Button>
            
            <Link to="/auth">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-saverly-green">
                Create Free Account
              </Button>
            </Link>
          </div>
          
          <div className="text-center">
            <p className="text-green-100 text-sm max-w-2xl mx-auto">
              <strong>Free:</strong> Browse local businesses and see available deals • 
              <strong>Subscription:</strong> Unlock exclusive offers, unlimited redemptions, and priority support
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-4">
              <SaverlyLogo size="md" variant="simple" />
            </div>
            <p className="text-gray-400">
              Save money at local businesses with exclusive deals and discounts.
            </p>
          </div>
        </div>
      </footer>

      {/* Subscription Modal */}
      <SubscriptionDialog
        isOpen={showSubscription}
        onClose={() => setShowSubscription(false)}
        onSuccess={() => {
          setShowSubscription(false)
          // Redirect to dashboard after successful subscription
          window.location.href = '/dashboard'
        }}
      />
    </div>
  )
}