import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { adminAPI } from '@/lib/admin-api';
import { 
  Users, 
  Building2, 
  Ticket, 
  BarChart3, 
  TrendingUp,
  ArrowRight,
  Loader2,
  AlertCircle,
  UserCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminDashboard() {
  const { 
    data: stats, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: adminAPI.getStats,
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-saverly-green" />
          <span className="ml-2 text-gray-600">Loading dashboard...</span>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <h2 className="text-xl font-semibold text-gray-900">Error loading dashboard</h2>
          <p className="text-gray-600">Unable to fetch admin statistics.</p>
          <Button onClick={() => refetch()} variant="outline">
            Try Again
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const metrics = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      description: 'Registered platform users',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      href: '/admin/users'
    },
    {
      title: 'Active Subscribers', 
      value: stats?.activeSubscribers || 0,
      description: 'Current paid subscribers',
      icon: UserCheck,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      href: '/admin/users?filter=active'
    },
    {
      title: 'Total Businesses',
      value: stats?.totalBusinesses || 0, 
      description: 'Registered businesses',
      icon: Building2,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      href: '/admin/businesses'
    },
    {
      title: 'Active Coupons',
      value: stats?.activeCoupons || 0,
      description: 'Currently active offers',
      icon: Ticket,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      href: '/admin/businesses' // Could link to coupons view
    },
    {
      title: 'Total Redemptions',
      value: stats?.totalRedemptions || 0,
      description: 'Successful coupon uses',
      icon: TrendingUp,
      color: 'text-red-600', 
      bgColor: 'bg-red-50',
      href: '/admin/redemptions'
    }
  ];

  const quickActions = [
    {
      title: 'Manage Users',
      description: 'View and edit user accounts, subscription status',
      icon: Users,
      href: '/admin/users',
      color: 'border-blue-200 hover:border-blue-300'
    },
    {
      title: 'Manage Businesses',
      description: 'Review business listings, verify accounts',
      icon: Building2, 
      href: '/admin/businesses',
      color: 'border-purple-200 hover:border-purple-300'
    },
    {
      title: 'View Redemptions',
      description: 'Track coupon usage and customer activity',
      icon: BarChart3,
      href: '/admin/redemptions', 
      color: 'border-red-200 hover:border-red-300'
    }
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Overview of your Saverly platform metrics and activity
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <Link key={metric.title} to={metric.href}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer border-0 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-600">
                          {metric.title}
                        </p>
                        <div className="text-2xl font-bold text-gray-900">
                          {metric.value.toLocaleString()}
                        </div>
                        <p className="text-xs text-gray-500">
                          {metric.description}
                        </p>
                      </div>
                      <div className={cn("p-3 rounded-full", metric.bgColor)}>
                        <Icon className={cn("w-6 h-6", metric.color)} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Card 
                  key={action.title} 
                  className={cn(
                    "hover:shadow-md transition-all cursor-pointer",
                    action.color
                  )}
                >
                  <Link to={action.href}>
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Icon className="w-6 h-6 text-gray-600" />
                          <CardTitle className="text-lg">{action.title}</CardTitle>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <CardDescription className="text-sm">
                        {action.description}
                      </CardDescription>
                    </CardContent>
                  </Link>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Recent Activity Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Platform Summary</span>
            </CardTitle>
            <CardDescription>
              Key insights about your platform performance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-saverly-green">
                  {stats?.activeSubscribers && stats?.totalUsers 
                    ? Math.round((stats.activeSubscribers / stats.totalUsers) * 100)
                    : 0}%
                </div>
                <p className="text-sm text-gray-600 mt-1">Subscription Rate</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-saverly-green">
                  {stats?.totalBusinesses && stats?.activeCoupons
                    ? Math.round(stats.activeCoupons / stats.totalBusinesses)
                    : 0}
                </div>
                <p className="text-sm text-gray-600 mt-1">Avg Coupons/Business</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-saverly-green">
                  {stats?.activeCoupons && stats?.totalRedemptions
                    ? Math.round((stats.totalRedemptions / stats.activeCoupons) * 100) / 100
                    : 0}
                </div>
                <p className="text-sm text-gray-600 mt-1">Redemption Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}