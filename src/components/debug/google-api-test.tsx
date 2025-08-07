// Debug component to test Google Maps API (SECURITY HARDENED)
import { useEffect, useState } from 'react'

export function GoogleApiTest() {
  const [hasApiKey, setHasApiKey] = useState<boolean>(false)
  const [testResult, setTestResult] = useState<string>('')

  useEffect(() => {
    const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    setHasApiKey(!!key)
    
    // Test API key presence without exposing it
    if (key) {
      // Only test if key exists, don't make actual requests in debug mode
      setTestResult('✅ API Key Present - Use production mode to test')
    } else {
      setTestResult('❌ No API Key Found - Check environment variables')
    }
  }, [])

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 border rounded shadow-lg max-w-sm">
      <h3 className="font-bold text-sm">Google Maps API Debug</h3>
      <div className="text-xs mt-2">
        <div><strong>API Key:</strong> {hasApiKey ? '✅ Present' : '❌ Missing'}</div>
        <div><strong>Status:</strong> {testResult}</div>
        <div><strong>Window.google:</strong> {typeof window.google !== 'undefined' ? '✅ Loaded' : '❌ Not loaded'}</div>
      </div>
    </div>
  )
}