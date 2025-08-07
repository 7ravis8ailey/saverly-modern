#!/usr/bin/env node
/**
 * Debug User-Business Relationship
 * Check why the foreign key constraint is failing
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lziayzusujlvhebyagdl.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6aWF5enVzdWpsdmhlYnlhZ2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQ4NTk2NSwiZXhwIjoyMDY5MDYxOTY1fQ.dTS7UtQeJNgqVkcVOEOU_ENQR_ED8QsdYCKu_QW__4A';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6aWF5enVzdWpsdmhlYnlhZ2RsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0ODU5NjUsImV4cCI6MjA2OTA2MTk2NX0.zghVA_8Gijpk2L8iC5bRhD8SIrW6GmPJp-Q39ykYszc';

async function debugUserBusinessRelationship() {
  console.log('🔍 DEBUGGING USER-BUSINESS RELATIONSHIP');
  console.log('======================================\n');
  
  const adminClient = createClient(SUPABASE_URL, SERVICE_KEY);
  const userClient = createClient(SUPABASE_URL, ANON_KEY);
  
  // Step 1: Check what's in auth.users vs public.users
  console.log('1️⃣ Checking User Tables');
  console.log('------------------------');
  
  try {
    // Check auth.users (Supabase Auth)
    const { data: authUsers, error: authError } = await adminClient.auth.admin.listUsers();
    console.log(`✅ Auth Users: ${authUsers?.users?.length || 0} found`);
    
    if (authUsers?.users?.length > 0) {
      console.log('   Recent auth users:');
      authUsers.users.slice(-3).forEach(user => {
        console.log(`   - ${user.email} (ID: ${user.id})`);
      });
    }
    
    // Check public.users table
    const { data: publicUsers, error: publicError } = await adminClient
      .from('users')
      .select('id, email, full_name')
      .limit(10);
    
    if (publicError) {
      console.log(`❌ Public Users Error: ${publicError.message}`);
    } else {
      console.log(`✅ Public Users: ${publicUsers?.length || 0} found`);
      if (publicUsers?.length > 0) {
        console.log('   Recent public users:');
        publicUsers.forEach(user => {
          console.log(`   - ${user.email} (ID: ${user.id})`);
        });
      }
    }
    
  } catch (e) {
    console.log(`❌ Error checking users: ${e.message}`);
  }
  
  // Step 2: Check foreign key constraint
  console.log('\n2️⃣ Checking Foreign Key Constraint');
  console.log('-----------------------------------');
  
  try {
    // Get constraint info
    const constraintQuery = `
      SELECT 
        tc.constraint_name, 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name='businesses'
        AND kcu.column_name = 'owner_id';
    `;
    
    const { data: constraints, error: constraintError } = await adminClient
      .rpc('query', { query: constraintQuery });
    
    if (constraintError) {
      console.log('ℹ️  Checking constraint manually...');
      console.log('   The businesses.owner_id likely references auth.users.id or public.users.id');
      
      // Check if the constraint expects public.users
      console.log('\n3️⃣ Testing User Creation & Profile');
      console.log('----------------------------------');
      
      // Create a test user
      const testEmail = `debug${Date.now()}@test.com`;
      const { data: newUser, error: createError } = await userClient.auth.signUp({
        email: testEmail,
        password: 'TestPassword123!'
      });
      
      if (createError) {
        console.log(`❌ User creation failed: ${createError.message}`);
        return;
      }
      
      console.log(`✅ Auth user created: ${newUser.user.id}`);
      
      // Try to create a public.users record
      const publicUserData = {
        id: newUser.user.id,
        email: newUser.user.email,
        full_name: 'Debug Test User',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data: publicUser, error: publicUserError } = await adminClient
        .from('users')
        .insert([publicUserData])
        .select()
        .single();
      
      if (publicUserError) {
        console.log(`❌ Public user creation failed: ${publicUserError.message}`);
        
        if (publicUserError.message.includes('duplicate key')) {
          console.log('ℹ️  User already exists in public.users - that\'s good!');
          
          // Get the existing user
          const { data: existingUser } = await adminClient
            .from('users')
            .select('*')
            .eq('id', newUser.user.id)
            .single();
          
          if (existingUser) {
            console.log(`✅ Found existing public user: ${existingUser.email}`);
          }
        }
      } else {
        console.log(`✅ Public user created: ${publicUser.email}`);
      }
      
      // Now try to create a business with this user
      console.log('\n4️⃣ Testing Business Creation');
      console.log('-----------------------------');
      
      const businessData = {
        name: 'Debug Test Business',
        description: 'Testing foreign key relationship',
        category: 'Test',
        formatted_address: '123 Test Street, Test City, TC 12345',
        latitude: 40.7128,
        longitude: -74.0060,
        owner_id: newUser.user.id,  // Use the auth user ID
        active: true
      };
      
      const { data: business, error: businessError } = await adminClient
        .from('businesses')
        .insert([businessData])
        .select()
        .single();
      
      if (businessError) {
        console.log(`❌ Business creation failed: ${businessError.message}`);
        
        if (businessError.message.includes('foreign key constraint')) {
          console.log('\n💡 SOLUTION NEEDED:');
          console.log('The businesses.owner_id foreign key constraint expects a user to exist in public.users table.');
          console.log('Your app needs to create a public.users record when someone registers.');
          console.log('\nThis can be done with:');
          console.log('1. A database trigger (automatic)');
          console.log('2. In your app registration flow (manual)');
        }
      } else {
        console.log(`✅ Business created successfully!`);
        console.log(`   Business ID: ${business.id}`);
        console.log(`   Owner ID: ${business.owner_id}`);
        
        // Clean up
        await adminClient.from('businesses').delete().eq('id', business.id);
      }
      
    } else {
      console.log('✅ Foreign key constraints:');
      constraints.forEach(c => {
        console.log(`   ${c.table_name}.${c.column_name} → ${c.foreign_table_name}.${c.foreign_column_name}`);
      });
    }
    
  } catch (e) {
    console.log(`❌ Error: ${e.message}`);
  }
}

debugUserBusinessRelationship().catch(console.error);