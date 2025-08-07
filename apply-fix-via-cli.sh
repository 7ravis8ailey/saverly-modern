#!/bin/bash

echo "🚀 Applying RLS Fixes via Supabase CLI"
echo "======================================"

# We're authenticated, now let's execute the SQL directly
echo "Executing SQL fixes..."

# Create a migration file
mkdir -p supabase/migrations
cp FIXED_RLS_POLICIES.sql supabase/migrations/20240807000000_fix_rls_policies.sql

echo "Created migration file"

# Try to run it as a migration
echo "Running migration..."
supabase db push --dry-run

echo ""
echo "If dry run looks good, run:"
echo "supabase db push"