#!/usr/bin/env node

/**
 * SAVERLY MODERN v2.0.0 - Supabase RLS Fix Test Script
 * Tests the database connection and applies the RLS fix
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = 'https://lziayzusujlvhebyagdl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6aWF5enVzdWpsdmhlYnlhZ2RsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0ODU5NjUsImV4cCI6MjA2OTA2MTk2NX0.zghVA_8Gijpk2L8iC5bRhD8SIrW6GmPJp-Q39ykYszc';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testDatabaseConnection() {
  console.log('\n🔍 Testing Supabase Database Connection...\n');
  
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('users')
      .select('count(*)', { count: 'exact' });
    
    if (error) {
      console.error('❌ Database Connection Error:', error.message);
      
      if (error.message.includes('infinite recursion')) {
        console.log('\n🔧 INFINITE RECURSION DETECTED - Applying fix...\n');
        return await applyRLSFix();
      }
      
      return false;
    }
    
    console.log('✅ Database connection successful');
    console.log(`📊 Users table accessible (${data?.[0]?.count || 0} records)`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    return false;
  }
}

async function applyRLSFix() {
  console.log('🔧 Applying RLS Policy Fix...\n');
  
  try {
    // Read the fixed RLS policies
    const fixedPoliciesPath = path.join(process.cwd(), 'FIXED_RLS_POLICIES.sql');
    
    if (!fs.existsSync(fixedPoliciesPath)) {
      console.error('❌ FIXED_RLS_POLICIES.sql not found!');
      return false;
    }
    
    const sqlContent = fs.readFileSync(fixedPoliciesPath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📋 Applying ${statements.length} SQL statements...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.includes('DROP') || statement.includes('CREATE') || statement.includes('GRANT')) {
        try {
          const { error } = await supabase.rpc('exec_sql', { query: statement });
          
          if (error) {
            console.log(`⚠️  Statement ${i + 1}: ${error.message}`);
            errorCount++;
          } else {
            successCount++;
          }
        } catch (error) {
          console.log(`⚠️  Statement ${i + 1}: ${error.message}`);
          errorCount++;
        }
      }
    }
    
    console.log(`\n📊 Results: ${successCount} successful, ${errorCount} errors`);
    
    if (successCount > 0) {
      console.log('\n✅ RLS policies have been updated!');
      console.log('🔄 Testing connection again...\n');
      
      // Test again after applying fix
      return await testDatabaseConnection();
    }
    
  } catch (error) {
    console.error('❌ Failed to apply RLS fix:', error.message);
  }
  
  return false;
}

async function testTableAccess() {
  console.log('\n🔍 Testing table access with new policies...\n');
  
  const tables = ['users', 'businesses', 'coupons', 'redemptions'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: accessible (${data?.length || 0} records)`);
      }
    } catch (error) {
      console.log(`❌ ${table}: ${error.message}`);
    }
  }
}

async function main() {
  console.log('🚀 Saverly Modern v2.0.0 - Database RLS Fix Test\n');
  console.log(`📍 Database: ${SUPABASE_URL}`);
  console.log(`🔑 Using anonymous key: ${SUPABASE_ANON_KEY.substring(0, 20)}...\n`);
  
  // Test connection (will apply fix if needed)
  const connectionOk = await testDatabaseConnection();
  
  if (connectionOk) {
    await testTableAccess();
    console.log('\n🎉 Database is ready for Saverly Modern v2.0.0!');
  } else {
    console.log('\n❌ Database connection failed. Please check:');
    console.log('1. Supabase project is running');
    console.log('2. Environment variables are correct');
    console.log('3. RLS policies are properly configured');
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection:', error.message);
  process.exit(1);
});

main().catch(error => {
  console.error('❌ Script failed:', error.message);
  process.exit(1);
});