/**
 * Subscription Marketing Page
 * Shows marketing content for non-subscribers - NO COUPON ACCESS
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, MapPin, Star, Zap, Shield, Clock, 
  TrendingUp, Users, CheckCircle, ArrowRight
} from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';

export default function SubscriptionMarketingPage() {
  const { user } = useAuth();

  const features = [
    {
      icon: Heart,
      title: "Support Local",
      description: "Every coupon redeemed helps local businesses and non-profits thrive in your community"
    },
    {
      icon: MapPin,
      title: "Near You",
      description: "Discover deals from businesses within walking distance or across town"
    },
    {
      icon: Star,
      title: "Exclusive Offers",
      description: "Access member-only deals you won't find anywhere else"
    },
    {
      icon: Zap,
      title: "Smart Discovery",
      description: "Advanced filtering helps you find exactly what you're looking for"
    },
    {
      icon: Shield,
      title: "Verified Businesses",
      description: "All partners are verified local businesses and registered non-profits"
    },
    {
      icon: Clock,
      title: "Real-Time Updates",
      description: "Get notified about new deals and expiring offers instantly"
    }
  ];

  const benefits = [
    "Unlimited coupon access",
    "Advanced search & filtering", 
    "Business discovery tools",
    "Location-based recommendations",
    "New deal notifications",
    "Priority customer support"
  ];

  const testimonials = [
    {
      name: "Sarah M.",
      location: "Downtown",
      quote: "I've saved over $200 this month while discovering amazing local spots!"
    },
    {
      name: "Mike T.", 
      location: "Suburbs",
      quote: "Perfect for supporting local businesses. The app pays for itself in one visit."
    },
    {
      name: "Jennifer R.",
      location: "City Center", 
      quote: "Love how easy it is to find deals near my office and home."
    }
  ];

  const handleGetStarted = () => {
    if (user) {
      // Redirect to subscription flow
      window.location.href = '/upgrade';
    } else {
      // Redirect to signup
      window.location.href = '/auth/register';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-green-600 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="bg-white/20 text-white mb-6 px-4 py-2">
              <Heart className="w-4 h-4 mr-2" />
              Supporting Local Communities Since 2024
            </Badge>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Save Money While Supporting
              <span className="block text-yellow-300">Local Businesses</span>
            </h1>
            
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
              Save money while supporting local businesses and non profits in your area
            </p>

            {/* Pricing Highlight */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-8 max-w-md mx-auto">
              <div className="text-center">
                <p className="text-blue-200 mb-2">Join thousands of local supporters for just</p>
                <div className="text-4xl md:text-5xl font-bold mb-2">
                  $4.99
                  <span className="text-lg text-blue-200 ml-2">/month</span>
                </div>
                <p className="text-blue-200 text-sm">Cancel anytime • No setup fees</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-8 py-4 text-lg"
                onClick={handleGetStarted}
              >
                {user ? 'Start Saving Today' : 'Create Account & Start Saving'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              
              {!user && (
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 text-lg"
                  onClick={() => window.location.href = '/auth/login'}
                >
                  Sign In
                </Button>
              )}
            </div>
            
            <p className="text-blue-200 mt-4 text-sm">
              Join 10,000+ members supporting their local community
            </p>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                More Than Just Savings
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Every dollar you save helps strengthen your local economy and supports community growth
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-8 text-center">
                    <div className="bg-gradient-to-br from-blue-100 to-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                      <feature.icon className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Everything You Need to Save
              </h2>
              <p className="text-xl text-gray-600">
                Unlock powerful features designed to maximize your savings
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center bg-white p-4 rounded-lg shadow-sm">
                  <CheckCircle className="w-6 h-6 text-green-600 mr-4 flex-shrink-0" />
                  <span className="text-gray-800 font-medium">{benefit}</span>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <Button 
                size="lg" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg"
                onClick={handleGetStarted}
              >
                {user ? 'Subscribe Now - $4.99/month' : 'Get Started - $4.99/month'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                What Our Members Say
              </h2>
              <p className="text-xl text-gray-600">
                Real stories from real people in your community
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="border-0 shadow-lg">
                  <CardContent className="p-8">
                    <div className="flex mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 text-yellow-500 fill-current" />
                      ))}
                    </div>
                    <blockquote className="text-gray-700 mb-4 leading-relaxed">
                      "{testimonial.quote}"
                    </blockquote>
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-green-400 rounded-full flex items-center justify-center mr-3">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{testimonial.name}</p>
                        <p className="text-sm text-gray-600">{testimonial.location}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="py-20 bg-gradient-to-r from-blue-600 to-green-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Start Saving?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join thousands of members who are saving money while supporting their local community
            </p>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 mb-8 inline-block">
              <div className="flex items-center justify-center gap-8 text-center">
                <div>
                  <div className="text-2xl font-bold">10,000+</div>
                  <div className="text-blue-200 text-sm">Happy Members</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">$200+</div>
                  <div className="text-blue-200 text-sm">Avg Monthly Savings</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">500+</div>
                  <div className="text-blue-200 text-sm">Local Partners</div>
                </div>
              </div>
            </div>

            <Button 
              size="lg" 
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-12 py-4 text-lg"
              onClick={handleGetStarted}
            >
              {user ? 'Subscribe for $4.99/month' : 'Create Account & Subscribe'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            
            <p className="text-blue-200 mt-4 text-sm">
              No contracts • Cancel anytime • Start saving today
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}