/**
 * E2E Test Utilities
 * Helper functions for E2E test setup and data management
 */

import { supabase } from '../../../src/lib/supabase'

/**
 * Generate a unique test email
 */
export function generateTestEmail(prefix = 'test'): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `e2e-${prefix}-${timestamp}-${random}@example.com`
}

/**
 * Generate a unique test business name
 */
export function generateTestBusinessName(): string {
  const timestamp = Date.now()
  return `E2E Test Business ${timestamp}`
}

/**
 * Create a test user in the database
 */
export async function createTestUser(userData: {
  email: string
  full_name: string
  password?: string
  subscription_status?: string
  account_type?: string
}) {
  const {
    email,
    full_name,
    password = 'TestPassword123!',
    subscription_status = 'inactive',
    account_type = 'subscriber'
  } = userData

  try {
    // First, create the auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
          account_type
        }
      }
    })

    if (authError) {
      throw new Error(`Auth user creation failed: ${authError.message}`)
    }

    if (!authData.user) {
      throw new Error('No user returned from auth signup')
    }

    // Then create/update the user profile
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .upsert([{
        uid: authData.user.id,
        email,
        full_name,
        account_type,
        subscription_status,
        created_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (profileError) {
      console.error('Profile creation failed:', profileError)
      // Don't throw here - auth user was created successfully
    }

    return {
      uid: authData.user.id,
      email,
      full_name,
      auth_user: authData.user,
      profile: profileData
    }

  } catch (error) {
    console.error('Test user creation failed:', error)
    throw error
  }
}

/**
 * Create a test business in the database
 */
export async function createTestBusiness(businessData?: Partial<{
  name: string
  email: string
  category: string
  address: string
  city: string
  state: string
}>) {
  const defaultData = {
    name: generateTestBusinessName(),
    email: generateTestEmail('business'),
    contact_name: 'Test Business Owner',
    phone: '555-TEST-BIZ',
    address: '123 Test Business Street',
    city: 'San Francisco',
    state: 'CA',
    zip_code: '94102',
    category: 'Food & Beverage',
    description: 'A test business for E2E testing',
    latitude: 37.7749,
    longitude: -122.4194
  }

  const data = { ...defaultData, ...businessData }

  try {
    const { data: business, error } = await supabase
      .from('businesses')
      .insert([data])
      .select()
      .single()

    if (error) {
      throw new Error(`Business creation failed: ${error.message}`)
    }

    return business
  } catch (error) {
    console.error('Test business creation failed:', error)
    throw error
  }
}

/**
 * Create a test coupon
 */
export async function createTestCoupon(businessUid: string, couponData?: Partial<{
  title: string
  description: string
  discount: string
  usage_limit: string
  active: boolean
}>) {
  const defaultData = {
    title: 'E2E Test Coupon',
    description: 'A test coupon for E2E automation',
    discount: '50% OFF',
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    active: true,
    usage_limit: 'one_time'
  }

  const data = { ...defaultData, ...couponData, business_uid: businessUid }

  try {
    const { data: coupon, error } = await supabase
      .from('coupons')
      .insert([data])
      .select()
      .single()

    if (error) {
      throw new Error(`Coupon creation failed: ${error.message}`)
    }

    return coupon
  } catch (error) {
    console.error('Test coupon creation failed:', error)
    throw error
  }
}

/**
 * Create a test redemption
 */
export async function createTestRedemption(data: {
  user_uid: string
  coupon_uid: string
  business_uid: string
  status?: string
}) {
  const redemptionData = {
    ...data,
    qr_code: `e2e-test-qr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    display_code: `E2E${Date.now().toString().slice(-6)}`,
    status: data.status || 'pending',
    redemption_month: new Date().toISOString().slice(0, 7), // YYYY-MM
    expires_at: new Date(Date.now() + 60 * 1000).toISOString() // 1 minute from now
  }

  try {
    const { data: redemption, error } = await supabase
      .from('redemptions')
      .insert([redemptionData])
      .select()
      .single()

    if (error) {
      throw new Error(`Redemption creation failed: ${error.message}`)
    }

    return redemption
  } catch (error) {
    console.error('Test redemption creation failed:', error)
    throw error
  }
}

/**
 * Clean up test user and related data
 */
export async function cleanupTestUser(userUid: string) {
  try {
    // Delete user's redemptions first (foreign key constraints)
    await supabase.from('redemptions').delete().eq('user_uid', userUid)

    // Delete user profile
    await supabase.from('users').delete().eq('uid', userUid)

    console.log(`Cleaned up test user: ${userUid}`)
  } catch (error) {
    console.error('Test user cleanup failed:', error)
    // Don't throw - cleanup failures shouldn't fail tests
  }
}

/**
 * Clean up test business and related data
 */
export async function cleanupTestBusiness(businessUid: string) {
  try {
    // Delete business redemptions first
    await supabase.from('redemptions').delete().eq('business_uid', businessUid)

    // Delete business coupons
    await supabase.from('coupons').delete().eq('business_uid', businessUid)

    // Delete business
    await supabase.from('businesses').delete().eq('uid', businessUid)

    console.log(`Cleaned up test business: ${businessUid}`)
  } catch (error) {
    console.error('Test business cleanup failed:', error)
  }
}

/**
 * Clean up all test data (use carefully!)
 */
export async function cleanupAllTestData() {
  try {
    // Delete test redemptions
    await supabase.from('redemptions').delete().like('qr_code', '%e2e-test%')

    // Delete test coupons
    await supabase.from('coupons').delete().like('title', '%E2E Test%')

    // Delete test businesses
    await supabase.from('businesses').delete().like('email', '%e2e-%@example.com')

    // Delete test users
    await supabase.from('users').delete().like('email', '%e2e-%@example.com')

    console.log('Cleaned up all test data')
  } catch (error) {
    console.error('Test data cleanup failed:', error)
  }
}

/**
 * Wait for element with custom timeout
 */
export async function waitForElement(page: any, selector: string, timeout = 5000) {
  try {
    await page.waitForSelector(selector, { timeout })
    return true
  } catch (error) {
    console.error(`Element not found: ${selector}`)
    return false
  }
}

/**
 * Take a screenshot with a descriptive name
 */
export async function takeScreenshot(page: any, name: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const filename = `screenshot-${name}-${timestamp}.png`
  
  await page.screenshot({
    path: `test-results/${filename}`,
    fullPage: true
  })
  
  console.log(`Screenshot saved: ${filename}`)
  return filename
}

/**
 * Mock Stripe payment for testing
 */
export async function mockStripePayment(page: any) {
  // This would set up Stripe test mode and mock successful payments
  await page.evaluate(() => {
    // Mock Stripe global object
    window.Stripe = () => ({
      elements: () => ({
        create: () => ({
          mount: () => {},
          unmount: () => {},
          on: () => {}
        })
      }),
      createToken: () => Promise.resolve({ token: { id: 'tok_test_123' } }),
      createPaymentMethod: () => Promise.resolve({ 
        paymentMethod: { id: 'pm_test_123' },
        error: null 
      }),
      confirmCardPayment: () => Promise.resolve({
        paymentIntent: { id: 'pi_test_123', status: 'succeeded' },
        error: null
      })
    })
  })
}

/**
 * Get current timestamp for unique test data
 */
export function getTimestamp(): string {
  return Date.now().toString()
}

/**
 * Generate random test data
 */
export function generateTestData() {
  const timestamp = getTimestamp()
  const random = Math.random().toString(36).substring(2, 8)
  
  return {
    email: `e2e-test-${timestamp}-${random}@example.com`,
    name: `Test User ${timestamp}`,
    phone: `555${timestamp.slice(-7)}`,
    businessName: `Test Business ${timestamp}`,
    couponTitle: `Test Coupon ${timestamp}`
  }
}