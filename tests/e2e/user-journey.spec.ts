/**
 * Complete User Journey E2E Tests
 * Tests the full user flow from registration to coupon redemption
 */

import { test, expect } from '@playwright/test'
import { generateTestEmail, createTestUser, cleanupTestUser } from './utils/test-helpers'

test.describe('Complete User Journey', () => {
  let testUserEmail: string
  let testUserId: string

  test.beforeEach(async () => {
    // Generate unique test user email
    testUserEmail = generateTestEmail('journey')
  })

  test.afterEach(async () => {
    // Cleanup test user data
    if (testUserId) {
      await cleanupTestUser(testUserId)
    }
  })

  test('should complete full user journey: registration → subscription → coupon redemption', async ({ page }) => {
    // Step 1: Navigate to landing page
    await page.goto('/')
    
    // Verify landing page loads
    await expect(page).toHaveTitle(/Saverly/)
    await expect(page.locator('h1')).toContainText('Save Money')

    // Step 2: Navigate to registration
    await page.getByRole('link', { name: /get started/i }).click()
    await expect(page).toHaveURL(/\/register/)

    // Step 3: Complete registration form
    await page.getByLabel(/full name/i).fill('E2E Test User')
    await page.getByLabel(/email/i).fill(testUserEmail)
    await page.getByLabel(/password/i).fill('TestPassword123!')
    await page.getByLabel(/phone/i).fill('555-123-4567')
    
    // Fill address using the address autocomplete
    const addressInput = page.getByLabel(/address/i)
    await addressInput.click()
    await addressInput.fill('123 Main St')
    
    // Wait for address suggestions and select first one
    await page.waitForSelector('[data-testid="address-suggestion"]', { timeout: 5000 })
    await page.getByTestId('address-suggestion').first().click()

    // Submit registration
    await page.getByRole('button', { name: /create account/i }).click()

    // Step 4: Verify registration success
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
    await expect(page.getByText(/welcome/i)).toBeVisible()

    // Step 5: Check subscription status (should be inactive)
    await expect(page.getByText(/upgrade to premium/i)).toBeVisible()

    // Step 6: Navigate to subscription page
    await page.getByRole('button', { name: /upgrade/i }).click()
    await expect(page).toHaveURL(/\/subscription/)

    // Step 7: Select monthly plan
    await page.getByTestId('monthly-plan').click()
    await expect(page.getByTestId('monthly-plan')).toHaveClass(/selected/)

    // Step 8: Fill payment form (using test Stripe card)
    await page.getByLabel(/cardholder name/i).fill('E2E Test User')
    await page.getByLabel(/email/i).fill(testUserEmail)

    // Fill Stripe card element (this would be mocked in test environment)
    const cardFrame = page.frameLocator('iframe[name*="__privateStripeFrame"]')
    await cardFrame.getByPlaceholder('1234 1234 1234 1234').fill('4242424242424242')
    await cardFrame.getByPlaceholder('MM / YY').fill('12/25')
    await cardFrame.getByPlaceholder('CVC').fill('123')

    // Submit payment
    await page.getByRole('button', { name: /subscribe/i }).click()

    // Step 9: Verify successful subscription
    await expect(page.getByText(/subscription active/i)).toBeVisible({ timeout: 15000 })
    await expect(page).toHaveURL(/\/dashboard/)

    // Step 10: Navigate to coupons page
    await page.getByRole('link', { name: /coupons/i }).click()
    await expect(page).toHaveURL(/\/coupons/)

    // Step 11: Verify coupons are visible
    await expect(page.getByTestId('coupon-card')).toHaveCount.greaterThan(0)

    // Step 12: Redeem a test coupon
    const firstCoupon = page.getByTestId('coupon-card').first()
    await expect(firstCoupon).toBeVisible()

    // Click redeem button
    await firstCoupon.getByRole('button', { name: /redeem/i }).click()

    // Step 13: Confirm redemption
    await expect(page.getByTestId('redemption-dialog')).toBeVisible()
    await expect(page.getByText(/confirm redemption/i)).toBeVisible()

    await page.getByRole('button', { name: /confirm/i }).click()

    // Step 14: Verify QR code generation
    await expect(page.getByTestId('qr-code')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/show this code/i)).toBeVisible()

    // Step 15: Wait for success animation
    await expect(page.getByTestId('success-animation')).toBeVisible()
    await expect(page.getByText(/successful redemption/i)).toBeVisible()

    // Step 16: Verify redemption in user dashboard
    await page.getByRole('link', { name: /dashboard/i }).click()
    await expect(page.getByText(/recent redemption/i)).toBeVisible()
  })

  test('should handle registration validation errors', async ({ page }) => {
    await page.goto('/register')

    // Try to submit empty form
    await page.getByRole('button', { name: /create account/i }).click()

    // Check validation messages
    await expect(page.getByText(/name is required/i)).toBeVisible()
    await expect(page.getByText(/email is required/i)).toBeVisible()
    await expect(page.getByText(/password is required/i)).toBeVisible()

    // Test invalid email
    await page.getByLabel(/email/i).fill('invalid-email')
    await page.getByRole('button', { name: /create account/i }).click()
    await expect(page.getByText(/please enter a valid email/i)).toBeVisible()

    // Test weak password
    await page.getByLabel(/email/i).fill(testUserEmail)
    await page.getByLabel(/password/i).fill('weak')
    await page.getByRole('button', { name: /create account/i }).click()
    await expect(page.getByText(/password must be at least 8 characters/i)).toBeVisible()
  })

  test('should handle subscription without authentication', async ({ page }) => {
    // Try to access subscription page without being logged in
    await page.goto('/subscription')

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByText(/please sign in/i)).toBeVisible()
  })

  test('should handle coupon redemption limits', async ({ page, context }) => {
    // Create a user with active subscription
    const userData = await createTestUser({
      email: testUserEmail,
      full_name: 'E2E Limit Test User',
      subscription_status: 'active'
    })
    testUserId = userData.uid

    // Login as the user
    await page.goto('/login')
    await page.getByLabel(/email/i).fill(testUserEmail)
    await page.getByLabel(/password/i).fill('TestPassword123!')
    await page.getByRole('button', { name: /sign in/i }).click()

    await expect(page).toHaveURL(/\/dashboard/)

    // Navigate to coupons
    await page.getByRole('link', { name: /coupons/i }).click()

    // Find a one-time use coupon
    const oneTimeCoupon = page.locator('[data-testid="coupon-card"]').filter({
      hasText: 'one time use'
    }).first()

    if (await oneTimeCoupon.count() > 0) {
      // Redeem the coupon
      await oneTimeCoupon.getByRole('button', { name: /redeem/i }).click()
      await page.getByRole('button', { name: /confirm/i }).click()

      // Wait for redemption to complete
      await expect(page.getByTestId('success-animation')).toBeVisible()

      // Try to redeem the same coupon again
      await page.goto('/coupons')
      await oneTimeCoupon.getByRole('button', { name: /redeem/i }).click()

      // Should show limit reached error
      await expect(page.getByText(/already redeemed/i)).toBeVisible()
    }
  })

  test('should work on mobile devices', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'This test only runs on mobile')

    await page.goto('/')

    // Test mobile navigation
    await page.getByRole('button', { name: /menu/i }).click()
    await expect(page.getByRole('navigation')).toBeVisible()

    // Test responsive coupon grid
    await page.goto('/coupons')
    const couponCards = page.getByTestId('coupon-card')
    
    // On mobile, coupons should stack vertically
    const firstCard = couponCards.first()
    const secondCard = couponCards.nth(1)
    
    if (await couponCards.count() > 1) {
      const firstBox = await firstCard.boundingBox()
      const secondBox = await secondCard.boundingBox()
      
      // Second card should be below first card on mobile
      expect(secondBox?.y).toBeGreaterThan(firstBox?.y || 0)
    }
  })
})

test.describe('Error Handling', () => {
  test('should handle network errors gracefully', async ({ page }) => {
    // Block network requests to simulate offline
    await page.route('**/api/**', route => route.abort())

    await page.goto('/')

    // Try to load coupons
    await page.getByRole('link', { name: /coupons/i }).click()

    // Should show error state
    await expect(page.getByText(/unable to load/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /retry/i })).toBeVisible()
  })

  test('should handle expired sessions', async ({ page }) => {
    // This would test session timeout handling
    await page.goto('/login')
    
    // Mock expired token
    await page.evaluate(() => {
      localStorage.setItem('sb-lziayzusujlvhebyagdl-auth-token', 'expired-token')
    })

    await page.goto('/dashboard')

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByText(/session expired/i)).toBeVisible()
  })
})