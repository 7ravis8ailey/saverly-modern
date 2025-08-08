import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { queryClient } from './lib/query-client'
import { AuthProvider } from './components/auth/auth-provider'
import { Navbar } from './components/layout/navbar'
import { LandingPage } from './pages/landing'
import { HomePage } from './pages/home'
import { AuthForm } from './components/auth/auth-form'
import { SimpleAuthForm } from './components/auth/simple-auth-form'
import ProfilePage from './pages/ProfilePage'
import SubscriptionMarketingPage from './pages/SubscriptionMarketingPage'
import CouponsPage from './pages/CouponsPage'
import SimpleTestPage from './pages/simple-test'
// import TestPage from './pages/test' // Disabled for launch
import AdminDashboard from './pages/admin/dashboard'
import AdminUsers from './pages/admin/users'
import AdminUserDetail from './pages/admin/user-detail'
import AdminBusinesses from './pages/admin/businesses'
import AdminRedemptions from './pages/admin/redemptions'
import { ErrorBoundary } from './components/error-boundary'
import { Toaster } from './components/ui/toaster'

function AppContent() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main role="main" className="flex-1">
        <Routes>
          {/* Public routes - anyone can access */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthForm />} />
          <Route path="/auth/login" element={<AuthForm />} />
          <Route path="/auth/register" element={<AuthForm />} />
          <Route path="/simple-auth" element={<SimpleAuthForm />} />
          
          {/* Dashboard route - shows different views based on subscription status */}
          <Route path="/dashboard" element={<HomePage />} />
          
          {/* Coupon routes */}
          <Route path="/coupons" element={<CouponsPage />} />
          
          {/* User account routes */}
          <Route path="/profile" element={<ProfilePage />} />
          
          {/* Subscription routes */}
          <Route path="/upgrade" element={<SubscriptionMarketingPage />} />
          <Route path="/subscription" element={<SubscriptionMarketingPage />} />
          
          {/* Admin routes - protected */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/users/:userId" element={<AdminUserDetail />} />
          <Route path="/admin/businesses" element={<AdminBusinesses />} />
          <Route path="/admin/redemptions" element={<AdminRedemptions />} />
          
          {/* Development/testing routes */}
          <Route path="/simple" element={<SimpleTestPage />} />
          {/* <Route path="/test" element={<TestPage />} /> */}
          
          {/* Catch all - redirect to landing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <AppContent />
            <Toaster />
          </Router>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App