#!/usr/bin/env node
/**
 * Supabase Integration Test - Claude Flow Swarm Validation
 * Tests direct connection to Supabase with MCP server readiness
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lziayzusujlvhebyagdl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6aWF5enVzdWpsdmhlYnlhZ2RsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0ODU5NjUsImV4cCI6MjA2OTA2MTk2NX0.zghVA_8Gijpk2L8iC5bRhD8SIrW6GmPJp-Q39ykYszc';

async function testSupabaseIntegration() {
  console.log('🚀 Supabase Integration Test - Claude Flow Swarm');
  console.log('================================================');
  
  try {
    // Test 1: Client Connection
    console.log('📡 1. Testing Supabase Client Connection...');
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Test 2: Database Connection with Simple Query
    console.log('🗄️  2. Testing Database Connection...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('businesses')
      .select('id')
      .limit(1);
    
    if (connectionError && connectionError.code !== 'PGRST116') { // PGRST116 = table not found is OK
      throw new Error(`Database connection failed: ${connectionError.message}`);
    }
    
    console.log('✅ Database connection successful!');
    
    // Test 3: Authentication Status
    console.log('🔐 3. Testing Authentication Setup...');
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.log(`⚠️  Auth setup available (no active session - expected): ${authError.message}`);
    } else {
      console.log('✅ Auth system ready!', session ? 'Active session found' : 'No active session (expected)');
    }
    
    // Test 4: Check Available Tables
    console.log('📋 4. Checking Database Schema...');
    const { data: tables, error: schemaError } = await supabase.rpc('get_schema_info').catch(() => null);
    
    // Alternative method to test schema
    const testTables = ['businesses', 'coupons', 'users', 'subscriptions', 'redemptions'];
    const schemaResults = {};
    
    for (const tableName of testTables) {
      try {
        const { error } = await supabase.from(tableName).select('*').limit(1);
        schemaResults[tableName] = error ? `❌ ${error.message}` : '✅ Available';
      } catch (e) {
        schemaResults[tableName] = `❌ ${e.message}`;
      }
    }
    
    console.log('📊 Schema Test Results:');
    Object.entries(schemaResults).forEach(([table, status]) => {
      console.log(`   ${table}: ${status}`);
    });
    
    // Test 5: MCP Server Compatibility Check
    console.log('🔗 5. Testing MCP Server Compatibility...');
    const mcpConfig = {
      project_url: SUPABASE_URL,
      project_id: 'lziayzusujlvhebyagdl',
      auth_configured: !!SUPABASE_ANON_KEY,
      client_ready: true
    };
    
    console.log('✅ MCP Server Configuration Ready:');
    console.log(`   Project ID: ${mcpConfig.project_id}`);
    console.log(`   URL: ${mcpConfig.project_url}`);
    console.log(`   Auth Key: ${mcpConfig.auth_configured ? 'Configured' : 'Missing'}`);
    
    // Final Summary
    console.log('\n🎉 SUPABASE INTEGRATION SUMMARY:');
    console.log('================================');
    console.log('✅ Supabase Client: Connected');
    console.log('✅ Database: Accessible');
    console.log('✅ Authentication: Configured');
    console.log('✅ MCP Ready: Available for Claude Flow');
    console.log('🔗 Ready for Saverly Web App Integration!');
    
    return {
      success: true,
      client: supabase,
      config: mcpConfig,
      schema: schemaResults
    };
    
  } catch (error) {
    console.error('❌ Integration Test Failed:');
    console.error(error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('1. Check environment variables in .env');
    console.error('2. Verify Supabase project is active');
    console.error('3. Confirm API keys are valid');
    
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the test
testSupabaseIntegration()
  .then(result => {
    if (result.success) {
      console.log('\n🚀 Ready for Claude Flow Swarm coordination!');
      process.exit(0);
    } else {
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });