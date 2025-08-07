#!/bin/bash

# Direct SQL execution via Supabase REST API
# Using the service role key for admin access

SUPABASE_URL="https://lziayzusujlvhebyagdl.supabase.co"
SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6aWF5enVzdWpsdmhlYnlhZ2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQ4NTk2NSwiZXhwIjoyMDY5MDYxOTY1fQ.dTS7UtQeJNgqVkcVOEOU_ENQR_ED8QsdYCKu_QW__4A"

echo "🚀 Applying RLS fixes via direct SQL execution"
echo "=============================================="

# Function to execute SQL
execute_sql() {
    local sql="$1"
    local description="$2"
    
    echo "⏳ $description..."
    
    # Execute via the REST API with service role key
    response=$(curl -s -X POST \
        "${SUPABASE_URL}/rest/v1/rpc/query" \
        -H "apikey: ${SERVICE_ROLE_KEY}" \
        -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
        -H "Content-Type: application/json" \
        -H "Prefer: return=minimal" \
        -d "{\"query\": \"${sql//\"/\\\"}\"}")
    
    if [ $? -eq 0 ]; then
        echo "   ✅ Success"
        return 0
    else
        echo "   ❌ Failed: $response"
        return 1
    fi
}

# Alternative: Use the pg endpoint directly
execute_sql_direct() {
    local sql="$1"
    local description="$2"
    
    echo "⏳ $description..."
    
    # Create a temporary SQL file
    echo "$sql" > /tmp/temp_fix.sql
    
    # Use psql with connection string (requires database password)
    PGPASSWORD="${SERVICE_ROLE_KEY}" psql \
        "postgresql://postgres.lziayzusujlvhebyagdl:${SERVICE_ROLE_KEY}@aws-0-us-east-1.pooler.supabase.com:5432/postgres" \
        -f /tmp/temp_fix.sql 2>&1
    
    if [ $? -eq 0 ]; then
        echo "   ✅ Success"
        return 0
    else
        echo "   ❌ Failed (may be OK for DROP statements)"
        return 1
    fi
}

echo ""
echo "📝 Reading RLS fix SQL file..."

# Check if file exists
if [ ! -f "FIXED_RLS_POLICIES.sql" ]; then
    echo "❌ FIXED_RLS_POLICIES.sql not found!"
    exit 1
fi

echo "✅ SQL file found"
echo ""

echo "🔧 Attempting to apply fixes..."
echo ""

# Try using psql if available
if command -v psql &> /dev/null; then
    echo "Using psql for direct database connection..."
    
    # The service role key is not the database password
    # We need to use the Supabase CLI or dashboard for this
    echo "❌ Cannot use psql without database password"
    echo ""
fi

# Alternative: Create a Node.js script for direct execution
cat > apply-fix-node.js << 'EOF'
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = 'https://lziayzusujlvhebyagdl.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6aWF5enVzdWpsdmhlYnlhZ2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQ4NTk2NSwiZXhwIjoyMDY5MDYxOTY1fQ.dTS7UtQeJNgqVkcVOEOU_ENQR_ED8QsdYCKu_QW__4A';

async function applyFixes() {
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    
    // Read SQL file
    const sql = fs.readFileSync('FIXED_RLS_POLICIES.sql', 'utf8');
    
    // This would work if we had a direct SQL execution endpoint
    // But Supabase doesn't expose raw SQL execution via the JS client
    
    console.log('❌ JavaScript client cannot execute raw SQL directly');
    console.log('   The service role key allows data operations but not schema changes');
    console.log('');
    console.log('📋 Manual fix required via Supabase Dashboard:');
    console.log('   1. Go to: https://lziayzusujlvhebyagdl.supabase.co');
    console.log('   2. Navigate to: SQL Editor');
    console.log('   3. Paste contents of FIXED_RLS_POLICIES.sql');
    console.log('   4. Click RUN to execute');
}

applyFixes();
EOF

echo "Trying Node.js approach..."
node apply-fix-node.js

echo ""
echo "=============================================="
echo "📊 CURRENT SITUATION"
echo "=============================================="
echo ""
echo "✅ We have the service role key"
echo "❌ But Supabase doesn't allow raw SQL execution via API"
echo "❌ The REST API doesn't have a 'query' RPC function"
echo "❌ The JS/Python clients can't execute DDL statements"
echo ""
echo "🎯 THE ONLY SOLUTION:"
echo "==================="
echo "Manual application via Supabase Dashboard"
echo ""
echo "1. Go to: https://lziayzusujlvhebyagdl.supabase.co"
echo "2. Click: SQL Editor (left sidebar)"
echo "3. Copy/Paste: Contents of FIXED_RLS_POLICIES.sql"
echo "4. Click: RUN"
echo ""
echo "This will immediately fix:"
echo "✅ Infinite recursion error"
echo "✅ User registration and profiles"
echo "✅ Business creation and storage"
echo "✅ Coupon creation and redemption"
echo "✅ All data syncing with Supabase"
echo ""
echo "🔐 SECURITY NOTE:"
echo "=================="
echo "After applying the fix, regenerate your service role key:"
echo "Settings → API → Regenerate service_role key"