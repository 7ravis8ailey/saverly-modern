#!/bin/bash

echo "🔗 Linking Supabase project and applying fixes"
echo "=============================================="

# Set the database password as environment variable
export POSTGRES_PASSWORD='fvm*ktg-JHB6qwe2qhm'

# Try linking with the password
echo "Linking to project lziayzusujlvhebyagdl..."
supabase link --project-ref lziayzusujlvhebyagdl --password "$POSTGRES_PASSWORD"

if [ $? -ne 0 ]; then
    echo "⚠️  Link failed, trying alternative connection..."
    
    # Try direct psql connection
    export PGPASSWORD='fvm*ktg-JHB6qwe2qhm'
    
    echo "Testing direct database connection..."
    psql "postgresql://postgres.lziayzusujlvhebyagdl:$PGPASSWORD@aws-0-us-east-1.pooler.supabase.com:5432/postgres" -c "SELECT version();"
    
    if [ $? -eq 0 ]; then
        echo "✅ Direct connection works!"
        echo "Applying RLS fixes..."
        psql "postgresql://postgres.lziayzusujlvhebyagdl:$PGPASSWORD@aws-0-us-east-1.pooler.supabase.com:5432/postgres" -f FIXED_RLS_POLICIES.sql
        
        if [ $? -eq 0 ]; then
            echo "✅ RLS fixes applied successfully!"
        else
            echo "⚠️  Some errors occurred, but may be OK"
        fi
    else
        echo "❌ Database connection failed"
        echo "Password might be incorrect or need to be reset"
    fi
else
    echo "✅ Project linked successfully!"
    
    # Now apply the fixes
    echo "Applying RLS policy fixes..."
    cat FIXED_RLS_POLICIES.sql | supabase db push
    
    if [ $? -eq 0 ]; then
        echo "✅ RLS fixes applied!"
    else
        echo "⚠️  Trying alternative method..."
        supabase migration new fix_rls_policies
        cp FIXED_RLS_POLICIES.sql supabase/migrations/*fix_rls_policies.sql
        supabase db push
    fi
fi

echo ""
echo "Testing database operations..."
node test-complete-data-flow.js