import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './auth-provider';

export function UserRouter() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Don't redirect while still loading auth state
    if (loading || !user) return;

    // Check if user is admin
    const isAdmin = profile?.account_type === 'admin' || 
                   profile?.user_role === 'admin' ||
                   profile?.is_admin === true ||
                   profile?.email?.includes('admin') || 
                   user.email === 'admin@test.saverly';
    
    if (isAdmin) {
      navigate('/admin', { replace: true });
      return;
    }
    
    // Check subscription status for regular users
    if (profile?.subscription_status === 'active') {
      navigate('/dashboard', { replace: true });
    } else {
      navigate('/dashboard?subscriber=false', { replace: true });
    }
  }, [user, profile, loading, navigate]);

  // Show loading state
  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-saverly-green"></div>
          <p className="mt-4 text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return null;
}