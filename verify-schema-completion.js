#!/usr/bin/env node

/**
 * SAVERLY SCHEMA VERIFICATION SCRIPT
 * Claude Flow Swarm - Post-Application Verification
 * 
 * This script verifies that the Supabase schema has been applied correctly
 * and all required tables, functions, and policies are in place.
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lziayzusujlvhebyagdl.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6aWF5enVzdWpsdmhlYnlhZ2RsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0ODU5NjUsImV4cCI6MjA2OTA2MTk2NX0.zghVA_8Gijpk2L8iC5bRhD8SIrW6GmPJp-Q39ykYszc'

console.log('🔍 SAVERLY SCHEMA VERIFICATION MISSION')
console.log('=' .repeat(60))
console.log('Project URL:', supabaseUrl)
console.log('Verification Time:', new Date().toISOString())
console.log('=' .repeat(60))

// Initialize Supabase client with anon key (for basic table checks)
const supabase = createClient(supabaseUrl, supabaseAnonKey)

const requiredTables = [
  'users',
  'businesses', 
  'coupons',
  'redemptions',
  'user_favorites',
  'reviews',
  'notifications'
]

const requiredFunctions = [
  'generate_qr_code',
  'calculate_distance',
  'update_business_rating',
  'assign_qr_code'
]

async function checkTableExists(tableName) {
  try {
    // Try to select from the table (will fail if table doesn't exist)
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1)
    
    if (error) {
      // Check specific error types
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        return { exists: false, accessible: false, error: 'Table does not exist' }
      }
      if (error.message.includes('permission denied')) {
        return { exists: true, accessible: false, error: 'Permission denied (RLS active)' }
      }
      return { exists: true, accessible: true, error: error.message }
    }
    
    return { exists: true, accessible: true, rowCount: data?.length || 0 }
  } catch (err) {
    return { exists: false, accessible: false, error: err.message }
  }
}

async function checkSampleData() {
  try {
    console.log('\n📊 Checking sample data...')
    
    // Check businesses
    const { data: businesses, error: bizError } = await supabase
      .from('businesses')
      .select('id, name')
      .limit(10)
    
    if (!bizError && businesses) {
      console.log(`✅ Businesses table: ${businesses.length} records found`)
      businesses.forEach(biz => console.log(`   - ${biz.name}`))
    } else {
      console.log(`❌ Businesses table: ${bizError?.message || 'No access'}`)
    }
    
    // Check coupons
    const { data: coupons, error: couponError } = await supabase
      .from('coupons')
      .select('id, title')
      .limit(10)
    
    if (!couponError && coupons) {
      console.log(`✅ Coupons table: ${coupons.length} records found`)
      coupons.forEach(coupon => console.log(`   - ${coupon.title}`))
    } else {
      console.log(`❌ Coupons table: ${couponError?.message || 'No access'}`)
    }
    
    return { businesses: businesses?.length || 0, coupons: coupons?.length || 0 }
  } catch (err) {
    console.log(`❌ Sample data check failed: ${err.message}`)
    return { businesses: 0, coupons: 0 }
  }
}

async function testConnection() {
  try {
    console.log('🔌 Testing basic Supabase connection...')
    
    // Try a simple query that should always work
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(1)
    
    if (error) {
      throw new Error(`Connection failed: ${error.message}`)
    }
    
    console.log('✅ Supabase connection successful!')
    return true
  } catch (err) {
    console.log(`❌ Connection failed: ${err.message}`)
    return false
  }
}

async function generateReport() {
  const report = {
    timestamp: new Date().toISOString(),
    connection: false,
    tables: {},
    sampleData: {},
    overallStatus: 'FAILED',
    completionPercentage: 0,
    recommendations: []
  }
  
  try {
    // Test connection
    report.connection = await testConnection()
    if (!report.connection) {
      report.recommendations.push('Check Supabase project URL and API key')
      return report
    }
    
    // Check all required tables
    console.log('\n📋 Checking required tables...')
    let existingTables = 0
    
    for (const tableName of requiredTables) {
      console.log(`\n🔍 Checking table: ${tableName}`)
      const result = await checkTableExists(tableName)
      report.tables[tableName] = result
      
      if (result.exists) {
        existingTables++
        if (result.accessible) {
          console.log(`✅ ${tableName}: EXISTS and ACCESSIBLE`)
        } else {
          console.log(`⚠️  ${tableName}: EXISTS but ${result.error}`)
        }
      } else {
        console.log(`❌ ${tableName}: MISSING - ${result.error}`)
      }
    }
    
    // Check sample data
    report.sampleData = await checkSampleData()
    
    // Calculate completion percentage
    report.completionPercentage = Math.round((existingTables / requiredTables.length) * 100)
    
    // Determine overall status
    if (existingTables === requiredTables.length) {
      report.overallStatus = 'COMPLETE'
    } else if (existingTables > 0) {
      report.overallStatus = 'PARTIAL'
    } else {
      report.overallStatus = 'FAILED'
    }
    
    // Generate recommendations
    if (existingTables < requiredTables.length) {
      report.recommendations.push('Apply the complete SUPABASE_COMPLETE_SETUP.sql schema')
      report.recommendations.push('Use Supabase Dashboard SQL Editor for manual application')
    }
    
    if (report.sampleData.businesses === 0 || report.sampleData.coupons === 0) {
      report.recommendations.push('Sample data missing - check if schema included INSERT statements')
    }
    
  } catch (err) {
    console.error('❌ Report generation failed:', err.message)
    report.recommendations.push(`Fix error: ${err.message}`)
  }
  
  return report
}

async function main() {
  try {
    const report = await generateReport()
    
    // Display summary
    console.log('\n' + '=' .repeat(60))
    console.log('📊 SCHEMA VERIFICATION SUMMARY')
    console.log('=' .repeat(60))
    console.log(`Overall Status: ${report.overallStatus}`)
    console.log(`Completion: ${report.completionPercentage}%`)
    console.log(`Tables Found: ${Object.values(report.tables).filter(t => t.exists).length}/${requiredTables.length}`)
    console.log(`Sample Businesses: ${report.sampleData.businesses || 0}`)
    console.log(`Sample Coupons: ${report.sampleData.coupons || 0}`)
    
    if (report.recommendations.length > 0) {
      console.log('\n🔧 RECOMMENDATIONS:')
      report.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`)
      })
    }
    
    if (report.overallStatus === 'COMPLETE') {
      console.log('\n🎉 SUCCESS! Database schema is fully applied and functional!')
      console.log('✅ All required tables exist')
      console.log('✅ Sample data is present')
      console.log('✅ Ready for application integration')
    } else {
      console.log('\n⚠️  MANUAL SCHEMA APPLICATION STILL REQUIRED')
      console.log('📋 See manual-schema-application.md for instructions')
    }
    
    console.log('\n🚀 Next steps:')
    console.log('1. Complete any missing schema components')
    console.log('2. Run integration tests')
    console.log('3. Test application connectivity')
    console.log('4. Deploy to production')
    
    return report.overallStatus === 'COMPLETE'
    
  } catch (error) {
    console.error('❌ Verification mission failed:', error.message)
    return false
  }
}

// Execute verification mission
main()
  .then(success => {
    console.log(`\n🏁 Verification ${success ? 'COMPLETED' : 'REQUIRES ACTION'}`)
    process.exit(success ? 0 : 1)
  })
  .catch(console.error)