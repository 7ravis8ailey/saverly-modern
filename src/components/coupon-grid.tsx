import React from 'react'
import { Search, Filter, RefreshCw, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { CouponCard } from './coupon-card'
import { CategoryIcon, allCategories } from '@/lib/category-icons'
import { useCoupons, type CouponFilter, type CategoryFilter } from '@/hooks/use-coupons'
import type { Coupon, Business } from '@/types'

interface CouponWithBusiness extends Coupon {
  business: Business
  distance?: number
  redemptionCount?: number
}

interface CouponGridProps {
  onRedeemCoupon: (coupon: CouponWithBusiness) => void
  onViewCouponDetails: (coupon: CouponWithBusiness) => void
  className?: string
}

const filterLabels: Record<CouponFilter, string> = {
  all: 'All Coupons',
  'near-me': 'Near Me',
  newest: 'Newest',
  expiring: 'Expiring Soon',
  popular: 'Most Popular'
}

export function CouponGrid({
  onRedeemCoupon,
  onViewCouponDetails,
  className = ''
}: CouponGridProps) {
  const {
    coupons,
    loading,
    error,
    filter,
    setFilter,
    categoryFilter,
    setCategoryFilter,
    searchTerm,
    setSearchTerm,
    refresh,
    formatDistance,
    isExpiringSoon
  } = useCoupons()

  const handleFilterChange = (newFilter: CouponFilter) => {
    setFilter(newFilter)
  }

  const handleCategoryChange = (category: CategoryFilter) => {
    setCategoryFilter(category)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="text-center max-w-md">
          <p className="text-red-600 mb-4">Failed to load coupons</p>
          <p className="text-gray-500 text-sm mb-4">{error}</p>
          <Button onClick={refresh} variant="saverly">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Search coupons, businesses, or offers..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="pl-10 pr-4"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(filterLabels).map(([value, label]) => (
            <Button
              key={value}
              variant={filter === value ? 'saverly' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange(value as CouponFilter)}
              className="text-xs"
            >
              {value === 'near-me' && <MapPin className="w-3 h-3 mr-1" />}
              {label}
            </Button>
          ))}
          
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={loading}
            className="text-xs"
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Category Filter */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Categories</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button
              variant={categoryFilter === 'all' ? 'saverly' : 'outline'}
              size="sm"
              onClick={() => handleCategoryChange('all')}
              className="text-xs"
            >
              All Categories
            </Button>
            
            {allCategories.map((category) => (
              <Button
                key={category}
                variant={categoryFilter === category ? 'saverly' : 'outline'}
                size="sm"
                onClick={() => handleCategoryChange(category)}
                className="text-xs flex items-center gap-1"
              >
                <CategoryIcon category={category} size={14} />
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div>
            {loading ? (
              'Loading coupons...'
            ) : (
              `${coupons.length} coupon${coupons.length !== 1 ? 's' : ''} found`
            )}
          </div>
          
          {/* Active Filters Display */}
          {(filter !== 'all' || categoryFilter !== 'all' || searchTerm.trim()) && (
            <div className="flex items-center gap-2">
              <span>Filters:</span>
              {filter !== 'all' && (
                <Badge variant="secondary" className="text-xs">
                  {filterLabels[filter]}
                </Badge>
              )}
              {categoryFilter !== 'all' && (
                <Badge variant="secondary" className="text-xs flex items-center gap-1">
                  <CategoryIcon category={categoryFilter} size={12} />
                  {categoryFilter}
                </Badge>
              )}
              {searchTerm.trim() && (
                <Badge variant="secondary" className="text-xs">
                  "{searchTerm}"
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-lg shadow-md border animate-pulse"
            >
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Coupon Grid */}
      {!loading && coupons.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coupons.map((coupon) => (
            <CouponCard
              key={coupon.uid}
              coupon={coupon}
              onRedeem={onRedeemCoupon}
              onViewDetails={onViewCouponDetails}
              formatDistance={formatDistance}
              isExpiringSoon={isExpiringSoon}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && coupons.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 mx-auto">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No coupons found
            </h3>
            <p className="text-gray-500 text-sm mb-4">
              {searchTerm.trim() || categoryFilter !== 'all' || filter !== 'all'
                ? 'Try adjusting your search or filters to find more coupons.'
                : 'No active coupons are currently available.'}
            </p>
            <div className="flex gap-2 justify-center">
              {(searchTerm.trim() || categoryFilter !== 'all' || filter !== 'all') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('')
                    setCategoryFilter('all')
                    setFilter('all')
                  }}
                >
                  Clear Filters
                </Button>
              )}
              <Button
                variant="saverly"
                size="sm"
                onClick={refresh}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}