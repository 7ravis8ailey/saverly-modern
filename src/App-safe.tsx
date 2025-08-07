import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

function App() {
  try {
    return (
      <Router>
        <Routes>
          <Route path="/" element={
            <div className="min-h-screen bg-gray-50 p-8">
              <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold text-green-600 mb-4">Saverly</h1>
                <p className="text-gray-600 mb-8">Welcome to Saverly - Local Deals, Real Savings</p>
                
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                  <h2 className="text-2xl font-semibold mb-4">System Status</h2>
                  <ul className="space-y-2">
                    <li>✅ React is working</li>
                    <li>✅ Routing is working</li>
                    <li>✅ Tailwind CSS is working</li>
                  </ul>
                </div>

                <div className="bg-blue-50 rounded-lg p-6">
                  <h3 className="font-semibold mb-2">Next Steps:</h3>
                  <p>The basic app is working. The full app might be failing due to:</p>
                  <ul className="list-disc list-inside mt-2">
                    <li>Supabase connection issues</li>
                    <li>Missing environment variables</li>
                    <li>Component import errors</li>
                  </ul>
                </div>
              </div>
            </div>
          } />
        </Routes>
      </Router>
    )
  } catch (error: any) {
    return (
      <div className="min-h-screen bg-red-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-red-600 mb-4">Error Loading Saverly</h1>
          <pre className="bg-white p-4 rounded">{error.message}</pre>
          <pre className="bg-white p-4 rounded mt-4">{error.stack}</pre>
        </div>
      </div>
    )
  }
}

export default App