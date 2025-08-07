/**
 * Playwright Global Teardown
 * Cleans up test environment after running E2E tests
 */

import { FullConfig } from '@playwright/test'
import { cleanupAllTestData } from './utils/test-helpers'

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Cleaning up E2E test environment...')

  try {
    // Clean up all test data
    await cleanupAllTestData()
    
    console.log('✅ E2E test environment cleaned up successfully')
    
  } catch (error) {
    console.error('❌ Global teardown failed:', error)
    // Don't throw - teardown failures shouldn't fail the test run
  }
}

export default globalTeardown