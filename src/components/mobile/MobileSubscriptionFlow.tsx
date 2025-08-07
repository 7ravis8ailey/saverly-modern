/**
 * Mobile-Optimized Subscription Flow Components
 * Provides seamless subscription experience on mobile devices
 */

import React, { useState, useEffect } from 'react';
import { useAuthProvider } from '../../hooks/use-auth';
import { useSubscriptionViews } from '../../hooks/useSubscriptionStatus';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { Check, Star, Crown, X, ArrowRight, Smartphone, Wifi, WifiOff } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface MobilePlan {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  stripePriceId: string;
  popular?: boolean;
  icon: React.ReactNode;
  mobileOptimized: boolean;
}

const mobilePlans: MobilePlan[] = [
  {
    id: 'premium',
    name: 'Premium',
    price: 9.99,
    description: 'Perfect for active savers',
    stripePriceId: 'price_premium_monthly',
    popular: true,
    icon: <Star className="h-5 w-5" />,
    mobileOptimized: true,
    features: [
      'Unlimited coupon redemptions',
      'Exclusive mobile deals',
      'Push notifications',
      'Offline favorites',
      'Priority support'
    ]
  },
  {
    id: 'business',
    name: 'Business',
    price: 29.99,
    description: 'Grow your business',
    stripePriceId: 'price_business_monthly',
    icon: <Crown className="h-5 w-5" />,
    mobileOptimized: true,
    features: [
      'All Premium features',
      'Create unlimited coupons',
      'Mobile analytics dashboard',
      'Customer insights',
      'API access'
    ]
  }
];

export function MobileSubscriptionFlow() {
  const { user, profile } = useAuthProvider();
  const { viewType, subscriptionStatus } = useSubscriptionViews();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [upgradeStep, setUpgradeStep] = useState(0);

  // Monitor online status for mobile users
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleUpgrade = async (plan: MobilePlan) => {
    if (!user || !isOnline) return;

    setLoading(true);
    setUpgradeStep(1);

    try {
      // Step 1: Create checkout session
      setUpgradeStep(2);
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: plan.stripePriceId,
          userId: user.id,
          userEmail: user.email,
          planName: plan.name,
          mobile: true // Flag for mobile optimization
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { sessionId } = await response.json();
      
      // Step 2: Redirect to Stripe Checkout
      setUpgradeStep(3);
      const stripe = await stripePromise;
      
      if (stripe) {
        const { error } = await stripe.redirectToCheckout({ sessionId });
        if (error) {
          throw new Error(error.message);
        }
      }
    } catch (error) {
      console.error('Mobile upgrade error:', error);
      alert('Upgrade failed. Please try again.');
    } finally {
      setLoading(false);
      setUpgradeStep(0);
    }
  };

  if (!user) {
    return <MobileSignInPrompt />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      {/* Mobile Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Upgrade Plan</h1>
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
            <Badge variant={viewType === 'free' ? 'secondary' : 'default'}>
              {viewType.toUpperCase()}
            </Badge>
          </div>
        </div>
        
        {!isOnline && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-yellow-800">
              You're offline. Upgrade options will be available when you reconnect.
            </p>
          </div>
        )}
      </div>

      {/* Current Status */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Current Plan</h3>
              <p className="text-sm text-muted-foreground">
                {profile?.subscription_status === 'active' ? 'Premium Active' : 'Free Plan'}
              </p>
            </div>
            {subscriptionStatus.daysUntilExpiry && (
              <Badge variant="outline">
                {subscriptionStatus.daysUntilExpiry} days left
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Progress */}
      {loading && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Upgrading...</span>
                <span className="text-sm text-muted-foreground">
                  Step {upgradeStep}/3
                </span>
              </div>
              <Progress value={(upgradeStep / 3) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {upgradeStep === 1 && "Preparing your upgrade..."}
                {upgradeStep === 2 && "Creating secure checkout..."}
                {upgradeStep === 3 && "Redirecting to payment..."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mobile-Optimized Plan Cards */}
      <div className="space-y-4">
        {mobilePlans.map((plan) => (
          <MobilePlanCard
            key={plan.id}
            plan={plan}
            isSelected={selectedPlan === plan.id}
            onSelect={() => setSelectedPlan(plan.id)}
            onUpgrade={() => handleUpgrade(plan)}
            loading={loading}
            disabled={!isOnline}
          />
        ))}
      </div>

      {/* Mobile Features Showcase */}
      <MobileFeaturesSheet />

      {/* Support */}
      <Card className="mt-6 border-dashed">
        <CardContent className="p-4 text-center">
          <Smartphone className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-3">
            Need help choosing? Our mobile support team is here for you.
          </p>
          <Button variant="outline" size="sm">
            Contact Support
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

interface MobilePlanCardProps {
  plan: MobilePlan;
  isSelected: boolean;
  onSelect: () => void;
  onUpgrade: () => void;
  loading: boolean;
  disabled: boolean;
}

function MobilePlanCard({ plan, isSelected, onSelect, onUpgrade, loading, disabled }: MobilePlanCardProps) {
  return (
    <Card 
      className={`transition-all ${
        isSelected ? 'ring-2 ring-blue-500 shadow-lg' : 'shadow-md'
      } ${plan.popular ? 'border-blue-200' : ''}`}
      onClick={onSelect}
    >
      {plan.popular && (
        <div className="bg-blue-500 text-white text-xs font-medium text-center py-2 rounded-t-lg">
          Most Popular
        </div>
      )}
      
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${
              plan.id === 'premium' ? 'bg-yellow-100' : 'bg-purple-100'
            }`}>
              {plan.icon}
            </div>
            <div>
              <CardTitle className="text-lg">{plan.name}</CardTitle>
              <CardDescription className="text-sm">{plan.description}</CardDescription>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">${plan.price}</div>
            <div className="text-xs text-muted-foreground">/month</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Mobile-Optimized Features List */}
        <div className="space-y-2 mb-4">
          {plan.features.slice(0, 3).map((feature, index) => (
            <div key={index} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </div>
          ))}
          {plan.features.length > 3 && (
            <div className="text-xs text-muted-foreground">
              +{plan.features.length - 3} more features
            </div>
          )}
        </div>

        <Button 
          onClick={(e) => {
            e.stopPropagation();
            onUpgrade();
          }}
          disabled={loading || disabled}
          className="w-full"
          variant={plan.popular ? 'default' : 'outline'}
        >
          {loading ? (
            'Processing...'
          ) : (
            <>
              Upgrade to {plan.name}
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

function MobileFeaturesSheet() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="w-full mt-4">
          Compare All Features
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[80vh] overflow-y-auto">
        <SheetHeader className="pb-6">
          <SheetTitle>Mobile Features Comparison</SheetTitle>
          <SheetDescription>
            See what you get with each subscription plan
          </SheetDescription>
        </SheetHeader>
        
        <div className="space-y-6">
          {mobilePlans.map((plan) => (
            <Card key={plan.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {plan.icon}
                  {plan.name} - ${plan.price}/month
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function MobileSignInPrompt() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Smartphone className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle>Sign In Required</CardTitle>
          <CardDescription>
            Please sign in to view subscription options and upgrade your plan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => window.location.href = '/login'}
            className="w-full"
          >
            Sign In to Continue
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}