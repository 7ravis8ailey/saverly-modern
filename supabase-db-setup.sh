#!/bin/bash

echo "🚀 Setting up Saverly Database with Supabase CLI"
echo "================================================"

# Check if we have required environment variables
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
    echo "⚠️  SUPABASE_ACCESS_TOKEN not set."
    echo "Please login to Supabase first:"
    echo "  supabase login"
    echo ""
    echo "Or set your access token:"
    echo "  export SUPABASE_ACCESS_TOKEN='your-token'"
    echo ""
    echo "Get your token from: https://supabase.com/dashboard/account/tokens"
    exit 1
fi

# Link to the project
echo "🔗 Linking to Supabase project..."
supabase link --project-ref lziayzusujlvhebyagdl

if [ $? -ne 0 ]; then
    echo "❌ Failed to link to project"
    echo "Please ensure you're logged in: supabase login"
    exit 1
fi

# Push the database schema
echo ""
echo "📤 Pushing database schema..."
supabase db push --include-all

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database schema deployed successfully!"
    echo ""
    echo "🎉 Your Saverly app is now connected to Supabase!"
    echo "   - User registration will work"
    echo "   - Data will persist in the database"
    echo "   - You can view data in Supabase dashboard"
else
    echo "❌ Schema deployment failed"
fi