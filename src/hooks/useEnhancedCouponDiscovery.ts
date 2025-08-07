/**
 * Enhanced Coupon Discovery Hook
 * Advanced filtering and business search for active subscribers
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuthProvider } from './use-auth';
import { useSubscriptionStatus } from './useSubscriptionStatus';
import { api } from '@/lib/supabase-api';
import type { Coupon, Business } from '@/types';
import type { CategoryType } from '@/lib/category-icons';

export type AdvancedCouponFilter = 
  | 'all' 
  | 'near-me' 
  | 'newest' 
  | 'expiring' 
  | 'popular' 
  | 'featured'
  | 'distance-5mi'
  | 'distance-10mi'
  | 'distance-25mi';

export type SortOption = 
  | 'relevance' 
  | 'distance' 
  | 'newest' 
  | 'expiring' 
  | 'popularity' 
  | 'savings';

export interface CouponWithBusiness extends Coupon {
  business: Business;
  distance?: number;
  redemptionCount?: number;
  savingsAmount?: number;
  isNew?: boolean;
  isFeatured?: boolean;
}

export interface BusinessSearchResult {
  business: Business;
  couponsCount: number;
  activeCoupons: CouponWithBusiness[];
  distance?: number;
}

export interface CouponFilters {
  filter: AdvancedCouponFilter;
  categoryFilter: CategoryFilter;
  sortBy: SortOption;
  searchTerm: string;
  businessSearch: string;
  priceRange: [number, number];
  radiusInMiles: number;
  showExpiringSoon: boolean;
  showNewOnly: boolean;
  showFeaturedOnly: boolean;
}

export type CategoryFilter = 'all' | CategoryType;

const DEFAULT_FILTERS: CouponFilters = {
  filter: 'all',
  categoryFilter: 'all',
  sortBy: 'relevance',
  searchTerm: '',
  businessSearch: '',
  priceRange: [0, 1000],
  radiusInMiles: 25,
  showExpiringSoon: false,
  showNewOnly: false,
  showFeaturedOnly: false
};

export function useEnhancedCouponDiscovery() {
  const { user, profile } = useAuthProvider();
  const { subscriptionStatus } = useSubscriptionStatus();
  
  // State management
  const [coupons, setCoupons] = useState<CouponWithBusiness[]>([]);
  const [businessResults, setBusinessResults] = useState<BusinessSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [businessSearchLoading, setBusinessSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<CouponFilters>(DEFAULT_FILTERS);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  // Premium feature access
  const hasAdvancedFilters = subscriptionStatus.isActive;
  const canUseBusinessSearch = subscriptionStatus.isActive;
  const canUseGeolocation = subscriptionStatus.isActive;

  // Get user location for geolocation features
  useEffect(() => {
    if (!canUseGeolocation) return;

    if (profile?.latitude && profile?.longitude) {
      setUserLocation({ lat: profile.latitude, lng: profile.longitude });
      return;
    }

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.warn('Geolocation error:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    }
  }, [canUseGeolocation, profile]);

  // Fetch coupons with enhanced query
  const fetchCoupons = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = api.supabase
        .from('coupons')
        .select(`
          *,
          business:businesses (
            id, name, category, email, formatted_address, 
            city, state, latitude, longitude, active,
            contact_name, phone
          )
        `);

      // Base filters
      query = query
        .eq('active', true)
        .gte('end_date', new Date().toISOString())
        .order('created_at', { ascending: false });

      // Apply premium filters if available
      if (hasAdvancedFilters) {
        // Distance-based filtering
        if (userLocation && filters.filter.startsWith('distance-')) {
          const radiusMiles = parseInt(filters.filter.replace('distance-', '').replace('mi', ''));
          // Note: This is a simplified approach. For production, consider PostGIS for accurate geo queries
          const latRange = radiusMiles / 69.0; // Rough miles to degrees conversion
          const lngRange = radiusMiles / (69.0 * Math.cos(userLocation.lat * Math.PI / 180));
          
          query = query
            .gte('business.latitude', userLocation.lat - latRange)
            .lte('business.latitude', userLocation.lat + latRange)
            .gte('business.longitude', userLocation.lng - lngRange)
            .lte('business.longitude', userLocation.lng + lngRange);
        }

        // Featured coupons filter
        if (filters.showFeaturedOnly) {
          query = query.eq('featured', true);
        }

        // New coupons filter (last 7 days)
        if (filters.showNewOnly) {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          query = query.gte('created_at', sevenDaysAgo.toISOString());
        }
      }

      const { data, error: fetchError } = await query.limit(100);

      if (fetchError) throw fetchError;

      // Enhanced data processing
      const enhancedCoupons = await processEnhancedCoupons(data || []);
      setCoupons(enhancedCoupons);

    } catch (err) {
      console.error('Error fetching coupons:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch coupons');
    } finally {
      setLoading(false);
    }
  }, [hasAdvancedFilters, userLocation, filters, api.supabase]);

  // Process coupons with enhanced data
  const processEnhancedCoupons = async (rawCoupons: any[]): Promise<CouponWithBusiness[]> => {
    // Batch fetch redemption counts
    const couponIds = rawCoupons.map(c => c.id);
    const redemptionCounts: Record<string, number> = {};

    if (couponIds.length > 0) {
      try {
        const { data: redemptions } = await api.supabase
          .from('coupon_redemptions')
          .select('coupon_id')
          .in('coupon_id', couponIds);

        if (redemptions) {
          redemptions.forEach(r => {
            redemptionCounts[r.coupon_id] = (redemptionCounts[r.coupon_id] || 0) + 1;
          });
        }
      } catch (error) {
        console.warn('Failed to fetch redemption counts:', error);
      }
    }

    return rawCoupons.map(coupon => {
      const distance = userLocation && coupon.business?.latitude && coupon.business?.longitude
        ? calculateDistance(
            userLocation.lat,
            userLocation.lng,
            coupon.business.latitude,
            coupon.business.longitude
          )
        : undefined;

      const redemptionCount = redemptionCounts[coupon.id] || 0;
      const savingsAmount = calculateSavingsAmount(coupon);
      const isNew = isWithinDays(coupon.created_at, 7);
      const isFeatured = coupon.featured || false;

      return {
        ...coupon,
        distance,
        redemptionCount,
        savingsAmount,
        isNew,
        isFeatured
      } as CouponWithBusiness;
    });
  };

  // Business search functionality
  const searchBusinesses = useCallback(async (searchTerm: string) => {
    if (!canUseBusinessSearch || !searchTerm.trim()) {
      setBusinessResults([]);
      return;
    }

    setBusinessSearchLoading(true);

    try {
      // Search businesses
      const { data: businesses, error: businessError } = await api.supabase
        .from('businesses')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%`)
        .eq('active', true)
        .limit(20);

      if (businessError) throw businessError;

      // Get coupons for each business
      const businessResults: BusinessSearchResult[] = [];

      for (const business of businesses || []) {
        const { data: businessCoupons, error: couponsError } = await api.supabase
          .from('coupons')
          .select('*')
          .eq('business_id', business.id)
          .eq('active', true)
          .gte('end_date', new Date().toISOString());

        if (!couponsError) {
          const enhancedCoupons = businessCoupons.map(coupon => ({
            ...coupon,
            business,
            distance: userLocation && business.latitude && business.longitude
              ? calculateDistance(userLocation.lat, userLocation.lng, business.latitude, business.longitude)
              : undefined,
            savingsAmount: calculateSavingsAmount(coupon),
            isNew: isWithinDays(coupon.created_at, 7),
            isFeatured: coupon.featured || false
          })) as CouponWithBusiness[];

          businessResults.push({
            business,
            couponsCount: businessCoupons.length,
            activeCoupons: enhancedCoupons,
            distance: userLocation && business.latitude && business.longitude
              ? calculateDistance(userLocation.lat, userLocation.lng, business.latitude, business.longitude)
              : undefined
          });
        }
      }

      // Sort by distance if available, otherwise by coupon count
      businessResults.sort((a, b) => {
        if (a.distance !== undefined && b.distance !== undefined) {
          return a.distance - b.distance;
        }
        return b.couponsCount - a.couponsCount;
      });

      setBusinessResults(businessResults);

    } catch (error) {
      console.error('Business search error:', error);
    } finally {
      setBusinessSearchLoading(false);
    }
  }, [canUseBusinessSearch, userLocation, api.supabase]);

  // Advanced filtering and sorting
  const filteredAndSortedCoupons = useMemo(() => {
    let filtered = [...coupons];

    // Apply search filter
    if (filters.searchTerm.trim()) {
      const search = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(coupon =>
        coupon.title.toLowerCase().includes(search) ||
        coupon.description.toLowerCase().includes(search) ||
        coupon.business?.name.toLowerCase().includes(search) ||
        coupon.discount_text.toLowerCase().includes(search) ||
        coupon.business?.category.toLowerCase().includes(search)
      );
    }

    // Apply category filter
    if (filters.categoryFilter !== 'all') {
      filtered = filtered.filter(coupon => 
        coupon.business?.category === filters.categoryFilter
      );
    }

    // Apply premium filters
    if (hasAdvancedFilters) {
      // Distance filter
      if (filters.filter === 'near-me' && userLocation) {
        filtered = filtered.filter(coupon => coupon.distance !== undefined && coupon.distance <= filters.radiusInMiles);
      }

      // Price range filter
      if (filters.priceRange[0] > 0 || filters.priceRange[1] < 1000) {
        filtered = filtered.filter(coupon => {
          const savings = coupon.savingsAmount || 0;
          return savings >= filters.priceRange[0] && savings <= filters.priceRange[1];
        });
      }

      // Expiring soon filter
      if (filters.showExpiringSoon) {
        filtered = filtered.filter(coupon => isExpiringSoon(coupon.end_date));
      }

      // New coupons filter
      if (filters.showNewOnly) {
        filtered = filtered.filter(coupon => coupon.isNew);
      }

      // Featured filter
      if (filters.showFeaturedOnly) {
        filtered = filtered.filter(coupon => coupon.isFeatured);
      }
    }

    // Apply sorting
    switch (filters.sortBy) {
      case 'distance':
        if (userLocation) {
          filtered.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
        }
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'expiring':
        filtered.sort((a, b) => new Date(a.end_date).getTime() - new Date(b.end_date).getTime());
        break;
      case 'popularity':
        filtered.sort((a, b) => (b.redemptionCount || 0) - (a.redemptionCount || 0));
        break;
      case 'savings':
        filtered.sort((a, b) => (b.savingsAmount || 0) - (a.savingsAmount || 0));
        break;
      default:
        // relevance - keep current order with featured first
        filtered.sort((a, b) => {
          if (a.isFeatured && !b.isFeatured) return -1;
          if (!a.isFeatured && b.isFeatured) return 1;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        break;
    }

    return filtered;
  }, [coupons, filters, hasAdvancedFilters, userLocation]);

  // Helper functions
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const calculateSavingsAmount = (coupon: any): number => {
    if (coupon.discount_type === 'percentage' && coupon.discount_value) {
      // Estimate savings based on average purchase of $50
      const avgPurchase = coupon.minimum_purchase || 50;
      const savings = avgPurchase * (coupon.discount_value / 100);
      return coupon.maximum_discount ? Math.min(savings, coupon.maximum_discount) : savings;
    } else if (coupon.discount_type === 'fixed_amount' && coupon.discount_value) {
      return coupon.discount_value;
    }
    return 0;
  };

  const isWithinDays = (dateString: string, days: number): boolean => {
    const date = new Date(dateString);
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - days);
    return date >= daysAgo;
  };

  const isExpiringSoon = (endDate: string): boolean => {
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    return new Date(endDate) <= sevenDaysFromNow;
  };

  const formatDistance = (distance: number): string => {
    if (distance < 1) {
      return `${(distance * 5280).toFixed(0)} ft`;
    }
    return `${distance.toFixed(1)} mi`;
  };

  // Filter update functions
  const updateFilter = (key: keyof CouponFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setBusinessResults([]);
  };

  // Debounced business search
  useEffect(() => {
    if (!filters.businessSearch.trim()) {
      setBusinessResults([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      searchBusinesses(filters.businessSearch);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [filters.businessSearch, searchBusinesses]);

  // Fetch coupons when filters change
  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  return {
    // Data
    coupons: filteredAndSortedCoupons,
    businessResults,
    loading,
    businessSearchLoading,
    error,
    userLocation,

    // Filters
    filters,
    updateFilter,
    resetFilters,

    // Capabilities
    hasAdvancedFilters,
    canUseBusinessSearch,
    canUseGeolocation,

    // Actions
    refresh: fetchCoupons,
    searchBusinesses,

    // Utilities
    formatDistance,
    isExpiringSoon,
    calculateDistance
  };
}