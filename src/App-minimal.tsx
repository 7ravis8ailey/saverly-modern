import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import SimpleTestPage from './pages/simple-test'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/simple" element={<SimpleTestPage />} />
        <Route path="*" element={
          <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-green-600 mb-4">
                🎉 Saverly is Working!
              </h1>
              <p className="text-gray-600 mb-4">
                React app is loading successfully.
              </p>
              <a 
                href="/simple" 
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
              >
                Test Backend Connection
              </a>
            </div>
          </div>
        } />
      </Routes>
    </Router>
  )
}

export default App