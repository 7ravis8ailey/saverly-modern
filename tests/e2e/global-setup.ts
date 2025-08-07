/**
 * Playwright Global Setup
 * Prepares the test environment before running E2E tests
 */

import { chromium, FullConfig } from '@playwright/test'
import { supabase } from '../../src/lib/supabase'

async function globalSetup(config: FullConfig) {
  console.log('🚀 Setting up E2E test environment...')

  try {
    // Test database connection
    const { data, error } = await supabase.from('users').select('count').limit(1)
    
    if (error) {
      console.error('❌ Database connection failed:', error.message)
      throw new Error(`Database setup failed: ${error.message}`)
    }

    console.log('✅ Database connection verified')

    // Create test data if needed
    await setupTestData()

    // Start browser for authentication setup
    const browser = await chromium.launch()
    const context = await browser.newContext()
    const page = await context.newPage()

    // Navigate to app to ensure it loads
    const baseURL = config.projects[0].use?.baseURL || 'http://localhost:5173'
    
    try {
      await page.goto(baseURL, { waitUntil: 'networkidle' })
      console.log('✅ Application is accessible')
    } catch (error) {
      console.error('❌ Application not accessible:', error)
      throw new Error('Application setup failed')
    }

    await browser.close()

    console.log('✅ E2E test environment ready')
    
  } catch (error) {
    console.error('❌ Global setup failed:', error)
    throw error
  }
}

async function setupTestData() {
  console.log('📋 Setting up test data...')

  try {
    // Clean up any existing test data
    await supabase.from('users').delete().like('email', '%e2e-test%')
    await supabase.from('businesses').delete().like('email', '%e2e-test%')

    // Create test business
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .insert([{
        name: 'E2E Test Coffee Shop',
        email: `e2e-test-business-${Date.now()}@example.com`,
        contact_name: 'Test Business Owner',
        phone: '555-000-0001',
        address: '123 Test Street',
        city: 'San Francisco',
        state: 'CA',
        zip_code: '94102',
        category: 'Food & Beverage',
        description: 'A test coffee shop for E2E testing',
        latitude: 37.7749,
        longitude: -122.4194
      }])
      .select()
      .single()

    if (businessError) {
      console.error('Failed to create test business:', businessError)
      return
    }

    // Create test coupon
    if (business) {
      await supabase
        .from('coupons')
        .insert([{
          business_uid: business.uid,
          title: 'E2E Test Coupon - 50% Off',
          description: 'Test coupon for E2E automation',
          discount: '50% OFF',
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          active: true,
          usage_limit: 'one_time'
        }])
    }

    console.log('✅ Test data created successfully')

  } catch (error) {
    console.error('❌ Test data setup failed:', error)
    // Don't throw - tests can still run without pre-created test data
  }
}

export default globalSetup