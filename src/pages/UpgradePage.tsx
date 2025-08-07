/**
 * Upgrade Page Component
 * Handles subscription upgrades and plan selection
 */

import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useSubscriptionStatus } from '../hooks/useSubscriptionStatus';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Check, Star, Crown, Zap } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  description: string;
  features: PlanFeature[];
  recommended?: boolean;
  stripePriceId: string;
  icon: React.ReactNode;
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'month',
    description: 'Perfect for trying out Saverly',
    stripePriceId: '',
    icon: <Zap className="h-6 w-6" />,
    features: [
      { text: 'Browse all coupons', included: true },
      { text: '5 coupon redemptions per month', included: true },
      { text: 'Basic search filters', included: true },
      { text: 'Mobile app access', included: true },
      { text: 'Email notifications', included: false },
      { text: 'Priority customer support', included: false },
      { text: 'Advanced analytics', included: false },
      { text: 'Create business listings', included: false }
    ]
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 9.99,
    interval: 'month',
    description: 'Unlimited access to all consumer features',
    stripePriceId: 'price_premium_monthly', // Replace with actual Stripe Price ID
    icon: <Star className="h-6 w-6" />,
    recommended: true,
    features: [
      { text: 'Browse all coupons', included: true },
      { text: 'Unlimited coupon redemptions', included: true },
      { text: 'Advanced search & filters', included: true },
      { text: 'Mobile app access', included: true },
      { text: 'Email & push notifications', included: true },
      { text: 'Priority customer support', included: true },
      { text: 'Exclusive premium deals', included: true },
      { text: 'Create business listings', included: false }
    ]
  },
  {
    id: 'business',
    name: 'Business',
    price: 29.99,
    interval: 'month',
    description: 'Full business management suite',
    stripePriceId: 'price_business_monthly', // Replace with actual Stripe Price ID
    icon: <Crown className="h-6 w-6" />,
    features: [
      { text: 'All Premium features', included: true },
      { text: 'Create unlimited coupons', included: true },
      { text: 'Business analytics dashboard', included: true },
      { text: 'Customer management tools', included: true },
      { text: 'Advanced reporting', included: true },
      { text: 'API access', included: true },
      { text: 'White-label options', included: true },
      { text: 'Dedicated account manager', included: true }
    ]
  }
];

export function UpgradePage() {
  const { user, userProfile } = useAuth();
  const { subscriptionStatus } = useSubscriptionStatus();
  const [loading, setLoading] = useState<string | null>(null);

  const handleUpgrade = async (plan: Plan) => {
    if (!user || plan.price === 0) return;

    setLoading(plan.id);
    
    try {
      // Create checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: plan.stripePriceId,
          userId: user.id,
          userEmail: user.email,
          planName: plan.name
        }),
      });

      const { sessionId } = await response.json();
      
      // Redirect to Stripe Checkout
      const stripe = await stripePromise;
      if (stripe) {
        const { error } = await stripe.redirectToCheckout({ sessionId });
        if (error) {
          console.error('Stripe checkout error:', error);
        }
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
    } finally {
      setLoading(null);
    }
  };

  const getCurrentPlan = () => {
    if (!userProfile) return 'free';
    
    if (userProfile.user_role === 'business' && subscriptionStatus.isActive) {
      return 'business';
    } else if (subscriptionStatus.isActive && userProfile.user_role === 'consumer') {
      return 'premium';
    } else {
      return 'free';
    }
  };

  const currentPlan = getCurrentPlan();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Saverly Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Unlock the full potential of coupon savings with our flexible plans
          </p>
          
          {/* Current Status */}
          {userProfile && (
            <div className="mt-6 p-4 bg-white rounded-lg border inline-block">
              <p className="text-sm text-gray-600">
                Current Plan: 
                <Badge className="ml-2" variant={currentPlan === 'free' ? 'secondary' : 'default'}>
                  {plans.find(p => p.id === currentPlan)?.name}
                </Badge>
              </p>
              {subscriptionStatus.daysUntilExpiry && (
                <p className="text-sm text-orange-600 mt-1">
                  Expires in {subscriptionStatus.daysUntilExpiry} days
                </p>
              )}
            </div>
          )}
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative ${
                plan.recommended 
                  ? 'ring-2 ring-blue-500 shadow-xl scale-105' 
                  : 'shadow-lg'
              } ${currentPlan === plan.id ? 'ring-2 ring-green-500' : ''}`}
            >
              {plan.recommended && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-500 text-white px-4 py-1">
                    Most Popular
                  </Badge>
                </div>
              )}
              
              {currentPlan === plan.id && (
                <div className="absolute -top-3 right-4">
                  <Badge className="bg-green-500 text-white px-4 py-1">
                    Current Plan
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-6">
                <div className="flex justify-center mb-4">
                  <div className={`p-3 rounded-full ${
                    plan.id === 'free' ? 'bg-gray-100' :
                    plan.id === 'premium' ? 'bg-yellow-100' : 'bg-purple-100'
                  }`}>
                    {plan.icon}
                  </div>
                </div>
                
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <CardDescription className="text-gray-600 mt-2">
                  {plan.description}
                </CardDescription>
                
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">
                    ${plan.price}
                  </span>
                  <span className="text-gray-600">/{plan.interval}</span>
                </div>
              </CardHeader>

              <CardContent>
                {/* Features List */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check 
                        className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                          feature.included 
                            ? 'text-green-500' 
                            : 'text-gray-300'
                        }`} 
                      />
                      <span className={`text-sm ${
                        feature.included 
                          ? 'text-gray-900' 
                          : 'text-gray-400 line-through'
                      }`}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Action Button */}
                <Button 
                  onClick={() => handleUpgrade(plan)}
                  disabled={loading === plan.id || currentPlan === plan.id || !user}
                  className={`w-full ${
                    plan.recommended 
                      ? 'bg-blue-600 hover:bg-blue-700' 
                      : ''
                  }`}
                  variant={currentPlan === plan.id ? 'outline' : 'default'}
                >
                  {loading === plan.id ? (
                    'Processing...'
                  ) : currentPlan === plan.id ? (
                    'Current Plan'
                  ) : plan.price === 0 ? (
                    'Free Forever'
                  ) : (
                    `Upgrade to ${plan.name}`
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="font-semibold text-lg mb-2">Can I change plans anytime?</h3>
              <p className="text-gray-600">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, 
                and you'll be billed prorated amounts.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="font-semibold text-lg mb-2">What happens when my subscription expires?</h3>
              <p className="text-gray-600">
                You'll automatically be moved to the free plan. Your data remains safe, 
                but you'll lose access to premium features until you resubscribe.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="font-semibold text-lg mb-2">Is my payment information secure?</h3>
              <p className="text-gray-600">
                Absolutely! All payments are processed securely through Stripe. 
                We never store your payment information on our servers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}