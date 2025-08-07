/**
 * API Validation Report
 * Validates core API integrations and generates comprehensive report
 */

import { test, expect } from '@playwright/test'

test.describe('API Integration Validation Report', () => {
  let testReport = {
    timestamp: new Date().toISOString(),
    integrations: {
      supabase: { status: 'unknown', details: '' },
      googleMaps: { status: 'unknown', details: '' },
      stripe: { status: 'unknown', details: '' },
      authentication: { status: 'unknown', details: '' },
      realtime: { status: 'unknown', details: '' }
    },
    userFlows: {
      registration: { status: 'unknown', details: '' },
      subscription: { status: 'unknown', details: '' },
      couponRedemption: { status: 'unknown', details: '' },
      businessRegistration: { status: 'unknown', details: '' },
      profileManagement: { status: 'unknown', details: '' }
    },
    recommendations: []
  }

  test('API Integration Validation', async ({ page }) => {
    await test.step('Validate Application Loading', async () => {
      try {
        await page.goto('/', { waitUntil: 'networkidle', timeout: 30000 })
        await expect(page.locator('body')).toBeVisible()
        
        // Check for critical errors
        const errors = await page.evaluate(() => {
          return {
            consoleErrors: window.console?.error?.toString() || 'No console errors detected',
            jsErrors: window.onerror ? 'JS errors detected' : 'No JS errors detected',
            loaded: document.readyState
          }
        })
        
        testReport.userFlows.registration.status = 'accessible'
        testReport.userFlows.registration.details = `Application loads successfully. Ready state: ${errors.loaded}`
        
      } catch (error) {
        testReport.userFlows.registration.status = 'failed'
        testReport.userFlows.registration.details = `Failed to load application: ${error}`
        testReport.recommendations.push('Fix application loading issues before proceeding with integration testing')
      }
    })

    await test.step('Validate Supabase Integration', async () => {
      try {
        // Check if Supabase client is initialized
        const supabaseStatus = await page.evaluate(async () => {
          try {
            // Try to access Supabase client
            const supabase = window.supabase || (await import('/src/lib/supabase.ts')).supabase
            
            if (!supabase) {
              return { status: 'failed', details: 'Supabase client not initialized' }
            }

            // Test basic connection
            const { data, error } = await supabase.from('users').select('count').limit(1)
            
            if (error) {
              return { 
                status: 'connection_error', 
                details: `Supabase connection error: ${error.message}`,
                config: {
                  url: supabase.supabaseUrl,
                  key: supabase.supabaseKey ? 'Present' : 'Missing'
                }
              }
            }
            
            return { 
              status: 'connected', 
              details: 'Supabase connection successful',
              config: {
                url: supabase.supabaseUrl,
                key: 'Present'
              }
            }
          } catch (err) {
            return { 
              status: 'initialization_error', 
              details: `Supabase initialization failed: ${err.message}` 
            }
          }
        })

        testReport.integrations.supabase = {
          status: supabaseStatus.status,
          details: supabaseStatus.details
        }

        if (supabaseStatus.status !== 'connected') {
          testReport.recommendations.push('Fix Supabase configuration and connection issues')
        }

      } catch (error) {
        testReport.integrations.supabase = {
          status: 'evaluation_error',
          details: `Failed to evaluate Supabase integration: ${error}`
        }
      }
    })

    await test.step('Validate Authentication Flow', async () => {
      try {
        // Navigate to login page
        await page.goto('/login')
        await expect(page.getByLabel(/email/i)).toBeVisible()
        await expect(page.getByLabel(/password/i)).toBeVisible()
        
        // Test form validation
        await page.getByRole('button', { name: /sign in/i }).click()
        const hasValidation = await page.locator('text=/required/i').count() > 0
        
        testReport.integrations.authentication = {
          status: hasValidation ? 'form_validation_working' : 'form_validation_missing',
          details: `Login form accessible, validation ${hasValidation ? 'working' : 'missing'}`
        }

        // Test registration page
        await page.goto('/register')
        const registrationElements = await page.evaluate(() => {
          const fields = ['name', 'email', 'password', 'phone', 'address']
          const found = {}
          
          fields.forEach(field => {
            const element = document.querySelector(`[name*="${field}"], [placeholder*="${field}"], label:has-text("${field}")`)
            found[field] = element ? 'present' : 'missing'
          })
          
          return found
        })

        const missingFields = Object.entries(registrationElements)
          .filter(([field, status]) => status === 'missing')
          .map(([field]) => field)

        if (missingFields.length > 0) {
          testReport.recommendations.push(`Registration form missing fields: ${missingFields.join(', ')}`)
        }

        testReport.userFlows.registration = {
          status: missingFields.length === 0 ? 'complete_form' : 'incomplete_form',
          details: `Registration form fields: ${JSON.stringify(registrationElements)}`
        }

      } catch (error) {
        testReport.integrations.authentication = {
          status: 'navigation_error',
          details: `Failed to test authentication: ${error}`
        }
      }
    })

    await test.step('Validate Google Maps Integration', async () => {
      try {
        await page.goto('/register')
        
        const mapsStatus = await page.evaluate(async () => {
          try {
            // Check if Google Maps API is loaded
            const mapsApiLoaded = typeof window.google !== 'undefined' && 
                                window.google.maps !== 'undefined'
            
            if (!mapsApiLoaded) {
              return { 
                status: 'api_not_loaded', 
                details: 'Google Maps API not loaded' 
              }
            }

            // Check for address autocomplete component
            const addressInput = document.querySelector('input[name*="address"], input[placeholder*="address"]')
            
            if (!addressInput) {
              return { 
                status: 'input_not_found', 
                details: 'Address input field not found' 
              }
            }

            return { 
              status: 'components_available', 
              details: 'Google Maps API loaded, address input available' 
            }
            
          } catch (err) {
            return { 
              status: 'evaluation_error', 
              details: `Google Maps evaluation failed: ${err.message}` 
            }
          }
        })

        testReport.integrations.googleMaps = mapsStatus

        if (mapsStatus.status !== 'components_available') {
          testReport.recommendations.push('Fix Google Maps API integration for address autocomplete')
        }

      } catch (error) {
        testReport.integrations.googleMaps = {
          status: 'test_error',
          details: `Failed to test Google Maps: ${error}`
        }
      }
    })

    await test.step('Validate Stripe Integration', async () => {
      try {
        // Navigate to a page that might load Stripe
        await page.goto('/')
        
        const stripeStatus = await page.evaluate(async () => {
          try {
            // Check if Stripe is loaded
            const stripeLoaded = typeof window.Stripe !== 'undefined'
            
            if (!stripeLoaded) {
              return { 
                status: 'api_not_loaded', 
                details: 'Stripe API not loaded' 
              }
            }

            // Check Stripe configuration
            const stripeInstance = window.Stripe('pk_test_123')
            
            return { 
              status: 'api_available', 
              details: 'Stripe API loaded and configurable' 
            }
            
          } catch (err) {
            return { 
              status: 'configuration_error', 
              details: `Stripe configuration error: ${err.message}` 
            }
          }
        })

        testReport.integrations.stripe = stripeStatus

        if (stripeStatus.status !== 'api_available') {
          testReport.recommendations.push('Verify Stripe API configuration and key setup')
        }

      } catch (error) {
        testReport.integrations.stripe = {
          status: 'test_error',
          details: `Failed to test Stripe: ${error}`
        }
      }
    })

    await test.step('Validate Critical User Flow Accessibility', async () => {
      const flows = [
        { name: 'subscription', path: '/subscription', expectedElement: 'text=/upgrade/i' },
        { name: 'coupons', path: '/coupons', expectedElement: 'text=/coupons/i' },
        { name: 'businessRegistration', path: '/business/register', expectedElement: 'text=/business/i' }
      ]

      for (const flow of flows) {
        try {
          await page.goto(flow.path)
          
          // Check if page loads without major errors
          const pageStatus = await page.evaluate(() => {
            return {
              loaded: document.readyState,
              hasErrors: window.onerror !== null,
              title: document.title
            }
          })

          const flowAccessible = pageStatus.loaded === 'complete' && !pageStatus.hasErrors
          
          testReport.userFlows[flow.name] = {
            status: flowAccessible ? 'accessible' : 'errors_detected',
            details: `Page loads: ${pageStatus.loaded}, Title: ${pageStatus.title}, Errors: ${pageStatus.hasErrors}`
          }

          if (!flowAccessible) {
            testReport.recommendations.push(`Fix errors on ${flow.name} page`)
          }

        } catch (error) {
          testReport.userFlows[flow.name] = {
            status: 'navigation_failed',
            details: `Failed to navigate to ${flow.path}: ${error}`
          }
        }
      }
    })

    await test.step('Generate Integration Report', async () => {
      // Calculate overall health score
      const totalChecks = Object.keys(testReport.integrations).length + Object.keys(testReport.userFlows).length
      const successfulChecks = Object.values({...testReport.integrations, ...testReport.userFlows})
        .filter(check => check.status.includes('connected') || 
                       check.status.includes('working') || 
                       check.status.includes('available') ||
                       check.status.includes('accessible') ||
                       check.status.includes('complete'))
        .length

      const healthScore = Math.round((successfulChecks / totalChecks) * 100)

      testReport.summary = {
        healthScore,
        totalChecks,
        successfulChecks,
        criticalIssues: testReport.recommendations.length,
        overallStatus: healthScore >= 80 ? 'HEALTHY' : 
                      healthScore >= 60 ? 'NEEDS_ATTENTION' : 'CRITICAL'
      }

      // Save report to file
      await page.evaluate((report) => {
        console.log('='.repeat(80))
        console.log('🚀 SAVERLY API INTEGRATION VALIDATION REPORT')
        console.log('='.repeat(80))
        console.log(`Generated: ${report.timestamp}`)
        console.log(`Health Score: ${report.summary.healthScore}% (${report.summary.overallStatus})`)
        console.log(`Checks: ${report.summary.successfulChecks}/${report.summary.totalChecks} passed`)
        console.log('')
        
        console.log('🔧 INTEGRATION STATUS:')
        Object.entries(report.integrations).forEach(([name, status]) => {
          const icon = status.status.includes('connected') || status.status.includes('available') ? '✅' : '❌'
          console.log(`${icon} ${name.toUpperCase()}: ${status.status} - ${status.details}`)
        })
        
        console.log('')
        console.log('📱 USER FLOW STATUS:')
        Object.entries(report.userFlows).forEach(([name, status]) => {
          const icon = status.status.includes('accessible') || status.status.includes('complete') ? '✅' : '❌'
          console.log(`${icon} ${name.toUpperCase()}: ${status.status} - ${status.details}`)
        })
        
        if (report.recommendations.length > 0) {
          console.log('')
          console.log('⚠️ RECOMMENDATIONS:')
          report.recommendations.forEach((rec, index) => {
            console.log(`${index + 1}. ${rec}`)
          })
        }
        
        console.log('')
        console.log('='.repeat(80))
        
        return report
      }, testReport)

      // Assert overall health
      expect(testReport.summary.healthScore).toBeGreaterThan(50) // Minimum acceptable health
    })
  })
})