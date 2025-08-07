/**
 * Complete API Integration Flow Tests
 * Tests end-to-end user flows with API integrations
 * Covers Google Maps, Supabase, and Stripe integrations
 */

import { test, expect, Page } from '@playwright/test'
import { 
  generateTestEmail, 
  generateTestBusinessName,
  createTestUser, 
  createTestBusiness,
  createTestCoupon,
  cleanupTestUser, 
  cleanupTestBusiness,
  mockStripePayment,
  takeScreenshot
} from './utils/test-helpers'

test.describe('Complete API Integration Flows', () => {
  let testUserEmail: string
  let testUserId: string
  let testBusinessId: string
  
  test.beforeEach(async () => {
    testUserEmail = generateTestEmail('api-flow')
  })

  test.afterEach(async () => {
    // Cleanup test data
    if (testUserId) {
      await cleanupTestUser(testUserId)
    }
    if (testBusinessId) {
      await cleanupTestBusiness(testBusinessId)
    }
  })

  test('Flow 1: Complete User Registration with Address Autocomplete → Supabase Storage', async ({ page }) => {
    await test.step('Navigate to registration', async () => {
      await page.goto('/register')
      await expect(page).toHaveTitle(/Saverly/)
    })

    await test.step('Fill basic registration details', async () => {
      await page.getByLabel(/full name/i).fill('API Test User')
      await page.getByLabel(/email/i).fill(testUserEmail)
      await page.getByLabel(/password/i).fill('TestPassword123!')
      await page.getByLabel(/phone/i).fill('555-API-TEST')
    })

    await test.step('Test address autocomplete with 3-character trigger', async () => {
      const addressInput = page.getByLabel(/address/i)
      await addressInput.click()
      
      // Test 3-character minimum trigger
      await addressInput.fill('12')
      await page.waitForTimeout(500) // Wait for debounce
      await expect(page.locator('[data-testid="address-suggestions"]')).not.toBeVisible()
      
      // Now trigger with 3+ characters
      await addressInput.fill('123 Main')
      await page.waitForSelector('[data-testid="address-suggestions"]', { timeout: 5000 })
      await expect(page.locator('[data-testid="address-suggestion"]').first()).toBeVisible()
      
      // Test forced selection requirement
      await addressInput.fill('123 Main Street, Custom Address')
      await page.getByRole('button', { name: /create account/i }).click()
      
      // Should show validation error requiring address selection
      await expect(page.getByText(/please select an address from suggestions/i)).toBeVisible()
    })

    await test.step('Select address from Google Maps suggestions', async () => {
      const addressInput = page.getByLabel(/address/i)
      await addressInput.clear()
      await addressInput.fill('123 Main')
      
      await page.waitForSelector('[data-testid="address-suggestion"]', { timeout: 5000 })
      const firstSuggestion = page.getByTestId('address-suggestion').first()
      await expect(firstSuggestion).toBeVisible()
      
      // Click to select the suggestion
      await firstSuggestion.click()
      
      // Verify address is populated and marked as selected
      await expect(addressInput).not.toHaveValue('')
      await expect(page.locator('[data-address-selected="true"]')).toBeVisible()
    })

    await test.step('Submit registration and verify Supabase storage', async () => {
      await page.getByRole('button', { name: /create account/i }).click()
      
      // Wait for successful registration
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 })
      await expect(page.getByText(/welcome/i)).toBeVisible()
      
      // Verify user data was stored in Supabase
      await page.evaluate(async (email) => {
        const response = await fetch('/api/user/profile', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth-token')}` }
        })
        const userData = await response.json()
        
        // Verify address data is stored with Google Maps validation
        if (!userData.address || !userData.latitude || !userData.longitude) {
          throw new Error('Address data not properly stored in Supabase')
        }
        
        return userData
      }, testUserEmail)
    })
  })

  test('Flow 2: Subscription Purchase → Stripe → Supabase Status Update', async ({ page }) => {
    // Create test user first
    const userData = await createTestUser({
      email: testUserEmail,
      full_name: 'Subscription Test User'
    })
    testUserId = userData.uid

    await test.step('Login as test user', async () => {
      await page.goto('/login')
      await page.getByLabel(/email/i).fill(testUserEmail)
      await page.getByLabel(/password/i).fill('TestPassword123!')
      await page.getByRole('button', { name: /sign in/i }).click()
      
      await expect(page).toHaveURL(/\/dashboard/)
    })

    await test.step('Navigate to subscription page', async () => {
      // Should show upgrade prompt for free user
      await expect(page.getByText(/upgrade to premium/i)).toBeVisible()
      
      await page.getByRole('button', { name: /upgrade/i }).click()
      await expect(page.getByTestId('subscription-dialog')).toBeVisible()
    })

    await test.step('Select subscription plan', async () => {
      // Select monthly plan
      await page.getByTestId('monthly-plan').click()
      await expect(page.getByTestId('monthly-plan')).toHaveClass(/selected/)
      
      // Verify pricing display
      await expect(page.getByText(/\$4\.99.*month/i)).toBeVisible()
    })

    await test.step('Setup Stripe payment mock and fill form', async () => {
      // Mock Stripe for testing environment
      await mockStripePayment(page)
      
      await page.getByLabel(/cardholder name/i).fill('API Test User')
      await page.getByLabel(/email/i).fill(testUserEmail)
      
      // Fill Stripe elements (in test environment, these will be mocked)
      const cardFrame = page.frameLocator('iframe[name*="__privateStripeFrame"]')
      if (await cardFrame.locator('input').first().isVisible({ timeout: 2000 })) {
        await cardFrame.getByPlaceholder('1234 1234 1234 1234').fill('4242424242424242')
        await cardFrame.getByPlaceholder('MM / YY').fill('12/25')
        await cardFrame.getByPlaceholder('CVC').fill('123')
      }
    })

    await test.step('Submit payment and verify Stripe → Supabase integration', async () => {
      await page.getByRole('button', { name: /subscribe now/i }).click()
      
      // Wait for payment processing
      await expect(page.getByText(/processing payment/i)).toBeVisible()
      
      // Verify successful payment and subscription activation
      await expect(page.getByText(/subscription active/i)).toBeVisible({ timeout: 20000 })
      
      // Verify Supabase subscription status was updated
      await page.evaluate(async () => {
        const response = await fetch('/api/user/subscription', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth-token')}` }
        })
        const subscriptionData = await response.json()
        
        if (subscriptionData.status !== 'active') {
          throw new Error('Subscription status not updated in Supabase')
        }
        
        if (!subscriptionData.stripe_subscription_id) {
          throw new Error('Stripe subscription ID not stored in Supabase')
        }
        
        return subscriptionData
      })
    })

    await test.step('Verify user access level changes', async () => {
      // Refresh page and verify premium features are accessible
      await page.reload()
      await expect(page.getByText(/premium member/i)).toBeVisible()
      
      // Navigate to coupons page (should now be accessible)
      await page.getByRole('link', { name: /coupons/i }).click()
      await expect(page).toHaveURL(/\/coupons/)
      
      // Verify coupons are visible (premium feature)
      await expect(page.getByTestId('coupon-grid')).toBeVisible()
    })
  })

  test('Flow 3: Business Registration → Google Maps Validation → Supabase Storage', async ({ page }) => {
    await test.step('Navigate to business registration', async () => {
      await page.goto('/business/register')
      await expect(page.getByText(/register your business/i)).toBeVisible()
    })

    await test.step('Fill business basic information', async () => {
      await page.getByLabel(/business name/i).fill(generateTestBusinessName())
      await page.getByLabel(/contact name/i).fill('Business Owner Test')
      await page.getByLabel(/email/i).fill(generateTestEmail('business'))
      await page.getByLabel(/phone/i).fill('555-BIZ-TEST')
      await page.getByLabel(/category/i).selectOption('Food & Beverage')
    })

    await test.step('Test Google Maps address validation', async () => {
      const businessAddressInput = page.getByLabel(/business address/i)
      await businessAddressInput.fill('456 Business')
      
      // Wait for Google Maps suggestions
      await page.waitForSelector('[data-testid="business-address-suggestions"]', { timeout: 5000 })
      
      // Select valid business address
      await page.getByTestId('business-address-suggestion').first().click()
      
      // Verify coordinates are captured
      await expect(page.locator('[data-coordinates-captured="true"]')).toBeVisible()
    })

    await test.step('Complete business registration', async () => {
      await page.getByLabel(/description/i).fill('A test business for API integration testing')
      
      // Set business hours
      await page.getByTestId('hours-monday').check()
      await page.getByTestId('open-time-monday').fill('09:00')
      await page.getByTestId('close-time-monday').fill('17:00')
      
      await page.getByRole('button', { name: /register business/i }).click()
    })

    await test.step('Verify business data storage in Supabase', async () => {
      await expect(page.getByText(/business registered successfully/i)).toBeVisible({ timeout: 10000 })
      
      // Verify business owner permissions were created
      await expect(page).toHaveURL(/\/business\/dashboard/)
      await expect(page.getByText(/business dashboard/i)).toBeVisible()
      
      // Verify data was stored with proper validation
      await page.evaluate(async () => {
        const response = await fetch('/api/business/profile', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth-token')}` }
        })
        const businessData = await response.json()
        
        // Verify Google Maps data was stored
        if (!businessData.latitude || !businessData.longitude) {
          throw new Error('Business location coordinates not stored')
        }
        
        if (!businessData.address || !businessData.city || !businessData.state) {
          throw new Error('Business address components not properly stored')
        }
        
        return businessData
      })
    })
  })

  test('Flow 4: Complete Coupon Redemption with QR Generation', async ({ page }) => {
    // Setup: Create test user, business, and coupon
    const userData = await createTestUser({
      email: testUserEmail,
      full_name: 'Coupon Test User',
      subscription_status: 'active'
    })
    testUserId = userData.uid

    const business = await createTestBusiness({
      name: 'Test Coupon Business',
      email: generateTestEmail('coupon-biz')
    })
    testBusinessId = business.uid

    const coupon = await createTestCoupon(business.uid, {
      title: 'API Test Coupon - 30% Off',
      description: 'Test coupon for API integration',
      discount: '30% OFF',
      usage_limit: 'one_time'
    })

    await test.step('Login as premium user', async () => {
      await page.goto('/login')
      await page.getByLabel(/email/i).fill(testUserEmail)
      await page.getByLabel(/password/i).fill('TestPassword123!')
      await page.getByRole('button', { name: /sign in/i }).click()
      
      await expect(page).toHaveURL(/\/dashboard/)
    })

    await test.step('Browse coupons and verify subscription requirement', async () => {
      await page.getByRole('link', { name: /coupons/i }).click()
      await expect(page).toHaveURL(/\/coupons/)
      
      // Verify premium user can see coupons
      await expect(page.getByTestId('coupon-grid')).toBeVisible()
      await expect(page.getByTestId('coupon-card')).toHaveCount.greaterThan(0)
    })

    await test.step('Initiate coupon redemption', async () => {
      // Find our test coupon
      const testCoupon = page.locator('[data-testid="coupon-card"]').filter({
        hasText: 'API Test Coupon'
      }).first()
      
      await expect(testCoupon).toBeVisible()
      await testCoupon.getByRole('button', { name: /redeem/i }).click()
    })

    await test.step('Confirm redemption and verify database tracking', async () => {
      // Confirm redemption in dialog
      await expect(page.getByTestId('redemption-dialog')).toBeVisible()
      await expect(page.getByText(/confirm redemption/i)).toBeVisible()
      
      await page.getByRole('button', { name: /confirm/i }).click()
      
      // Verify redemption was tracked in database
      await page.evaluate(async (couponId) => {
        const response = await fetch(`/api/redemption/status/${couponId}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth-token')}` }
        })
        const redemptionData = await response.json()
        
        if (redemptionData.status !== 'pending') {
          throw new Error('Redemption not properly tracked in database')
        }
        
        return redemptionData
      }, coupon.uid)
    })

    await test.step('Verify QR code generation', async () => {
      // Wait for QR modal to appear
      await expect(page.getByTestId('qr-code-modal')).toBeVisible({ timeout: 10000 })
      
      // Verify QR code is displayed
      await expect(page.getByTestId('qr-code')).toBeVisible()
      
      // Verify display code is shown
      await expect(page.getByTestId('display-code')).toBeVisible()
      
      // Verify instructions are displayed
      await expect(page.getByText(/show this code/i)).toBeVisible()
      
      // Take screenshot for verification
      await takeScreenshot(page, 'qr-code-generation')
    })

    await test.step('Verify usage limit enforcement', async () => {
      // Close QR modal
      await page.getByRole('button', { name: /close/i }).click()
      
      // Try to redeem the same coupon again
      const testCoupon = page.locator('[data-testid="coupon-card"]').filter({
        hasText: 'API Test Coupon'
      }).first()
      
      await testCoupon.getByRole('button', { name: /redeem/i }).click()
      
      // Should show usage limit error
      await expect(page.getByText(/already redeemed/i)).toBeVisible()
      await expect(page.getByText(/one time use/i)).toBeVisible()
    })
  })

  test('Flow 5: Profile Management with Address Updates', async ({ page }) => {
    // Create test user
    const userData = await createTestUser({
      email: testUserEmail,
      full_name: 'Profile Test User',
      subscription_status: 'active'
    })
    testUserId = userData.uid

    await test.step('Login and navigate to profile', async () => {
      await page.goto('/login')
      await page.getByLabel(/email/i).fill(testUserEmail)
      await page.getByLabel(/password/i).fill('TestPassword123!')
      await page.getByRole('button', { name: /sign in/i }).click()
      
      await page.getByRole('link', { name: /profile/i }).click()
      await expect(page).toHaveURL(/\/profile/)
    })

    await test.step('Update profile information', async () => {
      // Update name
      await page.getByLabel(/full name/i).clear()
      await page.getByLabel(/full name/i).fill('Updated Profile Test User')
      
      // Update phone
      await page.getByLabel(/phone/i).clear()
      await page.getByLabel(/phone/i).fill('555-UPDATED')
    })

    await test.step('Update address with Google Maps validation', async () => {
      // Update address
      const addressInput = page.getByLabel(/address/i)
      await addressInput.clear()
      await addressInput.fill('789 Updated Street')
      
      // Wait for address suggestions
      await page.waitForSelector('[data-testid="address-suggestion"]', { timeout: 5000 })
      
      // Select new address
      await page.getByTestId('address-suggestion').first().click()
      
      // Verify new coordinates are captured
      await expect(page.locator('[data-coordinates-updated="true"]')).toBeVisible()
    })

    await test.step('Save profile and verify persistence', async () => {
      await page.getByRole('button', { name: /save changes/i }).click()
      
      // Verify success message
      await expect(page.getByText(/profile updated successfully/i)).toBeVisible()
      
      // Reload page and verify changes persisted
      await page.reload()
      await expect(page.getByDisplayValue('Updated Profile Test User')).toBeVisible()
      await expect(page.getByDisplayValue('555-UPDATED')).toBeVisible()
    })

    await test.step('Test subscription management', async () => {
      // Navigate to subscription section
      await page.getByTestId('subscription-section').click()
      
      // Verify current subscription status
      await expect(page.getByText(/premium subscription/i)).toBeVisible()
      await expect(page.getByText(/active/i)).toBeVisible()
      
      // Test subscription modification (would require Stripe integration)
      await page.getByRole('button', { name: /manage subscription/i }).click()
      await expect(page.getByTestId('subscription-management-dialog')).toBeVisible()
    })
  })

  // Integration failure scenarios
  test('Integration Failure Scenarios', async ({ page }) => {
    await test.step('Test Google Maps API failure handling', async () => {
      // Block Google Maps API calls
      await page.route('**/maps.googleapis.com/**', route => route.abort())
      
      await page.goto('/register')
      
      const addressInput = page.getByLabel(/address/i)
      await addressInput.fill('123 Main Street')
      
      // Should show fallback for address input
      await expect(page.getByText(/address suggestions unavailable/i)).toBeVisible()
      
      // Should still allow manual address entry
      await expect(addressInput).toBeEnabled()
    })

    await test.step('Test Supabase connection failure handling', async () => {
      // Block Supabase API calls
      await page.route('**/supabase.co/**', route => route.abort())
      
      await page.goto('/login')
      await page.getByLabel(/email/i).fill('test@example.com')
      await page.getByLabel(/password/i).fill('password')
      await page.getByRole('button', { name: /sign in/i }).click()
      
      // Should show database connection error
      await expect(page.getByText(/connection error/i)).toBeVisible()
      await expect(page.getByRole('button', { name: /retry/i })).toBeVisible()
    })

    await test.step('Test Stripe payment failure handling', async () => {
      const userData = await createTestUser({
        email: testUserEmail,
        full_name: 'Payment Test User'
      })
      testUserId = userData.uid

      await page.goto('/login')
      await page.getByLabel(/email/i).fill(testUserEmail)
      await page.getByLabel(/password/i).fill('TestPassword123!')
      await page.getByRole('button', { name: /sign in/i }).click()

      // Mock Stripe to return payment failure
      await page.evaluate(() => {
        window.Stripe = () => ({
          confirmCardPayment: () => Promise.resolve({
            error: { message: 'Your card was declined.' }
          })
        })
      })

      await page.getByRole('button', { name: /upgrade/i }).click()
      await page.getByTestId('monthly-plan').click()
      await page.getByRole('button', { name: /subscribe now/i }).click()

      // Should handle payment failure gracefully
      await expect(page.getByText(/payment failed/i)).toBeVisible()
      await expect(page.getByText(/card was declined/i)).toBeVisible()
    })
  })
})

test.describe('Real-time Integration Tests', () => {
  test('Real-time updates across components', async ({ page, context }) => {
    const userData = await createTestUser({
      email: generateTestEmail('realtime'),
      full_name: 'Realtime Test User',
      subscription_status: 'active'
    })

    // Open multiple tabs to test real-time sync
    const page2 = await context.newPage()
    
    // Login on both tabs
    for (const currentPage of [page, page2]) {
      await currentPage.goto('/login')
      await currentPage.getByLabel(/email/i).fill(userData.email)
      await currentPage.getByLabel(/password/i).fill('TestPassword123!')
      await currentPage.getByRole('button', { name: /sign in/i }).click()
    }

    // Update profile on first tab
    await page.goto('/profile')
    await page.getByLabel(/full name/i).clear()
    await page.getByLabel(/full name/i).fill('Updated Realtime User')
    await page.getByRole('button', { name: /save/i }).click()

    // Verify update appears on second tab
    await page2.goto('/profile')
    await expect(page2.getByDisplayValue('Updated Realtime User')).toBeVisible({ timeout: 5000 })

    await cleanupTestUser(userData.uid)
  })
})