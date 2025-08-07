/**
 * Manual Integration Validation Script
 * Tests API integrations directly without requiring full application context
 */

import { createClient } from '@supabase/supabase-js'

console.log('🚀 SAVERLY API INTEGRATION VALIDATION')
console.log('=' .repeat(80))

const report = {
  timestamp: new Date().toISOString(),
  integrations: {},
  recommendations: [],
  overallStatus: 'UNKNOWN'
}

async function validateSupabase() {
  console.log('🔍 Testing Supabase Integration...')
  
  try {
    const supabaseUrl = 'https://lziayzusujlvhebyagdl.supabase.co'
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6aWF5enVzdWpsdmhlYnlhZ2RsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0ODU5NjUsImV4cCI6MjA2OTA2MTk2NX0.zghVA_8Gijpk2L8iC5bRhD8SIrW6GmPJp-Q39ykYszc'
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Test basic connection
    const { data, error } = await supabase.from('users').select('count').limit(1)
    
    if (error) {
      report.integrations.supabase = {
        status: 'CONNECTION_ERROR',
        details: `Supabase connection failed: ${error.message}`,
        recommendations: ['Verify Supabase URL and API key', 'Check database permissions']
      }
      console.log('❌ Supabase: CONNECTION_ERROR')
      console.log(`   Details: ${error.message}`)
    } else {
      // Test table structure
      const tables = ['users', 'businesses', 'coupons', 'redemptions']
      const tableResults = {}
      
      for (const table of tables) {
        try {
          const { data, error } = await supabase.from(table).select('*').limit(1)
          tableResults[table] = error ? 'ERROR' : 'ACCESSIBLE'
        } catch (err) {
          tableResults[table] = 'ERROR'
        }
      }
      
      const accessibleTables = Object.values(tableResults).filter(status => status === 'ACCESSIBLE').length
      const totalTables = Object.keys(tableResults).length
      
      report.integrations.supabase = {
        status: accessibleTables === totalTables ? 'FULLY_CONNECTED' : 'PARTIALLY_CONNECTED',
        details: `Connection successful. Tables: ${accessibleTables}/${totalTables} accessible`,
        tableAccess: tableResults,
        recommendations: accessibleTables < totalTables ? ['Fix table access permissions for missing tables'] : []
      }
      
      console.log(`✅ Supabase: ${report.integrations.supabase.status}`)
      console.log(`   Tables accessible: ${accessibleTables}/${totalTables}`)
      console.log(`   Details:`, tableResults)
    }
    
  } catch (error) {
    report.integrations.supabase = {
      status: 'INITIALIZATION_ERROR',
      details: `Failed to initialize Supabase client: ${error.message}`,
      recommendations: ['Check Supabase configuration', 'Verify network connectivity']
    }
    console.log('❌ Supabase: INITIALIZATION_ERROR')
    console.log(`   Details: ${error.message}`)
  }
}

async function validateGoogleMaps() {
  console.log('🔍 Testing Google Maps Integration...')
  
  // Since we can't test Google Maps directly without a browser,
  // we'll validate the configuration
  const mapsApiKey = process.env.VITE_GOOGLE_MAPS_API_KEY || 'your_secure_api_key_here'
  
  if (mapsApiKey === 'your_secure_api_key_here' || !mapsApiKey) {
    report.integrations.googleMaps = {
      status: 'API_KEY_MISSING',
      details: 'Google Maps API key not configured',
      recommendations: ['Configure valid Google Maps API key in environment variables']
    }
    console.log('❌ Google Maps: API_KEY_MISSING')
  } else {
    report.integrations.googleMaps = {
      status: 'CONFIGURED',
      details: 'Google Maps API key is configured',
      recommendations: ['Verify API key has proper permissions for Places API']
    }
    console.log('✅ Google Maps: CONFIGURED')
  }
}

async function validateStripe() {
  console.log('🔍 Testing Stripe Integration...')
  
  const stripePublicKey = process.env.VITE_STRIPE_PUBLISHABLE_KEY
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY
  
  if (!stripePublicKey || stripePublicKey.includes('[TO_BE_ADDED]')) {
    report.integrations.stripe = {
      status: 'KEYS_MISSING',
      details: 'Stripe keys not properly configured',
      recommendations: ['Configure Stripe publishable and secret keys']
    }
    console.log('❌ Stripe: KEYS_MISSING')
  } else {
    const keyType = stripePublicKey.startsWith('pk_test_') ? 'TEST_MODE' : 
                   stripePublicKey.startsWith('pk_live_') ? 'LIVE_MODE' : 'INVALID_FORMAT'
    
    report.integrations.stripe = {
      status: keyType === 'INVALID_FORMAT' ? 'INVALID_KEYS' : 'CONFIGURED',
      details: `Stripe configured in ${keyType}`,
      recommendations: keyType === 'TEST_MODE' ? ['Switch to live keys for production'] : []
    }
    console.log(`✅ Stripe: ${keyType}`)
  }
}

async function validateDatabaseSchema() {
  console.log('🔍 Testing Database Schema...')
  
  try {
    const supabaseUrl = 'https://lziayzusujlvhebyagdl.supabase.co'
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6aWF5enVzdWpsdmhlYnlhZ2RsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0ODU5NjUsImV4cCI6MjA2OTA2MTk2NX0.zghVA_8Gijpk2L8iC5bRhD8SIrW6GmPJp-Q39ykYszc'
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Test critical table relationships
    const schemaTests = [
      {
        name: 'User Registration Flow',
        test: async () => {
          // Test if we can query users table structure
          const { data, error } = await supabase.from('users').select('uid, email, full_name, subscription_status').limit(1)
          return { success: !error, details: error?.message || 'User table accessible with key fields' }
        }
      },
      {
        name: 'Business-Coupon Relationship',
        test: async () => {
          // Test businesses and coupons relationship
          const { data, error } = await supabase
            .from('coupons')
            .select('uid, title, business_uid, businesses(name)')
            .limit(1)
          return { success: !error, details: error?.message || 'Business-coupon relationship working' }
        }
      },
      {
        name: 'Redemption Tracking',
        test: async () => {
          // Test redemptions table
          const { data, error } = await supabase
            .from('redemptions')
            .select('uid, user_uid, coupon_uid, business_uid, status')
            .limit(1)
          return { success: !error, details: error?.message || 'Redemption tracking table accessible' }
        }
      }
    ]
    
    const schemaResults = {}
    for (const test of schemaTests) {
      try {
        const result = await test.test()
        schemaResults[test.name] = result
      } catch (error) {
        schemaResults[test.name] = { success: false, details: error.message }
      }
    }
    
    const successfulTests = Object.values(schemaResults).filter(r => r.success).length
    const totalTests = Object.keys(schemaResults).length
    
    report.integrations.databaseSchema = {
      status: successfulTests === totalTests ? 'COMPLETE' : 'INCOMPLETE',
      details: `Schema validation: ${successfulTests}/${totalTests} tests passed`,
      testResults: schemaResults,
      recommendations: successfulTests < totalTests ? ['Fix database schema and relationship issues'] : []
    }
    
    console.log(`${successfulTests === totalTests ? '✅' : '❌'} Database Schema: ${report.integrations.databaseSchema.status}`)
    console.log(`   Tests passed: ${successfulTests}/${totalTests}`)
    
    Object.entries(schemaResults).forEach(([name, result]) => {
      console.log(`   ${result.success ? '✅' : '❌'} ${name}: ${result.details}`)
    })
    
  } catch (error) {
    report.integrations.databaseSchema = {
      status: 'ERROR',
      details: `Schema validation failed: ${error.message}`,
      recommendations: ['Fix database connection and schema setup']
    }
    console.log('❌ Database Schema: ERROR')
    console.log(`   Details: ${error.message}`)
  }
}

async function generateReport() {
  console.log('\n' + '='.repeat(80))
  console.log('📊 INTEGRATION VALIDATION SUMMARY')
  console.log('='.repeat(80))
  
  const integrations = Object.keys(report.integrations)
  const healthyIntegrations = Object.values(report.integrations)
    .filter(integration => 
      integration.status.includes('CONNECTED') || 
      integration.status.includes('CONFIGURED') ||
      integration.status.includes('COMPLETE')
    ).length
  
  const healthScore = Math.round((healthyIntegrations / integrations.length) * 100)
  
  report.summary = {
    healthScore,
    totalIntegrations: integrations.length,
    healthyIntegrations,
    overallStatus: healthScore >= 80 ? 'HEALTHY' : 
                   healthScore >= 60 ? 'NEEDS_ATTENTION' : 'CRITICAL'
  }
  
  console.log(`Health Score: ${healthScore}% (${report.summary.overallStatus})`)
  console.log(`Integrations: ${healthyIntegrations}/${integrations.length} operational`)
  console.log('')
  
  // Collect all recommendations
  Object.values(report.integrations).forEach(integration => {
    if (integration.recommendations && integration.recommendations.length > 0) {
      report.recommendations.push(...integration.recommendations)
    }
  })
  
  if (report.recommendations.length > 0) {
    console.log('⚠️ RECOMMENDATIONS:')
    report.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`)
    })
    console.log('')
  }
  
  // Critical user flows analysis
  console.log('🎯 CRITICAL USER FLOWS READINESS:')
  
  const flowReadiness = {
    'User Registration': report.integrations.supabase?.status.includes('CONNECTED') && 
                        report.integrations.googleMaps?.status === 'CONFIGURED',
    'Subscription Purchase': report.integrations.stripe?.status === 'CONFIGURED' &&
                           report.integrations.supabase?.status.includes('CONNECTED'),
    'Coupon Redemption': report.integrations.databaseSchema?.status === 'COMPLETE',
    'Business Registration': report.integrations.googleMaps?.status === 'CONFIGURED' &&
                           report.integrations.supabase?.status.includes('CONNECTED')
  }
  
  Object.entries(flowReadiness).forEach(([flow, ready]) => {
    console.log(`${ready ? '✅' : '❌'} ${flow}: ${ready ? 'READY' : 'DEPENDENCIES_MISSING'}`)
  })
  
  const readyFlows = Object.values(flowReadiness).filter(ready => ready).length
  const totalFlows = Object.keys(flowReadiness).length
  
  console.log('')
  console.log(`USER FLOW READINESS: ${readyFlows}/${totalFlows} flows ready`)
  console.log('='.repeat(80))
  
  return report
}

// Run all validations
async function runValidation() {
  console.log(`Started: ${report.timestamp}\n`)
  
  await validateSupabase()
  await validateGoogleMaps()
  await validateStripe() 
  await validateDatabaseSchema()
  
  const finalReport = await generateReport()
  
  // Save report to file
  const fs = await import('fs')
  const reportPath = './integration-validation-report.json'
  fs.writeFileSync(reportPath, JSON.stringify(finalReport, null, 2))
  console.log(`📄 Full report saved to: ${reportPath}`)
  
  return finalReport
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runValidation().catch(console.error)
}

export { runValidation }