/**
 * Enhanced Coupon Discovery Component
 * Advanced filtering and business search for active subscribers
 */

import React, { useState } from 'react';
import { 
  Search, Filter, MapPin, Star, Clock, TrendingUp, 
  Zap, Building2, SlidersHorizontal, RefreshCw,
  ChevronDown, X, Navigation
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { CouponCard } from '@/components/coupon-card';
import { CategoryIcon, allCategories } from '@/lib/category-icons';
import { useEnhancedCouponDiscovery, type AdvancedCouponFilter, type SortOption, type CategoryFilter } from '@/hooks/useEnhancedCouponDiscovery';
import { useSubscriptionViews } from '@/hooks/useSubscriptionStatus';
import type { CouponWithBusiness, BusinessSearchResult } from '@/hooks/useEnhancedCouponDiscovery';

interface EnhancedCouponDiscoveryProps {
  onRedeemCoupon: (coupon: CouponWithBusiness) => void;
  onViewCouponDetails: (coupon: CouponWithBusiness) => void;
  className?: string;
}

const filterLabels: Record<AdvancedCouponFilter, string> = {
  'all': 'All Coupons',
  'near-me': 'Near Me',
  'newest': 'Newest',
  'expiring': 'Expiring Soon',
  'popular': 'Most Popular',
  'featured': 'Featured',
  'distance-5mi': 'Within 5 miles',
  'distance-10mi': 'Within 10 miles',
  'distance-25mi': 'Within 25 miles'
};

const sortLabels: Record<SortOption, string> = {
  'relevance': 'Best Match',
  'distance': 'Nearest First',
  'newest': 'Newest First',
  'expiring': 'Expiring Soon',
  'popularity': 'Most Popular',
  'savings': 'Highest Savings'
};

export function EnhancedCouponDiscovery({ 
  onRedeemCoupon, 
  onViewCouponDetails,
  className = '' 
}: EnhancedCouponDiscoveryProps) {
  const {
    coupons,
    businessResults,
    loading,
    businessSearchLoading,
    error,
    userLocation,
    filters,
    updateFilter,
    resetFilters,
    hasAdvancedFilters,
    canUseBusinessSearch,
    canUseGeolocation,
    refresh,
    formatDistance,
    isExpiringSoon
  } = useEnhancedCouponDiscovery();

  const { viewType, showUpgradePrompt } = useSubscriptionViews();
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<'coupons' | 'businesses'>('coupons');

  // Premium feature gates
  const PremiumFeature = ({ children, feature }: { children: React.ReactNode, feature: string }) => {
    if (showUpgradePrompt) {
      return (
        <div className="relative">
          <div className="opacity-50 pointer-events-none">
            {children}
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded">
            <Badge variant="secondary" className="text-xs">
              Premium Only
            </Badge>
          </div>
        </div>
      );
    }
    return <>{children}</>;
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="text-center max-w-md">
          <p className="text-red-600 mb-4">Failed to load coupons</p>
          <p className="text-gray-500 text-sm mb-4">{error}</p>
          <Button onClick={refresh} variant="default">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Enhanced Search Header */}
      <div className="space-y-4">
        {/* Main Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search coupons, businesses, categories..."
            value={filters.searchTerm}
            onChange={(e) => updateFilter('searchTerm', e.target.value)}
            className="pl-12 pr-4 text-lg h-14"
          />
          {filters.searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => updateFilter('searchTerm', '')}
              className="absolute right-2 top-1/2 transform -translate-y-1/2"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Business Search - Premium Feature */}
        {canUseBusinessSearch && (
          <PremiumFeature feature="business-search">
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search for specific businesses..."
                value={filters.businessSearch}
                onChange={(e) => updateFilter('businessSearch', e.target.value)}
                className="pl-10 pr-4"
              />
              {businessSearchLoading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                </div>
              )}
            </div>
          </PremiumFeature>
        )}

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'coupons' | 'businesses')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="coupons" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Coupons ({coupons.length})
            </TabsTrigger>
            <TabsTrigger value="businesses" className="flex items-center gap-2" disabled={!canUseBusinessSearch}>
              <Building2 className="w-4 h-4" />
              Businesses ({businessResults.length})
              {!canUseBusinessSearch && <Badge variant="secondary" className="ml-1 text-xs">Premium</Badge>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="coupons" className="space-y-6">
            {/* Quick Filters */}
            <div className="flex flex-wrap gap-2">
              {Object.entries(filterLabels).map(([value, label]) => {
                const isAdvanced = ['distance-5mi', 'distance-10mi', 'distance-25mi', 'featured'].includes(value);
                const isLocationBased = ['near-me', 'distance-5mi', 'distance-10mi', 'distance-25mi'].includes(value);
                
                const filterButton = (
                  <Button
                    key={value}
                    variant={filters.filter === value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateFilter('filter', value as AdvancedCouponFilter)}
                    className="text-xs flex items-center gap-1"
                    disabled={isLocationBased && !userLocation}
                  >
                    {value === 'near-me' && <MapPin className="w-3 h-3" />}
                    {value === 'newest' && <Clock className="w-3 h-3" />}
                    {value === 'popular' && <TrendingUp className="w-3 h-3" />}
                    {value === 'featured' && <Star className="w-3 h-3" />}
                    {label}
                    {isLocationBased && !userLocation && <span className="text-gray-400">(Location needed)</span>}
                  </Button>
                );

                return isAdvanced ? (
                  <PremiumFeature key={value} feature={`filter-${value}`}>
                    {filterButton}
                  </PremiumFeature>
                ) : filterButton;
              })}
            </div>

            {/* Category Filters */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Categories</span>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Sort By */}
                  <Select 
                    value={filters.sortBy} 
                    onValueChange={(value) => updateFilter('sortBy', value as SortOption)}
                  >
                    <SelectTrigger className="w-[140px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(sortLabels).map(([value, label]) => {
                        const isPremium = ['distance', 'savings'].includes(value);
                        return (
                          <SelectItem 
                            key={value} 
                            value={value}
                            disabled={isPremium && !hasAdvancedFilters}
                          >
                            {label}
                            {isPremium && !hasAdvancedFilters && <Badge variant="secondary" className="ml-1 text-xs">Premium</Badge>}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>

                  {/* Advanced Filters */}
                  {hasAdvancedFilters && (
                    <Dialog open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <SlidersHorizontal className="w-4 h-4 mr-1" />
                          Advanced
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Advanced Filters</DialogTitle>
                          <DialogDescription>
                            Fine-tune your coupon search with premium filters
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-6">
                          {/* Location Radius */}
                          {canUseGeolocation && userLocation && (
                            <div className="space-y-3">
                              <Label>Distance Range</Label>
                              <div className="space-y-2">
                                <Slider
                                  value={[filters.radiusInMiles]}
                                  onValueChange={([value]) => updateFilter('radiusInMiles', value)}
                                  max={50}
                                  min={1}
                                  step={1}
                                  className="w-full"
                                />
                                <div className="flex justify-between text-sm text-gray-500">
                                  <span>1 mile</span>
                                  <span>{filters.radiusInMiles} miles</span>
                                  <span>50 miles</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Savings Range */}
                          <div className="space-y-3">
                            <Label>Estimated Savings Range</Label>
                            <div className="space-y-2">
                              <Slider
                                value={filters.priceRange}
                                onValueChange={(value) => updateFilter('priceRange', value)}
                                max={200}
                                min={0}
                                step={5}
                                className="w-full"
                              />
                              <div className="flex justify-between text-sm text-gray-500">
                                <span>${filters.priceRange[0]}</span>
                                <span>${filters.priceRange[1]}+</span>
                              </div>
                            </div>
                          </div>

                          {/* Toggle Filters */}
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="expiring-soon">Expiring Soon (7 days)</Label>
                              <Switch
                                id="expiring-soon"
                                checked={filters.showExpiringSoon}
                                onCheckedChange={(checked) => updateFilter('showExpiringSoon', checked)}
                              />
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <Label htmlFor="new-only">New Coupons Only</Label>
                              <Switch
                                id="new-only"
                                checked={filters.showNewOnly}
                                onCheckedChange={(checked) => updateFilter('showNewOnly', checked)}
                              />
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <Label htmlFor="featured-only">Featured Only</Label>
                              <Switch
                                id="featured-only"
                                checked={filters.showFeaturedOnly}
                                onCheckedChange={(checked) => updateFilter('showFeaturedOnly', checked)}
                              />
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button variant="outline" onClick={resetFilters} className="flex-1">
                              Reset All
                            </Button>
                            <Button onClick={() => setShowAdvancedFilters(false)} className="flex-1">
                              Apply Filters
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refresh}
                    disabled={loading}
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={filters.categoryFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateFilter('categoryFilter', 'all')}
                  className="text-xs"
                >
                  All Categories
                </Button>
                
                {allCategories.map((category) => (
                  <Button
                    key={category}
                    variant={filters.categoryFilter === category ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateFilter('categoryFilter', category)}
                    className="text-xs flex items-center gap-1"
                  >
                    <CategoryIcon category={category} size={14} />
                    {category}
                  </Button>
                ))}
              </div>
            </div>

            {/* Active Filters & Results Info */}
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div>
                {loading ? (
                  'Loading coupons...'
                ) : (
                  `${coupons.length} coupon${coupons.length !== 1 ? 's' : ''} found`
                )}
                {userLocation && canUseGeolocation && (
                  <span className="ml-2 flex items-center gap-1">
                    <Navigation className="w-3 h-3" />
                    Location enabled
                  </span>
                )}
              </div>
              
              {/* Active Filters Display */}
              {(filters.filter !== 'all' || filters.categoryFilter !== 'all' || filters.searchTerm.trim()) && (
                <div className="flex items-center gap-2">
                  <span>Active filters:</span>
                  {filters.filter !== 'all' && (
                    <Badge variant="secondary" className="text-xs">
                      {filterLabels[filters.filter]}
                    </Badge>
                  )}
                  {filters.categoryFilter !== 'all' && (
                    <Badge variant="secondary" className="text-xs flex items-center gap-1">
                      <CategoryIcon category={filters.categoryFilter} size={12} />
                      {filters.categoryFilter}
                    </Badge>
                  )}
                  {filters.searchTerm.trim() && (
                    <Badge variant="secondary" className="text-xs">
                      "{filters.searchTerm}"
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetFilters}
                    className="h-6 px-2 text-xs"
                  >
                    Clear all
                  </Button>
                </div>
              )}
            </div>

            {/* Coupon Grid */}
            {loading ? (
              <CouponLoadingSkeleton />
            ) : coupons.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {coupons.map((coupon) => (
                  <CouponCard
                    key={coupon.id}
                    coupon={coupon}
                    onRedeem={onRedeemCoupon}
                    onViewDetails={onViewCouponDetails}
                    formatDistance={formatDistance}
                    isExpiringSoon={isExpiringSoon}
                    showDistance={canUseGeolocation && !!userLocation}
                    showSavingsAmount={hasAdvancedFilters}
                    showNewBadge={hasAdvancedFilters && coupon.isNew}
                    showFeaturedBadge={hasAdvancedFilters && coupon.isFeatured}
                  />
                ))}
              </div>
            ) : (
              <CouponEmptyState onClearFilters={resetFilters} onRefresh={refresh} />
            )}
          </TabsContent>

          <TabsContent value="businesses" className="space-y-6">
            <BusinessSearchResults 
              results={businessResults}
              loading={businessSearchLoading}
              onViewBusiness={(business) => {
                // Navigate to business detail or show coupons
                console.log('View business:', business);
              }}
              formatDistance={formatDistance}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Loading skeleton component
function CouponLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Empty state component
function CouponEmptyState({ onClearFilters, onRefresh }: { onClearFilters: () => void, onRefresh: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 mx-auto">
          <Search className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No coupons found
        </h3>
        <p className="text-gray-500 text-sm mb-4">
          Try adjusting your search or filters to find more coupons.
        </p>
        <div className="flex gap-2 justify-center">
          <Button variant="outline" size="sm" onClick={onClearFilters}>
            Clear Filters
          </Button>
          <Button variant="default" size="sm" onClick={onRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
    </div>
  );
}

// Business search results component
function BusinessSearchResults({ 
  results, 
  loading, 
  onViewBusiness, 
  formatDistance 
}: { 
  results: BusinessSearchResult[], 
  loading: boolean, 
  onViewBusiness: (business: BusinessSearchResult) => void,
  formatDistance: (distance: number) => string
}) {
  if (loading) {
    return <div className="text-center py-8">Searching businesses...</div>;
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Building2 className="w-8 h-8 mx-auto mb-2" />
        <p>No businesses found. Try a different search term.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {results.map((result) => (
        <Card key={result.business.id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">{result.business.name}</CardTitle>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <CategoryIcon category={result.business.category as CategoryType} size={16} />
                  <span>{result.business.category}</span>
                  {result.distance && (
                    <>
                      <span>•</span>
                      <MapPin className="w-3 h-3" />
                      <span>{formatDistance(result.distance)}</span>
                    </>
                  )}
                </div>
              </div>
              <Badge variant="secondary">
                {result.couponsCount} coupon{result.couponsCount !== 1 ? 's' : ''}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">{result.business.formatted_address}</p>
              <Button variant="outline" size="sm" onClick={() => onViewBusiness(result)}>
                View Coupons
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}