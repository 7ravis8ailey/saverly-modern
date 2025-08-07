#!/usr/bin/env python3
"""
Test script for Supabase MCP server integration
Isolates environment variables and tests connection
"""

import os
import sys
import asyncio
from typing import Dict, Any

# Clear all non-essential environment variables
for key in list(os.environ.keys()):
    if key.startswith(('VITE_', 'STRIPE_', 'NODE_', 'PRODUCTION_')):
        del os.environ[key]

# Set only required Supabase variables
os.environ['SUPABASE_PROJECT_URL'] = 'https://lziayzusujlvhebyagdl.supabase.co'
os.environ['SUPABASE_SERVICE_KEY'] = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6aWF5enVzdWpsdmhlYnlhZ2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQ4NTk2NSwiZXhwIjoyMDY5MDYxOTY1fQ.O8YBQHtBR8g4NnRFb_tTKw3pfOHhJzs3jgKv2D4EAAM'

async def test_supabase_connection():
    """Test direct Supabase connection without MCP server"""
    try:
        from supabase import create_client, Client
        
        url = os.environ['SUPABASE_PROJECT_URL']
        key = os.environ['SUPABASE_SERVICE_KEY']
        
        supabase: Client = create_client(url, key)
        
        # Test connection with a simple query
        result = supabase.rpc('version', {}).execute()
        print(f"✅ Supabase connection successful!")
        print(f"Database info: {result.data}")
        return True
        
    except Exception as e:
        print(f"❌ Supabase connection failed: {e}")
        return False

def test_mcp_server_import():
    """Test if MCP server can be imported with clean environment"""
    try:
        # Try importing the MCP server components
        from supabase_mcp.settings import Settings
        from supabase_mcp.core.container import ServicesContainer
        
        print("✅ MCP server components imported successfully!")
        return True
        
    except Exception as e:
        print(f"❌ MCP server import failed: {e}")
        return False

async def main():
    print("🔧 Testing Supabase MCP Integration")
    print("=" * 50)
    
    print("\n1. Testing direct Supabase connection...")
    supabase_ok = await test_supabase_connection()
    
    print("\n2. Testing MCP server imports...")
    mcp_ok = test_mcp_server_import()
    
    print("\n" + "=" * 50)
    if supabase_ok and mcp_ok:
        print("✅ All tests passed! Ready for MCP integration.")
        return 0
    else:
        print("❌ Some tests failed. Check errors above.")
        return 1

if __name__ == "__main__":
    sys.exit(asyncio.run(main()))