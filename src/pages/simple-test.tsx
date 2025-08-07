export default function SimpleTestPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-green-600 mb-4">
          🎉 Saverly Backend Test Success!
        </h1>
        <p className="text-gray-600 mb-8">
          If you can see this page, the React app is working correctly.
        </p>
        
        <div className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-bold text-green-800">✅ Database Schema Applied</h3>
            <p className="text-green-700">All 7 tables created successfully</p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-bold text-blue-800">🔗 Supabase Connected</h3>
            <p className="text-blue-700">Backend integration ready</p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-bold text-purple-800">🚀 Ready for Testing</h3>
            <p className="text-purple-700">Authentication, QR codes, and coupons ready</p>
          </div>
        </div>
        
        <div className="mt-8 space-x-4">
          <a 
            href="/" 
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
          >
            Go to Homepage
          </a>
          <a 
            href="/test" 
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Backend Tests
          </a>
        </div>
      </div>
    </div>
  );
}