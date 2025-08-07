/**
 * Critical Integration Points E2E Tests
 * Tests specific integration points between systems
 */

import { test, expect } from '@playwright/test'
import { 
  generateTestEmail,
  createTestUser,
  createTestBusiness,
  cleanupTestUser,
  cleanupTestBusiness
} from './utils/test-helpers'

test.describe('Critical Integration Points', () => {
  let testUserEmail: string
  let testUserId: string
  let testBusinessId: string

  test.beforeEach(async () => {
    testUserEmail = generateTestEmail('integration-point')
  })

  test.afterEach(async () => {
    if (testUserId) await cleanupTestUser(testUserId)
    if (testBusinessId) await cleanupTestBusiness(testBusinessId)
  })

  test('Integration Point: Google Maps → Supabase Address Storage', async ({ page }) => {
    await test.step('Test address autocomplete with coordinate capture', async () => {
      await page.goto('/register')
      
      const addressInput = page.getByLabel(/address/i)
      await addressInput.fill('123 Market Street, San Francisco')
      
      // Wait for Google Maps suggestions
      await page.waitForSelector('[data-testid="address-suggestion"]', { timeout: 10000 })
      
      // Click first suggestion
      await page.getByTestId('address-suggestion').first().click()
      
      // Verify coordinates were captured from Google Maps
      const coordinates = await page.evaluate(() => {
        const addressData = JSON.parse(sessionStorage.getItem('selectedAddress') || '{}')
        return {
          lat: addressData.latitude,
          lng: addressData.longitude,
          formatted: addressData.formatted_address
        }
      })
      
      expect(coordinates.lat).toBeGreaterThan(0)
      expect(coordinates.lng).toBeLessThan(0) // San Francisco longitude should be negative
      expect(coordinates.formatted).toContain('Market Street')
    })

    await test.step('Complete registration and verify Supabase storage', async () => {
      await page.getByLabel(/full name/i).fill('Integration Test User')
      await page.getByLabel(/email/i).fill(testUserEmail)
      await page.getByLabel(/password/i).fill('TestPassword123!')
      await page.getByLabel(/phone/i).fill('555-INT-TEST')
      
      await page.getByRole('button', { name: /create account/i }).click()
      
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 })
      
      // Verify data was stored in Supabase with Google Maps data
      const storedData = await page.evaluate(async () => {
        const response = await fetch('/api/user/profile', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (!response.ok) {
          throw new Error('Failed to fetch user profile')
        }
        
        return await response.json()
      })
      
      expect(storedData.address).toBeTruthy()
      expect(storedData.latitude).toBeGreaterThan(0)
      expect(storedData.longitude).toBeLessThan(0)
      expect(storedData.city).toBe('San Francisco')
      expect(storedData.state).toBe('CA')
    })
  })

  test('Integration Point: Stripe Payment → Supabase Subscription Status', async ({ page }) => {
    // Create test user
    const userData = await createTestUser({
      email: testUserEmail,
      full_name: 'Payment Integration Test'
    })
    testUserId = userData.uid

    await test.step('Login and initiate subscription', async () => {
      await page.goto('/login')
      await page.getByLabel(/email/i).fill(testUserEmail)
      await page.getByLabel(/password/i).fill('TestPassword123!')
      await page.getByRole('button', { name: /sign in/i }).click()
      
      await expect(page).toHaveURL(/\/dashboard/)
      
      // Verify initial subscription status
      const initialStatus = await page.evaluate(async () => {
        const response = await fetch('/api/user/subscription')
        const data = await response.json()
        return data.subscription_status
      })
      
      expect(initialStatus).toBe('inactive')
    })

    await test.step('Process Stripe payment', async () => {
      await page.getByRole('button', { name: /upgrade/i }).click()
      await page.getByTestId('monthly-plan').click()
      
      // Mock successful Stripe payment
      await page.evaluate(() => {
        window.Stripe = () => ({
          elements: () => ({
            create: () => ({
              mount: () => {},
              unmount: () => {},
              on: () => {}
            })
          }),
          confirmCardPayment: () => Promise.resolve({
            paymentIntent: { 
              id: 'pi_test_successful', 
              status: 'succeeded',
              amount: 499,
              currency: 'usd'
            },
            error: null
          }),
          createPaymentMethod: () => Promise.resolve({
            paymentMethod: { id: 'pm_test_card' },
            error: null
          })
        })
      })
      
      await page.getByRole('button', { name: /subscribe now/i }).click()
      
      // Wait for payment processing
      await expect(page.getByText(/processing payment/i)).toBeVisible()
      await expect(page.getByText(/subscription active/i)).toBeVisible({ timeout: 20000 })
    })

    await test.step('Verify Supabase subscription update', async () => {
      const updatedStatus = await page.evaluate(async () => {
        const response = await fetch('/api/user/subscription')
        const data = await response.json()
        return {
          status: data.subscription_status,
          stripe_id: data.stripe_subscription_id,
          plan: data.subscription_plan
        }
      })
      
      expect(updatedStatus.status).toBe('active')
      expect(updatedStatus.stripe_id).toBeTruthy()
      expect(updatedStatus.plan).toBe('monthly')
      
      // Verify webhook processed correctly
      const webhookData = await page.evaluate(async () => {
        const response = await fetch('/api/webhooks/stripe/verify')
        return await response.json()
      })
      
      expect(webhookData.last_webhook).toBeTruthy()
    })
  })

  test('Integration Point: QR Generation → Redemption Tracking', async ({ page }) => {
    // Setup test data
    const userData = await createTestUser({
      email: testUserEmail,
      full_name: 'QR Test User',
      subscription_status: 'active'
    })
    testUserId = userData.uid

    const business = await createTestBusiness()
    testBusinessId = business.uid

    await test.step('Login and redeem coupon', async () => {
      await page.goto('/login')
      await page.getByLabel(/email/i).fill(testUserEmail)
      await page.getByLabel(/password/i).fill('TestPassword123!')
      await page.getByRole('button', { name: /sign in/i }).click()
      
      await page.getByRole('link', { name: /coupons/i }).click()
      
      // Find and redeem first available coupon
      const firstCoupon = page.getByTestId('coupon-card').first()
      await firstCoupon.getByRole('button', { name: /redeem/i }).click()
      await page.getByRole('button', { name: /confirm/i }).click()
    })

    await test.step('Verify QR code generation with tracking', async () => {
      await expect(page.getByTestId('qr-code-modal')).toBeVisible({ timeout: 10000 })
      
      // Extract QR data and verify tracking
      const qrData = await page.evaluate(() => {
        const qrElement = document.querySelector('[data-testid="qr-code"]')
        const displayCode = document.querySelector('[data-testid="display-code"]')
        
        return {
          qrValue: qrElement?.getAttribute('data-qr-value'),
          displayCode: displayCode?.textContent,
          redemptionId: qrElement?.getAttribute('data-redemption-id')
        }
      })
      
      expect(qrData.qrValue).toBeTruthy()
      expect(qrData.displayCode).toMatch(/^[A-Z0-9]{6,}$/) // Alphanumeric code
      expect(qrData.redemptionId).toBeTruthy()
      
      // Verify redemption was tracked in database
      const redemptionData = await page.evaluate(async (redemptionId) => {
        const response = await fetch(`/api/redemptions/${redemptionId}`)
        return await response.json()
      }, qrData.redemptionId)
      
      expect(redemptionData.status).toBe('pending')
      expect(redemptionData.qr_code).toBe(qrData.qrValue)
      expect(redemptionData.display_code).toBe(qrData.displayCode)
    })

    await test.step('Test QR expiration and cleanup', async () => {
      // Wait for QR expiration (test environment should have short expiry)
      await page.waitForTimeout(5000)
      
      // QR code should show expiration warning
      await expect(page.getByText(/expires in/i)).toBeVisible()
      
      // Test manual expiration
      await page.getByRole('button', { name: /close/i }).click()
      
      // Verify expired redemption cleanup
      await page.evaluate(async () => {
        const response = await fetch('/api/redemptions/cleanup', { method: 'POST' })
        return await response.json()
      })
    })
  })

  test('Integration Point: Usage Limits → Database Enforcement', async ({ page }) => {
    const userData = await createTestUser({
      email: testUserEmail,
      full_name: 'Usage Limit Test',
      subscription_status: 'active'
    })
    testUserId = userData.uid

    await test.step('Test monthly usage limits', async () => {
      await page.goto('/login')
      await page.getByLabel(/email/i).fill(testUserEmail)
      await page.getByLabel(/password/i).fill('TestPassword123!')
      await page.getByRole('button', { name: /sign in/i }).click()
      
      // Check initial usage count
      const initialUsage = await page.evaluate(async () => {
        const response = await fetch('/api/user/usage-stats')
        const data = await response.json()
        return data.monthly_redemptions
      })
      
      expect(initialUsage).toBe(0)
    })

    await test.step('Redeem coupons up to limit', async () => {
      await page.getByRole('link', { name: /coupons/i }).click()
      
      // Get user's monthly limit
      const monthlyLimit = await page.evaluate(async () => {
        const response = await fetch('/api/user/subscription')
        const data = await response.json()
        return data.monthly_coupon_limit
      })
      
      // Redeem coupons up to limit
      for (let i = 0; i < monthlyLimit; i++) {
        const availableCoupons = page.getByTestId('coupon-card').locator('button:has-text("Redeem")')
        const couponCount = await availableCoupons.count()
        
        if (couponCount > 0) {
          await availableCoupons.first().click()
          await page.getByRole('button', { name: /confirm/i }).click()
          await page.getByRole('button', { name: /close/i }).click()
          
          // Wait for UI update
          await page.waitForTimeout(1000)
        }
      }
    })

    await test.step('Verify limit enforcement', async () => {
      // Try to redeem one more coupon
      const availableCoupons = page.getByTestId('coupon-card').locator('button:has-text("Redeem")')
      
      if (await availableCoupons.count() > 0) {
        await availableCoupons.first().click()
        
        // Should show limit exceeded message
        await expect(page.getByText(/monthly limit exceeded/i)).toBeVisible()
        await expect(page.getByText(/upgrade plan/i)).toBeVisible()
      }
      
      // Verify database shows correct usage count
      const finalUsage = await page.evaluate(async () => {
        const response = await fetch('/api/user/usage-stats')
        const data = await response.json()
        return data.monthly_redemptions
      })
      
      expect(finalUsage).toBeGreaterThan(0)
    })
  })

  test('Integration Point: Real-time Updates → Supabase Subscriptions', async ({ page, context }) => {
    const userData = await createTestUser({
      email: testUserEmail,
      full_name: 'Realtime Test User',
      subscription_status: 'active'
    })
    testUserId = userData.uid

    // Open second tab for real-time testing
    const page2 = await context.newPage()

    await test.step('Setup real-time listeners', async () => {
      // Login on both tabs
      for (const currentPage of [page, page2]) {
        await currentPage.goto('/login')
        await currentPage.getByLabel(/email/i).fill(testUserEmail)
        await currentPage.getByLabel(/password/i).fill('TestPassword123!')
        await currentPage.getByRole('button', { name: /sign in/i }).click()
        
        // Navigate to dashboard to establish real-time connection
        await currentPage.getByRole('link', { name: /dashboard/i }).click()
        
        // Verify real-time connection is established
        const isConnected = await currentPage.evaluate(() => {
          return window.supabase?.realtime?.isConnected() || false
        })
        
        expect(isConnected).toBe(true)
      }
    })

    await test.step('Test profile update propagation', async () => {
      // Update profile on first tab
      await page.getByRole('link', { name: /profile/i }).click()
      await page.getByLabel(/full name/i).clear()
      await page.getByLabel(/full name/i).fill('Updated Realtime User')
      await page.getByRole('button', { name: /save/i }).click()
      
      await expect(page.getByText(/profile updated/i)).toBeVisible()
      
      // Check if update appears on second tab
      await page2.reload()
      await page2.getByRole('link', { name: /profile/i }).click()
      
      await expect(page2.getByDisplayValue('Updated Realtime User')).toBeVisible({ timeout: 10000 })
    })

    await test.step('Test coupon availability updates', async () => {
      // Navigate both tabs to coupons page
      await page.getByRole('link', { name: /coupons/i }).click()
      await page2.getByRole('link', { name: /coupons/i }).click()
      
      // Count available coupons on both tabs
      const initialCount = await page.getByTestId('coupon-card').count()
      const initialCount2 = await page2.getByTestId('coupon-card').count()
      
      expect(initialCount).toBe(initialCount2)
      
      // Redeem coupon on first tab
      const firstCoupon = page.getByTestId('coupon-card').first()
      await firstCoupon.getByRole('button', { name: /redeem/i }).click()
      await page.getByRole('button', { name: /confirm/i }).click()
      
      // Wait for real-time update on second tab
      await page2.waitForTimeout(3000)
      await page2.reload()
      
      const updatedCount2 = await page2.getByTestId('coupon-card').count()
      
      // Coupon availability should be updated
      expect(updatedCount2).toBeLessThanOrEqual(initialCount2)
    })

    await page2.close()
  })

  test('Integration Point: Error Recovery and Retry Logic', async ({ page }) => {
    const userData = await createTestUser({
      email: testUserEmail,
      full_name: 'Error Recovery Test',
      subscription_status: 'active'
    })
    testUserId = userData.uid

    await test.step('Test network failure recovery', async () => {
      await page.goto('/login')
      await page.getByLabel(/email/i).fill(testUserEmail)
      await page.getByLabel(/password/i).fill('TestPassword123!')
      await page.getByRole('button', { name: /sign in/i }).click()
      
      await page.getByRole('link', { name: /coupons/i }).click()
      
      // Simulate network failure
      await page.route('**/api/**', route => route.abort())
      
      // Try to redeem coupon
      await page.getByTestId('coupon-card').first().getByRole('button', { name: /redeem/i }).click()
      
      // Should show error and retry option
      await expect(page.getByText(/network error/i)).toBeVisible()
      await expect(page.getByRole('button', { name: /retry/i })).toBeVisible()
      
      // Restore network and retry
      await page.unroute('**/api/**')
      await page.getByRole('button', { name: /retry/i }).click()
      
      // Should now work
      await expect(page.getByTestId('redemption-dialog')).toBeVisible()
    })

    await test.step('Test Supabase connection recovery', async () => {
      // Simulate Supabase connection issues
      await page.route('**/supabase.co/**', route => {
        route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Service Unavailable' })
        })
      })
      
      await page.reload()
      
      // Should show database connection error
      await expect(page.getByText(/database connection/i)).toBeVisible()
      await expect(page.getByRole('button', { name: /retry connection/i })).toBeVisible()
      
      // Restore connection
      await page.unroute('**/supabase.co/**')
      await page.getByRole('button', { name: /retry connection/i }).click()
      
      // Should recover and load content
      await expect(page.getByTestId('coupon-grid')).toBeVisible({ timeout: 10000 })
    })

    await test.step('Test transaction rollback on failure', async () => {
      // Start coupon redemption
      await page.getByTestId('coupon-card').first().getByRole('button', { name: /redeem/i }).click()
      await page.getByRole('button', { name: /confirm/i }).click()
      
      // Simulate failure during redemption processing
      await page.route('**/api/redemptions/complete', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Processing failed' })
        })
      })
      
      await page.waitForTimeout(2000)
      
      // Should show failure message
      await expect(page.getByText(/redemption failed/i)).toBeVisible()
      
      // Verify redemption was rolled back in database
      const redemptionStatus = await page.evaluate(async () => {
        const response = await fetch('/api/user/redemptions/recent')
        const data = await response.json()
        return data.length
      })
      
      // No completed redemptions should exist
      expect(redemptionStatus).toBe(0)
    })
  })
})