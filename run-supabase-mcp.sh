#!/bin/bash
#
# Isolated Supabase MCP Server Launcher
# Temporarily hides .env file and starts MCP server with clean environment
#

# Temporarily hide the .env file so MCP server doesn't read conflicting variables
if [ -f ".env" ]; then
    mv ".env" ".env.hidden"
    ENV_FILE_MOVED=true
else
    ENV_FILE_MOVED=false
fi

# Ensure .env.supabase-mcp exists as .env for MCP server
cp ".env.supabase-mcp" ".env"

# Cleanup function to restore original .env
cleanup() {
    # Remove temporary .env
    rm -f ".env"
    
    # Restore original .env if we moved it
    if [ "$ENV_FILE_MOVED" = "true" ]; then
        mv ".env.hidden" ".env"
    fi
}

# Set trap to ensure cleanup happens
trap cleanup EXIT

echo "🚀 Starting Supabase MCP Server with isolated environment..."
echo "📡 Project REF: lziayzusujlvhebyagdl"  
echo "🔑 Service Key: eyJhbGciOiJIUzI1NiIs..."
echo "🌍 Region: us-east-1"
echo "🔧 Using dedicated MCP environment file"

# Start the MCP server
python3 -m supabase_mcp.main "$@"