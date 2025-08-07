import { useState, useEffect, useMemo } from 'react'
import { useAuthProvider as useAuth } from './use-auth'
import { supabase } from '@/lib/supabase'
import type { Coupon, Business } from '@/types'
import type { CategoryType } from '@/lib/category-icons'

export type CouponFilter = 'all' | 'near-me' | 'newest' | 'expiring' | 'popular'
export type CategoryFilter = 'all' | CategoryType

interface UseCouponsOptions {
  limit?: number
  activeOnly?: boolean
}

interface CouponWithBusiness extends Coupon {
  business: Business
  distance?: number
  redemptionCount?: number
}

export function useCoupons(options: UseCouponsOptions = {}) {
  const { user } = useAuth()
  const { limit = 50, activeOnly = true } = options
  
  const [coupons, setCoupons] = useState<CouponWithBusiness[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<CouponFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch coupons from database
  const fetchCoupons = async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('coupons')
        .select(`
          *,
          business:businesses (*)
        `)

      if (activeOnly) {
        query = query.eq('active', true)
      }

      query = query
        .gte('endDate', new Date().toISOString())
        .order('createdAt', { ascending: false })
        .limit(limit)

      const { data, error: fetchError } = await query

      if (fetchError) {
        throw fetchError
      }

      // PERFORMANCE OPTIMIZATION: Batch fetch redemption counts to eliminate N+1 queries
      let couponUids: string[] = []
      let redemptionCounts: Record<string, number> = {}
      
      if (data && data.length > 0) {
        couponUids = data.map(coupon => coupon.uid)
        
        try {
          // Single batch query for all redemption counts
          const { data: redemptionData } = await supabase
            .from('redemptions')
            .select('couponUid')
            .in('couponUid', couponUids)
            .eq('status', 'redeemed')
          
          // Count redemptions per coupon
          if (redemptionData) {
            redemptionCounts = redemptionData.reduce((acc: Record<string, number>, item) => {
              acc[item.couponUid] = (acc[item.couponUid] || 0) + 1
              return acc
            }, {})
          }
        } catch (error) {
          console.warn('Failed to batch fetch redemption counts:', error)
        }
      }

      // Calculate distances and apply redemption counts
      const couponsWithDistance = (data || []).map((coupon) => {
        let distance: number | undefined
        const redemptionCount = redemptionCounts[coupon.uid] || 0

        // Calculate distance if user has coordinates
        if (user?.latitude && user?.longitude && coupon.business?.latitude && coupon.business?.longitude) {
          distance = calculateDistance(
            user.latitude,
            user.longitude,
            coupon.business.latitude,
            coupon.business.longitude
          )
        }

        return {
          ...coupon,
          distance,
          redemptionCount
        } as CouponWithBusiness
      })

      setCoupons(couponsWithDistance)
    } catch (err) {
      console.error('Error fetching coupons:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch coupons')
    } finally {
      setLoading(false)
    }
  }

  // Filter and sort coupons based on current filters
  const filteredCoupons = useMemo(() => {
    let filtered = [...coupons]

    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (coupon) =>
          coupon.title.toLowerCase().includes(search) ||
          coupon.description.toLowerCase().includes(search) ||
          coupon.business?.name.toLowerCase().includes(search) ||
          coupon.discount.toLowerCase().includes(search)
      )
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(
        (coupon) => coupon.business?.category === categoryFilter
      )
    }

    // Apply main filter and sorting
    switch (filter) {
      case 'near-me':
        if (user?.latitude && user?.longitude) {
          filtered = filtered
            .filter((coupon) => coupon.distance !== undefined)
            .sort((a, b) => (a.distance || 0) - (b.distance || 0))
        }
        break
      
      case 'newest':
        filtered = filtered.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        break
      
      case 'expiring':
        filtered = filtered.sort(
          (a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime()
        )
        break
      
      case 'popular':
        filtered = filtered.sort(
          (a, b) => (b.redemptionCount || 0) - (a.redemptionCount || 0)
        )
        break
      
      default:
        // 'all' - keep current order (newest first from query)
        break
    }

    return filtered
  }, [coupons, filter, categoryFilter, searchTerm, user])

  // Calculate distance between two coordinates in miles
  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3959 // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  // Format distance for display
  function formatDistance(distance: number): string {
    if (distance < 1) {
      return `${(distance * 5280).toFixed(0)} ft`
    }
    return `${distance.toFixed(1)} mi`
  }

  // Check if coupon is expiring soon (within 7 days)
  function isExpiringSoon(endDate: string): boolean {
    const sevenDaysFromNow = new Date()
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
    return new Date(endDate) <= sevenDaysFromNow
  }

  // Get coupon by ID
  async function getCouponById(uid: string): Promise<CouponWithBusiness | null> {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select(`
          *,
          business:businesses (*)
        `)
        .eq('uid', uid)
        .single()

      if (error) throw error
      return data as CouponWithBusiness
    } catch (error) {
      console.error('Error fetching coupon:', error)
      return null
    }
  }

  // Refresh coupons
  const refresh = () => {
    fetchCoupons()
  }

  useEffect(() => {
    fetchCoupons()
  }, [limit, activeOnly, user?.latitude, user?.longitude])

  return {
    coupons: filteredCoupons,
    loading,
    error,
    filter,
    setFilter,
    categoryFilter,
    setCategoryFilter,
    searchTerm,
    setSearchTerm,
    refresh,
    getCouponById,
    formatDistance,
    isExpiringSoon
  }
}