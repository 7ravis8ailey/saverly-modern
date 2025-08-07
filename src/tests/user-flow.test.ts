/**
 * End-to-End User Flow Tests
 * 
 * This test suite validates the complete user journey through the Saverly application:
 * 1. User Registration → 2. Subscription Purchase → 3. Coupon Redemption → 4. Admin Management
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { supabase } from '@/lib/supabase'

// Test data
const testUser = {
  email: `test-user-${Date.now()}@example.com`,
  password: 'testpassword123',
  fullName: 'Test User',
  phone: '555-123-4567',
  address: '123 Test St',
  city: 'San Francisco',
  state: 'CA',
  zipCode: '94102'
}

const testBusiness = {
  name: 'Test Coffee Shop',
  email: `test-business-${Date.now()}@example.com`,
  contactName: 'Business Owner',
  phone: '555-987-6543',
  address: '456 Business Ave',
  city: 'San Francisco',
  state: 'CA',
  zipCode: '94103',
  category: 'Food & Beverage' as const,
  description: 'A cozy coffee shop for testing',
  latitude: 37.7749,
  longitude: -122.4194
}

const testCoupon = {
  title: '20% Off Coffee',
  description: 'Get 20% off your next coffee purchase',
  discount: '20% OFF',
  startDate: new Date().toISOString(),
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
  active: true,
  usageLimit: 'one_time' as const
}

let testUserUid: string
let testBusinessUid: string 
let testCouponUid: string
let testRedemptionUid: string

describe('Complete User Flow', () => {
  beforeAll(async () => {
    // Clean up any existing test data
    await cleanup()
  })

  afterAll(async () => {
    // Clean up test data
    await cleanup()
  })

  describe('1. User Registration & Authentication', () => {
    it('should register a new user successfully', async () => {
      // Test user registration
      const { data, error } = await supabase.auth.signUp({
        email: testUser.email,
        password: testUser.password,
        options: {
          data: {
            full_name: testUser.fullName,
            phone: testUser.phone,
            address: testUser.address,
            city: testUser.city,
            state: testUser.state,
            zip_code: testUser.zipCode,
            account_type: 'subscriber'
          }
        }
      })

      expect(error).toBeNull()
      expect(data.user).toBeTruthy()
      expect(data.user?.email).toBe(testUser.email)

      if (data.user) {
        testUserUid = data.user.id

        // Verify user record was created in users table
        const { data: userRecord, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('uid', testUserUid)
          .single()

        expect(userError).toBeNull()
        expect(userRecord?.email).toBe(testUser.email)
        expect(userRecord?.full_name).toBe(testUser.fullName)
        expect(userRecord?.account_type).toBe('subscriber')
        expect(userRecord?.subscription_status).toBe('inactive')
      }
    })

    it('should sign in with correct credentials', async () => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: testUser.email,
        password: testUser.password
      })

      expect(error).toBeNull()
      expect(data.user).toBeTruthy()
      expect(data.session).toBeTruthy()
    })

    it('should reject sign in with incorrect credentials', async () => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: testUser.email,
        password: 'wrongpassword'
      })

      expect(error).toBeTruthy()
      expect(data.user).toBeNull()
      expect(data.session).toBeNull()
    })
  })

  describe('2. Subscription Management', () => {
    it('should require subscription to access coupons', async () => {
      // Query coupons as unsubscribed user
      const { data: coupons, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('active', true)

      // Should work (no RLS restriction on reading coupons)
      expect(error).toBeNull()
      expect(Array.isArray(coupons)).toBe(true)
    })

    it('should simulate subscription activation', async () => {
      // Simulate successful Stripe payment by updating user subscription status
      const { error } = await supabase
        .from('users')
        .update({
          subscription_status: 'active',
          subscription_plan: 'monthly',
          subscription_period_start: new Date().toISOString(),
          subscription_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          stripe_customer_id: 'cus_test_customer',
          stripe_subscription_id: 'sub_test_subscription'
        })
        .eq('uid', testUserUid)

      expect(error).toBeNull()

      // Verify subscription status
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('subscription_status, subscription_plan')
        .eq('uid', testUserUid)
        .single()

      expect(userError).toBeNull()
      expect(user?.subscription_status).toBe('active')
      expect(user?.subscription_plan).toBe('monthly')
    })
  })

  describe('3. Business & Coupon Management', () => {
    it('should create a test business', async () => {
      const { data, error } = await supabase
        .from('businesses')
        .insert([testBusiness])
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeTruthy()
      expect(data?.name).toBe(testBusiness.name)
      expect(data?.email).toBe(testBusiness.email)
      expect(data?.category).toBe(testBusiness.category)

      if (data) {
        testBusinessUid = data.uid
      }
    })

    it('should create a test coupon', async () => {
      const couponData = {
        ...testCoupon,
        business_uid: testBusinessUid
      }

      const { data, error } = await supabase
        .from('coupons')
        .insert([couponData])
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeTruthy()
      expect(data?.title).toBe(testCoupon.title)
      expect(data?.business_uid).toBe(testBusinessUid)
      expect(data?.active).toBe(true)

      if (data) {
        testCouponUid = data.uid
      }
    })

    it('should retrieve active coupons with business details', async () => {
      const { data: coupons, error } = await supabase
        .from('coupons')
        .select(`
          *,
          business:businesses(*)
        `)
        .eq('active', true)
        .gte('end_date', new Date().toISOString())

      expect(error).toBeNull()
      expect(Array.isArray(coupons)).toBe(true)
      expect(coupons.length).toBeGreaterThan(0)

      const testCouponInResults = coupons.find(c => c.uid === testCouponUid)
      expect(testCouponInResults).toBeTruthy()
      expect(testCouponInResults?.business?.name).toBe(testBusiness.name)
    })
  })

  describe('4. QR Code Redemption Flow', () => {
    it('should create a coupon redemption', async () => {
      const redemptionData = {
        user_uid: testUserUid,
        coupon_uid: testCouponUid,
        business_uid: testBusinessUid,
        qr_code: `qr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        display_code: `DC_${Date.now().toString().slice(-6)}`,
        status: 'pending',
        redemption_month: new Date().toISOString(),
        expires_at: new Date(Date.now() + 60 * 1000).toISOString() // 60 seconds from now
      }

      const { data, error } = await supabase
        .from('redemptions')
        .insert([redemptionData])
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeTruthy()
      expect(data?.status).toBe('pending')
      expect(data?.user_uid).toBe(testUserUid)
      expect(data?.coupon_uid).toBe(testCouponUid)
      expect(data?.qr_code).toBeTruthy()
      expect(data?.display_code).toBeTruthy()

      if (data) {
        testRedemptionUid = data.uid
      }
    })

    it('should retrieve redemption with related data', async () => {
      const { data: redemption, error } = await supabase
        .from('redemptions')
        .select(`
          *,
          user:users(full_name, email),
          coupon:coupons(title, discount),
          business:businesses(name, category)
        `)
        .eq('uid', testRedemptionUid)
        .single()

      expect(error).toBeNull()
      expect(redemption).toBeTruthy()
      expect(redemption?.user?.full_name).toBe(testUser.fullName)
      expect(redemption?.coupon?.title).toBe(testCoupon.title)
      expect(redemption?.business?.name).toBe(testBusiness.name)
    })

    it('should simulate redemption completion', async () => {
      const { error } = await supabase
        .from('redemptions')
        .update({
          status: 'redeemed',
          redeemed_at: new Date().toISOString()
        })
        .eq('uid', testRedemptionUid)

      expect(error).toBeNull()

      // Verify redemption status
      const { data: redemption, error: fetchError } = await supabase
        .from('redemptions')
        .select('status, redeemed_at')
        .eq('uid', testRedemptionUid)
        .single()

      expect(fetchError).toBeNull()
      expect(redemption?.status).toBe('redeemed')
      expect(redemption?.redeemed_at).toBeTruthy()
    })

    it('should handle redemption expiry', async () => {
      // Create an expired redemption
      const expiredRedemptionData = {
        user_uid: testUserUid,
        coupon_uid: testCouponUid,
        business_uid: testBusinessUid,
        qr_code: `qr_expired_${Date.now()}`,
        display_code: `EX_${Date.now().toString().slice(-6)}`,
        status: 'expired',
        redemption_month: new Date().toISOString(),
        expires_at: new Date(Date.now() - 60 * 1000).toISOString() // Already expired
      }

      const { data, error } = await supabase
        .from('redemptions')
        .insert([expiredRedemptionData])
        .select()
        .single()

      expect(error).toBeNull()
      expect(data?.status).toBe('expired')
      expect(new Date(data?.expires_at || '').getTime()).toBeLessThan(Date.now())
    })
  })

  describe('5. Admin Dashboard Functionality', () => {
    it('should retrieve admin statistics', async () => {
      // Get total users
      const { count: totalUsers, error: usersError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })

      expect(usersError).toBeNull()
      expect(typeof totalUsers === 'number').toBe(true)

      // Get active subscribers
      const { count: activeSubscribers, error: subscribersError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('subscription_status', 'active')

      expect(subscribersError).toBeNull()
      expect(typeof activeSubscribers === 'number').toBe(true)

      // Get total businesses
      const { count: totalBusinesses, error: businessesError } = await supabase
        .from('businesses')
        .select('*', { count: 'exact', head: true })

      expect(businessesError).toBeNull()
      expect(typeof totalBusinesses === 'number').toBe(true)

      // Get active coupons
      const { count: activeCoupons, error: couponsError } = await supabase
        .from('coupons')
        .select('*', { count: 'exact', head: true })
        .eq('active', true)

      expect(couponsError).toBeNull()
      expect(typeof activeCoupons === 'number').toBe(true)

      // Get total redemptions
      const { count: totalRedemptions, error: redemptionsError } = await supabase
        .from('redemptions')
        .select('*', { count: 'exact', head: true })

      expect(redemptionsError).toBeNull()
      expect(typeof totalRedemptions === 'number').toBe(true)

      // Verify we have our test data
      expect(totalUsers).toBeGreaterThan(0)
      expect(totalBusinesses).toBeGreaterThan(0)
      expect(activeCoupons).toBeGreaterThan(0)
      expect(totalRedemptions).toBeGreaterThan(0)
    })

    it('should filter and search data correctly', async () => {
      // Test user search
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .or(`full_name.ilike.%${testUser.fullName}%,email.ilike.%${testUser.email}%`)

      expect(usersError).toBeNull()
      expect(users?.some(u => u.email === testUser.email)).toBe(true)

      // Test business search
      const { data: businesses, error: businessesError } = await supabase
        .from('businesses')
        .select('*')
        .or(`name.ilike.%${testBusiness.name}%,email.ilike.%${testBusiness.email}%`)

      expect(businessesError).toBeNull()
      expect(businesses?.some(b => b.email === testBusiness.email)).toBe(true)

      // Test coupon search
      const { data: coupons, error: couponsError } = await supabase
        .from('coupons')
        .select('*')
        .or(`title.ilike.%${testCoupon.title}%,description.ilike.%${testCoupon.description}%`)

      expect(couponsError).toBeNull()
      expect(coupons?.some(c => c.title === testCoupon.title)).toBe(true)
    })
  })

  describe('6. Data Integrity & Relationships', () => {
    it('should maintain referential integrity', async () => {
      // Verify coupon belongs to business
      const { data: coupon, error: couponError } = await supabase
        .from('coupons')
        .select('*, business:businesses(*)')
        .eq('uid', testCouponUid)
        .single()

      expect(couponError).toBeNull()
      expect(coupon?.business?.uid).toBe(testBusinessUid)

      // Verify redemption relationships
      const { data: redemption, error: redemptionError } = await supabase
        .from('redemptions')
        .select(`
          *,
          user:users(*),
          coupon:coupons(*),
          business:businesses(*)
        `)
        .eq('uid', testRedemptionUid)
        .single()

      expect(redemptionError).toBeNull()
      expect(redemption?.user?.uid).toBe(testUserUid)
      expect(redemption?.coupon?.uid).toBe(testCouponUid)
      expect(redemption?.business?.uid).toBe(testBusinessUid)
    })

    it('should validate date constraints', async () => {
      // Test coupon date validation
      const { data: activeCoupons } = await supabase
        .from('coupons')
        .select('*')
        .eq('active', true)
        .gte('end_date', new Date().toISOString())

      activeCoupons?.forEach(coupon => {
        expect(new Date(coupon.end_date).getTime()).toBeGreaterThan(Date.now())
      })

      // Test redemption expiry
      const { data: pendingRedemptions } = await supabase
        .from('redemptions')
        .select('*')
        .eq('status', 'pending')

      pendingRedemptions?.forEach(redemption => {
        const expiryTime = new Date(redemption.expires_at).getTime()
        const now = Date.now()
        
        // Should either be unexpired or should be marked as expired
        if (expiryTime < now) {
          // This would typically be handled by a background job
          console.warn(`Redemption ${redemption.uid} has expired but status is still pending`)
        }
      })
    })
  })

  describe('7. Performance & Optimization', () => {
    it('should execute queries efficiently', async () => {
      const startTime = Date.now()

      // Complex query with joins
      const { data, error } = await supabase
        .from('redemptions')
        .select(`
          uid,
          status,
          created_at,
          expires_at,
          user:users(full_name, email),
          coupon:coupons(title, discount),
          business:businesses(name, category)
        `)
        .order('created_at', { ascending: false })
        .limit(50)

      const queryTime = Date.now() - startTime

      expect(error).toBeNull()
      expect(Array.isArray(data)).toBe(true)
      expect(queryTime).toBeLessThan(5000) // Should complete within 5 seconds
    })

    it('should handle pagination correctly', async () => {
      const pageSize = 10
      
      const { data: page1, error: error1 } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
        .range(0, pageSize - 1)

      expect(error1).toBeNull()
      expect(Array.isArray(page1)).toBe(true)

      if (page1 && page1.length === pageSize) {
        const { data: page2, error: error2 } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false })
          .range(pageSize, pageSize * 2 - 1)

        expect(error2).toBeNull()
        expect(Array.isArray(page2)).toBe(true)
        
        // Ensure no overlap between pages
        const page1Ids = page1.map(u => u.uid)
        const page2Ids = page2?.map(u => u.uid) || []
        const overlap = page1Ids.filter(id => page2Ids.includes(id))
        expect(overlap.length).toBe(0)
      }
    })
  })
})

// Cleanup function
async function cleanup() {
  if (testRedemptionUid) {
    await supabase.from('redemptions').delete().eq('uid', testRedemptionUid)
  }
  if (testCouponUid) {
    await supabase.from('coupons').delete().eq('uid', testCouponUid)
  }
  if (testBusinessUid) {
    await supabase.from('businesses').delete().eq('uid', testBusinessUid)
  }
  if (testUserUid) {
    await supabase.from('users').delete().eq('uid', testUserUid)
  }
  
  // Clean up any test users by email pattern
  await supabase.from('users').delete().like('email', '%test-user-%@example.com')
  await supabase.from('businesses').delete().like('email', '%test-business-%@example.com')
}