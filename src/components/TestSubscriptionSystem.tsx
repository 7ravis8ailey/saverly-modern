/**
 * Test Component for Subscription System
 * Demonstrates all subscription features working together
 */

import React from 'react';
import { useAuthProvider } from '../hooks/use-auth';
import { useSubscriptionStatus, useSubscriptionViews } from '../hooks/useSubscriptionStatus';
import { SubscriptionGate, SubscriptionStatusBadge, CouponLimitDisplay } from './SubscriptionGate';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Star, Crown, Users, BarChart3, Settings } from 'lucide-react';

export function TestSubscriptionSystem() {
  const { user, profile, loading } = useAuthProvider();
  const { subscriptionStatus, loading: subLoading } = useSubscriptionStatus();
  const { viewType, showUpgradePrompt, upgradeMessage } = useSubscriptionViews();

  if (loading || subLoading) {
    return <div className="p-8">Loading subscription system test...</div>;
  }

  if (!user) {
    return <div className="p-8">Please sign in to test the subscription system.</div>;
  }

  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">🧪 Subscription System Test</h1>
        <p className="text-muted-foreground">
          Complete test of the role-based subscription architecture
        </p>
      </div>

      {/* User Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Current User Status
            <SubscriptionStatusBadge />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold">User Info</h4>
              <p>Email: {profile?.email}</p>
              <p>Name: {profile?.full_name || 'Not set'}</p>
              <p>Role: <Badge variant="outline">{profile?.user_role || 'consumer'}</Badge></p>
              <p>Admin: {profile?.is_admin ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <h4 className="font-semibold">Subscription</h4>
              <p>Status: <Badge>{subscriptionStatus.status}</Badge></p>
              <p>Active: {subscriptionStatus.isActive ? 'Yes' : 'No'}</p>
              <p>Expired: {subscriptionStatus.isExpired ? 'Yes' : 'No'}</p>
              {subscriptionStatus.daysUntilExpiry && (
                <p>Days until expiry: {subscriptionStatus.daysUntilExpiry}</p>
              )}
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">View Type</h4>
            <Badge variant="default" className="text-lg px-4 py-2">
              {viewType.toUpperCase()} VIEW
            </Badge>
            
            <div className="mt-4">
              <CouponLimitDisplay />
            </div>
          </div>

          {showUpgradePrompt && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800">{upgradeMessage}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Feature Access Tests */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Access Tests</CardTitle>
          <CardDescription>
            Testing what features are accessible based on current subscription
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Free Features (Always Accessible) */}
          <div>
            <h4 className="font-semibold mb-3 text-green-600">✅ Free Features (Everyone)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SubscriptionGate requiredPlan="free">
                <Card className="border-green-200">
                  <CardContent className="p-4">
                    <h5 className="font-medium">Browse Coupons</h5>
                    <p className="text-sm text-muted-foreground">View all available deals</p>
                  </CardContent>
                </Card>
              </SubscriptionGate>
              
              <SubscriptionGate requiredPlan="free">
                <Card className="border-green-200">
                  <CardContent className="p-4">
                    <h5 className="font-medium">Basic Search</h5>
                    <p className="text-sm text-muted-foreground">Find coupons by category</p>
                  </CardContent>
                </Card>
              </SubscriptionGate>
            </div>
          </div>

          {/* Premium Features */}
          <div>
            <h4 className="font-semibold mb-3 text-blue-600">⭐ Premium Features</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SubscriptionGate 
                requiredPlan="premium"
                fallback={
                  <Card className="border-gray-200 bg-gray-50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-gray-400" />
                        <h5 className="font-medium text-gray-500">Unlimited Redemptions</h5>
                      </div>
                      <p className="text-sm text-gray-400">Upgrade to Premium</p>
                    </CardContent>
                  </Card>
                }
              >
                <Card className="border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-blue-600" />
                      <h5 className="font-medium">Unlimited Redemptions</h5>
                    </div>
                    <p className="text-sm text-muted-foreground">Redeem as many coupons as you want</p>
                  </CardContent>
                </Card>
              </SubscriptionGate>
              
              <SubscriptionGate 
                requiredPlan="premium"
                fallback={
                  <Card className="border-gray-200 bg-gray-50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-gray-400" />
                        <h5 className="font-medium text-gray-500">Premium Support</h5>
                      </div>
                      <p className="text-sm text-gray-400">Upgrade to Premium</p>
                    </CardContent>
                  </Card>
                }
              >
                <Card className="border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-blue-600" />
                      <h5 className="font-medium">Premium Support</h5>
                    </div>
                    <p className="text-sm text-muted-foreground">Priority customer service</p>
                  </CardContent>
                </Card>
              </SubscriptionGate>
            </div>
          </div>

          {/* Business Features */}
          <div>
            <h4 className="font-semibold mb-3 text-purple-600">👑 Business Features</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SubscriptionGate 
                requiredPlan="business"
                fallback={
                  <Card className="border-gray-200 bg-gray-50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4 text-gray-400" />
                        <h5 className="font-medium text-gray-500">Create Coupons</h5>
                      </div>
                      <p className="text-sm text-gray-400">Upgrade to Business</p>
                    </CardContent>
                  </Card>
                }
              >
                <Card className="border-purple-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-purple-600" />
                      <h5 className="font-medium">Create Coupons</h5>
                    </div>
                    <p className="text-sm text-muted-foreground">Design and publish deals</p>
                  </CardContent>
                </Card>
              </SubscriptionGate>
              
              <SubscriptionGate 
                requiredPlan="business"
                fallback={
                  <Card className="border-gray-200 bg-gray-50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-gray-400" />
                        <h5 className="font-medium text-gray-500">Analytics Dashboard</h5>
                      </div>
                      <p className="text-sm text-gray-400">Upgrade to Business</p>
                    </CardContent>
                  </Card>
                }
              >
                <Card className="border-purple-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-purple-600" />
                      <h5 className="font-medium">Analytics Dashboard</h5>
                    </div>
                    <p className="text-sm text-muted-foreground">Track performance metrics</p>
                  </CardContent>
                </Card>
              </SubscriptionGate>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => window.location.href = '/upgrade'}>
              View Upgrade Options
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Refresh Status
            </Button>
            {profile?.user_role === 'business' && (
              <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>
                <Settings className="h-4 w-4 mr-2" />
                Business Dashboard
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Debug Info */}
      <details className="text-sm">
        <summary className="cursor-pointer font-semibold">🔍 Debug Information</summary>
        <pre className="mt-4 p-4 bg-gray-100 rounded-lg overflow-auto">
          {JSON.stringify({
            user: { id: user.id, email: user.email },
            profile: {
              user_role: profile?.user_role,
              is_admin: profile?.is_admin,
              subscription_status: profile?.subscription_status,
              subscription_period_end: profile?.subscription_period_end
            },
            subscriptionStatus,
            viewType,
            showUpgradePrompt,
            upgradeMessage
          }, null, 2)}
        </pre>
      </details>
    </div>
  );
}