import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lziayzusujlvhebyagdl.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6aWF5enVzdWpsdmhlYnlhZ2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQ4NTk2NSwiZXhwIjoyMDY5MDYxOTY1fQ.dTS7UtQeJNgqVkcVOEOU_ENQR_ED8QsdYCKu_QW__4A'

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Sample data for testing
const sampleBusinesses = [
  {
    name: "Giovanni's Italian Kitchen",
    description: "Authentic Italian cuisine with fresh ingredients and traditional recipes passed down through generations.",
    category: "Food & Beverage",
    address: "123 Main St",
    city: "San Francisco",
    state: "CA",
    zip_code: "94102",
    latitude: 37.7749,
    longitude: -122.4194,
    phone: "(415) 555-0123",
    email: "info@giovannis.com",
    contact_name: "Giovanni Rossi"
  },
  {
    name: "TechStyle Boutique",
    description: "Modern fashion and accessories for the tech-savvy professional.",
    category: "Retail",
    address: "456 Market St",
    city: "San Francisco",
    state: "CA",
    zip_code: "94105",
    latitude: 37.7849,
    longitude: -122.4094,
    phone: "(415) 555-0456",
    email: "hello@techstyle.com",
    contact_name: "Sarah Chen"
  },
  {
    name: "Zenith Wellness Spa",
    description: "Full-service spa offering massage therapy, facials, and wellness treatments.",
    category: "Health & Wellness",
    address: "789 Union St",
    city: "San Francisco",
    state: "CA",
    zip_code: "94108",
    latitude: 37.7949,
    longitude: -122.3994,
    phone: "(415) 555-0789",
    email: "bookings@zenithwellness.com",
    contact_name: "Maria Rodriguez"
  },
  {
    name: "Pixel Perfect Games",
    description: "Board game café and entertainment center with 500+ games.",
    category: "Entertainment & Recreation",
    address: "321 Castro St",
    city: "San Francisco",
    state: "CA",
    zip_code: "94114",
    latitude: 37.7649,
    longitude: -122.4394,
    phone: "(415) 555-0321",
    email: "play@pixelperfect.com",
    contact_name: "Alex Thompson"
  },
  {
    name: "Pristine Auto Detail",
    description: "Professional car detailing and maintenance services.",
    category: "Personal Services",
    address: "654 Folsom St",
    city: "San Francisco",
    state: "CA",
    zip_code: "94107",
    latitude: 37.7549,
    longitude: -122.4494,
    phone: "(415) 555-0654",
    email: "service@pristineauto.com",
    contact_name: "Mike Johnson"
  }
];

async function createSampleData() {
  try {
    console.log('🚀 Creating sample data for Saverly...\n');

    // Step 1: Verify tables exist
    console.log('🔍 Verifying database tables...');
    const tables = ['users', 'businesses', 'coupons', 'redemptions'];
    
    for (const table of tables) {
      const { error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.error(`❌ Table '${table}' not accessible:`, error.message);
        console.log('\n⚠️  Please ensure you have run the database schema first!');
        console.log('   Go to: https://supabase.com/dashboard/project/lziayzusujlvhebyagdl/sql');
        console.log('   And execute the contents of supabase-schema.sql');
        return;
      } else {
        console.log(`✅ Table '${table}' is ready`);
      }
    }

    // Step 2: Get existing auth users to create profile records
    console.log('\n👥 Syncing user profiles...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Could not fetch auth users:', authError.message);
    } else {
      console.log(`📋 Found ${authUsers.users.length} auth users`);
      
      for (const authUser of authUsers.users) {
        const { error: profileError } = await supabase
          .from('users')
          .upsert({
            uid: authUser.id,
            email: authUser.email,
            full_name: authUser.user_metadata?.full_name || 'User',
            account_type: authUser.user_metadata?.is_admin ? 'admin' : 'subscriber',
            is_admin: authUser.user_metadata?.is_admin || false,
            subscription_status: 'inactive',
            address: '123 Test St',
            city: 'San Francisco',
            state: 'CA',
            zip_code: '94102',
            latitude: 37.7749,
            longitude: -122.4194
          });

        if (profileError) {
          console.error(`❌ Could not create profile for ${authUser.email}:`, profileError.message);
        } else {
          console.log(`✅ Profile created/updated for ${authUser.email}`);
        }
      }
    }

    // Step 3: Create sample businesses
    console.log('\n🏢 Creating sample businesses...');
    const { data: businesses, error: businessError } = await supabase
      .from('businesses')
      .insert(sampleBusinesses)
      .select();

    if (businessError) {
      console.error('❌ Error creating businesses:', businessError.message);
    } else {
      console.log(`✅ Created ${businesses.length} sample businesses`);
      businesses.forEach(business => {
        console.log(`   📍 ${business.name} (${business.category})`);
      });
    }

    // Step 4: Create sample coupons
    if (businesses && businesses.length > 0) {
      console.log('\n🎫 Creating sample coupons...');
      
      const sampleCoupons = [
        {
          business_uid: businesses[0].uid,
          title: "20% Off Dinner",
          description: "Get 20% off your entire dinner order when you spend $50 or more.",
          discount: "20% off $50+",
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
          active: true,
          usage_limit: "one_time"
        },
        {
          business_uid: businesses[1].uid,
          title: "Buy One Get One 50% Off",
          description: "Buy any item and get the second one at 50% off. Perfect for updating your wardrobe!",
          discount: "BOGO 50% off",
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days
          active: true,
          usage_limit: "monthly",
          monthly_limit: 2
        },
        {
          business_uid: businesses[2].uid,
          title: "Relaxation Package Deal",
          description: "60-minute massage + facial combo for just $99 (regular $140).",
          discount: "$41 savings",
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days
          active: true,
          usage_limit: "one_time"
        },
        {
          business_uid: businesses[3].uid,
          title: "Game Night Special",
          description: "Free game rental with purchase of any food or drink item.",
          discount: "Free game rental",
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
          active: true,
          usage_limit: "daily"
        },
        {
          business_uid: businesses[4].uid,
          title: "Premium Detail Service",
          description: "Full interior and exterior detail service for $89 (regular $120).",
          discount: "$31 off detail",
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(), // 21 days
          active: true,
          usage_limit: "monthly",
          monthly_limit: 1
        }
      ];

      const { data: coupons, error: couponError } = await supabase
        .from('coupons')
        .insert(sampleCoupons)
        .select();

      if (couponError) {
        console.error('❌ Error creating coupons:', couponError.message);
      } else {
        console.log(`✅ Created ${coupons.length} sample coupons`);
        coupons.forEach(coupon => {
          console.log(`   🎫 ${coupon.title} - ${coupon.discount}`);
        });
      }
    }

    console.log('\n🎉 Sample data creation completed!');
    console.log('\n📋 Database Summary:');
    
    // Count records
    const { count: userCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
    const { count: businessCount } = await supabase.from('businesses').select('*', { count: 'exact', head: true });
    const { count: couponCount } = await supabase.from('coupons').select('*', { count: 'exact', head: true });
    const { count: redemptionCount } = await supabase.from('redemptions').select('*', { count: 'exact', head: true });

    console.log(`   👥 Users: ${userCount || 0}`);
    console.log(`   🏢 Businesses: ${businessCount || 0}`);
    console.log(`   🎫 Coupons: ${couponCount || 0}`);
    console.log(`   🎯 Redemptions: ${redemptionCount || 0}`);

    console.log('\n🔐 Test Login Credentials:');
    console.log('   Admin: admin@saverly.test / adminpass123');
    console.log('   User:  user@saverly.test / userpass123');

    console.log('\n✨ Your Saverly database is ready for testing!');

  } catch (error) {
    console.error('❌ Sample data creation failed:', error.message);
  }
}

createSampleData();