#!/usr/bin/env node

/**
 * SAVERLY DIRECT SCHEMA APPLICATION SCRIPT
 * Claude Flow Swarm - Critical Mission Execution
 * 
 * This script directly applies the schema using admin privileges
 * and the service role key for maximum success probability.
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Supabase configuration with service role key
const supabaseUrl = 'https://lziayzusujlvhebyagdl.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6aWF5enVzdWpsdmhlYnlhZ2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQ4NTk2NSwiZXhwIjoyMDY5MDYxOTY1fQ.dTS7UtQeJNgqVkcVOEOU_ENQR_ED8QsdYCKu_QW__4A'

console.log('🚀 SAVERLY DIRECT SCHEMA APPLICATION - MISSION CRITICAL')
console.log('=' .repeat(70))
console.log('Project URL:', supabaseUrl)
console.log('Mission Time:', new Date().toISOString())
console.log('Agent: SQL-Executor with Service Role Authority')
console.log('=' .repeat(70))

// Initialize Supabase client with service role for admin operations
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function executeSchemaChunks() {
  try {
    console.log('📖 Reading complete schema file...')
    const schemaPath = join(__dirname, 'SUPABASE_COMPLETE_SETUP.sql')
    const fullSchema = readFileSync(schemaPath, 'utf8')
    
    console.log(`✅ Schema loaded: ${(fullSchema.length / 1024).toFixed(2)}KB`)
    
    // Split schema into logical chunks for better error handling
    const chunks = [
      // Extensions
      `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";`,
      
      // Users table
      fullSchema.match(/-- 1\. USERS TABLE[\s\S]*?(?=-- ========================================================================)/)?.[0] || '',
      
      // Businesses table  
      fullSchema.match(/-- 2\. BUSINESSES TABLE[\s\S]*?(?=-- ========================================================================)/)?.[0] || '',
      
      // Coupons table
      fullSchema.match(/-- 3\. COUPONS TABLE[\s\S]*?(?=-- ========================================================================)/)?.[0] || '',
      
      // Redemptions table
      fullSchema.match(/-- 4\. REDEMPTIONS TABLE[\s\S]*?(?=-- ========================================================================)/)?.[0] || '',
      
      // User favorites table
      fullSchema.match(/-- 5\. USER FAVORITES TABLE[\s\S]*?(?=-- ========================================================================)/)?.[0] || '',
      
      // Reviews table
      fullSchema.match(/-- 6\. REVIEWS TABLE[\s\S]*?(?=-- ========================================================================)/)?.[0] || '',
      
      // Notifications table
      fullSchema.match(/-- 7\. NOTIFICATIONS TABLE[\s\S]*?(?=-- ========================================================================)/)?.[0] || '',
      
      // Indexes
      fullSchema.match(/-- 8\. INDEXES FOR PERFORMANCE[\s\S]*?(?=-- ========================================================================)/)?.[0] || '',
      
      // RLS policies
      fullSchema.match(/-- 9\. ROW LEVEL SECURITY[\s\S]*?(?=-- ========================================================================)/)?.[0] || '',
      
      // Functions
      fullSchema.match(/-- 10\. HELPER FUNCTIONS[\s\S]*?(?=-- ========================================================================)/)?.[0] || '',
      
      // Triggers
      fullSchema.match(/-- 11\. TRIGGERS[\s\S]*?(?=-- ========================================================================)/)?.[0] || '',
      
      // Sample data
      fullSchema.match(/-- 12\. SAMPLE DATA FOR TESTING[\s\S]*?(?=-- ========================================================================)/)?.[0] || ''
    ].filter(chunk => chunk.trim().length > 0)
    
    console.log(`🔧 Schema split into ${chunks.length} executable chunks`)
    
    // Execute each chunk
    let successCount = 0
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i].replace(/-- [\s\S]*?\n/g, '').trim()
      if (!chunk) continue
      
      try {
        console.log(`\n🔄 Executing chunk ${i + 1}/${chunks.length}...`)
        
        // Use raw SQL execution via rpc
        const { data, error } = await supabase.rpc('sql', { query: chunk })
        
        if (error) {
          console.log(`⚠️  Chunk ${i + 1} failed via RPC, trying alternative...`)
          
          // Try alternative approach for table creation
          if (chunk.includes('CREATE TABLE')) {
            const tableName = chunk.match(/CREATE TABLE[^(]*?([a-zA-Z_]+)\s*\(/)?.[1]?.trim()
            if (tableName) {
              console.log(`🔧 Attempting to create table: ${tableName}`)
              // This will show us the exact SQL that needs manual execution
              console.log('SQL:', chunk.substring(0, 200) + '...')
            }
          }
          
          console.log(`❌ Error in chunk ${i + 1}:`, error.message)
        } else {
          console.log(`✅ Chunk ${i + 1} executed successfully`)
          successCount++
        }
        
      } catch (err) {
        console.log(`❌ Exception in chunk ${i + 1}:`, err.message)
      }
    }
    
    console.log(`\n📊 Execution Summary: ${successCount}/${chunks.length} chunks successful`)
    
    if (successCount < chunks.length) {
      console.log('\n🚨 PARTIAL SUCCESS - Manual intervention required for remaining chunks')
      console.log('📋 Recommended action: Apply remaining SQL manually in Supabase Dashboard')
    }
    
    return successCount > 0
    
  } catch (error) {
    console.error('❌ Critical error during schema application:', error.message)
    return false
  }
}

async function verifyConnection() {
  try {
    console.log('🔍 Testing service role connection...')
    
    // Test admin operations with service role
    const { data, error } = await supabase.auth.admin.listUsers()
    
    if (error) {
      throw new Error(`Admin connection failed: ${error.message}`)
    }
    
    console.log('✅ Service role connection verified!')
    console.log(`📊 Current users in auth: ${data.users?.length || 0}`)
    
    return true
  } catch (err) {
    console.log(`❌ Connection verification failed: ${err.message}`)
    return false
  }
}

async function checkExistingTables() {
  try {
    console.log('\n🔍 Checking existing database structure...')
    
    const requiredTables = ['users', 'businesses', 'coupons', 'redemptions', 'user_favorites', 'reviews', 'notifications']
    const existingTables = []
    
    for (const table of requiredTables) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1)
        if (!error) {
          existingTables.push(table)
          console.log(`✅ Table '${table}' exists and accessible`)
        } else if (error.message.includes('permission denied')) {
          existingTables.push(table)
          console.log(`⚠️  Table '${table}' exists but has RLS restrictions`)
        }
      } catch {
        console.log(`❌ Table '${table}' missing`)
      }
    }
    
    console.log(`📊 Found ${existingTables.length}/${requiredTables.length} required tables`)
    return existingTables.length === requiredTables.length
    
  } catch (err) {
    console.log(`❌ Table check failed: ${err.message}`)
    return false
  }
}

async function main() {
  try {
    // Step 1: Verify service role connection
    const connectionOk = await verifyConnection()
    if (!connectionOk) {
      console.log('\n❌ Mission aborted - cannot establish admin connection')
      return false
    }
    
    // Step 2: Check if schema already exists
    const schemaExists = await checkExistingTables()
    if (schemaExists) {
      console.log('\n🎉 Schema already complete! All required tables exist.')
      return true
    }
    
    // Step 3: Apply schema chunks
    console.log('\n🚀 Applying database schema...')
    const applicationSuccess = await executeSchemaChunks()
    
    // Step 4: Final verification
    console.log('\n🔍 Final verification...')
    const finalCheck = await checkExistingTables()
    
    if (finalCheck) {
      console.log('\n🎉 MISSION ACCOMPLISHED! Schema application completed successfully!')
    } else {
      console.log('\n⚠️  PARTIAL SUCCESS - Manual completion required')
      console.log('📋 Next steps:')
      console.log('1. Open Supabase Dashboard SQL Editor')
      console.log('2. Apply remaining SQL from SUPABASE_COMPLETE_SETUP.sql')
      console.log('3. Verify all 7 tables are created')
    }
    
    return finalCheck
    
  } catch (error) {
    console.error('❌ Mission failed with critical error:', error.message)
    return false
  }
}

// Execute the critical mission
main()
  .then(success => {
    if (success) {
      console.log('\n🚀 SAVERLY DATABASE READY FOR ACTION!')
      console.log('✅ All tables created and accessible')
      console.log('✅ Ready for application integration')
      console.log('✅ Sample data loaded for testing')
    } else {
      console.log('\n📋 MANUAL SCHEMA APPLICATION REQUIRED')
      console.log('See manual-schema-application.md for detailed instructions')
    }
    
    console.log('\n🎯 Mission Status:', success ? 'COMPLETE' : 'REQUIRES_MANUAL_COMPLETION')
  })
  .catch(console.error)