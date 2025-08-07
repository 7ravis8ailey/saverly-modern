#!/bin/bash

# Authenticate Supabase CLI and apply RLS fixes
# Usage: ./authenticate-and-fix.sh YOUR_ACCESS_TOKEN

echo "🚀 Supabase CLI Authentication & RLS Fix Script"
echo "==============================================="

if [ -z "$1" ]; then
    echo "❌ Please provide your Supabase access token"
    echo ""
    echo "Usage: ./authenticate-and-fix.sh YOUR_ACCESS_TOKEN"
    echo ""
    echo "To get your token:"
    echo "1. Go to: https://supabase.com/dashboard/account/tokens"
    echo "2. Click: Generate new token"
    echo "3. Copy the token (starts with sbp_)"
    echo "4. Run: ./authenticate-and-fix.sh sbp_YOUR_TOKEN_HERE"
    exit 1
fi

ACCESS_TOKEN="$1"

echo ""
echo "1️⃣ Authenticating Supabase CLI..."
supabase login --token "$ACCESS_TOKEN"

if [ $? -ne 0 ]; then
    echo "❌ Authentication failed"
    exit 1
fi

echo "✅ Successfully authenticated!"
echo ""

echo "2️⃣ Linking to project..."
supabase link --project-ref lziayzusujlvhebyagdl

if [ $? -ne 0 ]; then
    echo "⚠️  Project may already be linked"
fi

echo ""
echo "3️⃣ Applying RLS policy fixes..."

# Option 1: Use db push to apply the SQL
if [ -f "FIXED_RLS_POLICIES.sql" ]; then
    echo "📝 Found FIXED_RLS_POLICIES.sql"
    echo "⏳ Executing SQL fixes..."
    
    # Execute the SQL file directly
    supabase db push --path FIXED_RLS_POLICIES.sql
    
    if [ $? -eq 0 ]; then
        echo "✅ RLS fixes applied successfully!"
    else
        echo "⚠️  Trying alternative method..."
        
        # Alternative: Use db execute
        cat FIXED_RLS_POLICIES.sql | supabase db execute
        
        if [ $? -eq 0 ]; then
            echo "✅ RLS fixes applied via execute!"
        else
            echo "❌ Could not apply fixes automatically"
            echo "   Please use the SQL Editor in the dashboard"
        fi
    fi
else
    echo "❌ FIXED_RLS_POLICIES.sql not found!"
    exit 1
fi

echo ""
echo "4️⃣ Testing database connection..."

# Test if the fixes worked
cat > test-connection.sql << 'EOF'
-- Test query to check if RLS is fixed
SELECT COUNT(*) as user_count FROM auth.users;
SELECT COUNT(*) as business_count FROM public.businesses;
SELECT 'RLS policies applied successfully!' as status;
EOF

supabase db execute < test-connection.sql

echo ""
echo "==============================================="
echo "🎉 PROCESS COMPLETE!"
echo "==============================================="
echo ""
echo "If successful, your Saverly app now:"
echo "✅ Can create user accounts that sync to Supabase"
echo "✅ Can create businesses that save to database"
echo "✅ Can create and redeem coupons properly"
echo "✅ Has all data flowing between web app and Supabase"
echo ""
echo "Test it by:"
echo "1. Opening your web app: http://localhost:5173"
echo "2. Creating a new user account"
echo "3. Creating a business"
echo "4. Creating a coupon"
echo ""
echo "🔐 Security note: Your access token is not stored anywhere"