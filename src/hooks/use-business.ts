import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Business, CreateBusinessForm } from '@/types'
import { useAuthProvider as useAuth } from './use-auth'

interface BusinessHookReturn {
  businesses: Business[]
  currentBusiness: Business | null
  loading: boolean
  error: string | null
  createBusiness: (businessData: CreateBusinessForm) => Promise<{ data?: Business; error?: string }>
  updateBusiness: (uid: string, updates: Partial<Business>) => Promise<{ error?: string }>
  deleteBusiness: (uid: string) => Promise<{ error?: string }>
  fetchBusinessById: (uid: string) => Promise<{ data?: Business; error?: string }>
  fetchUserBusinesses: (ownerUid: string) => Promise<{ data?: Business[]; error?: string }>
  fetchBusinessesByCategory: (category: string) => Promise<{ data?: Business[]; error?: string }>
  searchBusinesses: (searchTerm: string, userLat?: number, userLng?: number) => Promise<{ data?: Business[]; error?: string }>
  verifyBusiness: (uid: string, isVerified: boolean) => Promise<{ error?: string }>
  refreshBusinesses: () => Promise<void>
}

export function useBusiness(): BusinessHookReturn {
  const { user } = useAuth()
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [currentBusiness, setCurrentBusiness] = useState<Business | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch all businesses (for admin/general use)
  const fetchBusinesses = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setBusinesses(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Fetch business by ID
  const fetchBusinessById = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('uid', uid)
        .single()

      if (error) throw error
      return { data }
    } catch (err: any) {
      return { error: err.message }
    }
  }

  // Fetch businesses owned by a specific user
  const fetchUserBusinesses = async (ownerUid: string) => {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_uid', ownerUid)
        .order('created_at', { ascending: false })

      if (error) throw error
      return { data }
    } catch (err: any) {
      return { error: err.message }
    }
  }

  // Fetch businesses by category
  const fetchBusinessesByCategory = async (category: string) => {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('category', category)
        .eq('is_active', true)
        .eq('is_verified', true)
        .order('avg_rating', { ascending: false })

      if (error) throw error
      return { data }
    } catch (err: any) {
      return { error: err.message }
    }
  }

  // Search businesses with optional location-based sorting
  const searchBusinesses = async (searchTerm: string, userLat?: number, userLng?: number) => {
    try {
      let query = supabase
        .from('businesses')
        .select('*')
        .eq('is_active', true)
        .eq('is_verified', true)

      // Add text search
      if (searchTerm.trim()) {
        query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`)
      }

      const { data, error } = await query.order('avg_rating', { ascending: false })

      if (error) throw error

      // If user location provided, calculate distances and sort by proximity
      if (userLat && userLng && data) {
        const businessesWithDistance = data.map(business => ({
          ...business,
          distance: calculateDistance(userLat, userLng, business.latitude, business.longitude)
        }))

        businessesWithDistance.sort((a, b) => a.distance - b.distance)
        return { data: businessesWithDistance }
      }

      return { data }
    } catch (err: any) {
      return { error: err.message }
    }
  }

  // Create new business
  const createBusiness = async (businessData: CreateBusinessForm) => {
    try {
      if (!user) throw new Error('User must be logged in to create a business')

      const newBusiness = {
        owner_uid: user.uid,
        name: businessData.name,
        description: businessData.description,
        category: businessData.category,
        address: businessData.address,
        city: businessData.city,
        state: businessData.state,
        zip_code: businessData.zipCode,
        latitude: businessData.latitude,
        longitude: businessData.longitude,
        phone: businessData.phone,
        email: businessData.email,
        contact_name: businessData.contactName,
        is_verified: false, // Business starts unverified
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('businesses')
        .insert([newBusiness])
        .select()
        .single()

      if (error) throw error

      // Update local state
      setBusinesses(prev => [data, ...prev])
      setCurrentBusiness(data)

      return { data }
    } catch (err: any) {
      return { error: err.message }
    }
  }

  // Update business
  const updateBusiness = async (uid: string, updates: Partial<Business>) => {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('uid', uid)
        .select()
        .single()

      if (error) throw error

      // Update local state
      setBusinesses(prev => 
        prev.map(business => 
          business.uid === uid ? { ...business, ...updates } : business
        )
      )

      if (currentBusiness?.uid === uid) {
        setCurrentBusiness(prev => prev ? { ...prev, ...updates } : null)
      }

      return {}
    } catch (err: any) {
      return { error: err.message }
    }
  }

  // Delete business
  const deleteBusiness = async (uid: string) => {
    try {
      const { error } = await supabase
        .from('businesses')
        .delete()
        .eq('uid', uid)

      if (error) throw error

      // Update local state
      setBusinesses(prev => prev.filter(business => business.uid !== uid))
      
      if (currentBusiness?.uid === uid) {
        setCurrentBusiness(null)
      }

      return {}
    } catch (err: any) {
      return { error: err.message }
    }
  }

  // Verify business (admin only)
  const verifyBusiness = async (uid: string, isVerified: boolean) => {
    try {
      if (!user?.isAdmin) throw new Error('Only administrators can verify businesses')

      const { error } = await supabase
        .from('businesses')
        .update({ 
          is_verified: isVerified,
          updated_at: new Date().toISOString()
        })
        .eq('uid', uid)

      if (error) throw error

      // Update local state
      setBusinesses(prev => 
        prev.map(business => 
          business.uid === uid ? { ...business, is_verified: isVerified } : business
        )
      )

      return {}
    } catch (err: any) {
      return { error: err.message }
    }
  }

  // Refresh businesses list
  const refreshBusinesses = async () => {
    await fetchBusinesses()
  }

  // Load businesses on mount
  useEffect(() => {
    fetchBusinesses()
  }, [])

  // Load user's businesses if they're logged in
  useEffect(() => {
    if (user && user.accountType === 'business') {
      fetchUserBusinesses(user.uid).then(({ data }) => {
        if (data && data.length > 0) {
          setCurrentBusiness(data[0]) // Set first business as current
        }
      })
    }
  }, [user])

  return {
    businesses,
    currentBusiness,
    loading,
    error,
    createBusiness,
    updateBusiness,
    deleteBusiness,
    fetchBusinessById,
    fetchUserBusinesses,
    fetchBusinessesByCategory,
    searchBusinesses,
    verifyBusiness,
    refreshBusinesses
  }
}

// Helper function to calculate distance between two points
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959 // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}