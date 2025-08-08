import { createContext, useContext } from 'react';
import { useAuthProvider } from '@/hooks/use-auth';
import type { User, AuthUser, AuthError, SignUpMetadata } from '@/types';

interface AuthContextType {
  user: AuthUser | null;
  profile: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, metadata?: SignUpMetadata) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<{ error: AuthError | null }>;
  updateUser: (updates: Partial<User>) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuthProvider();
  
  console.log('🏠 AuthProvider rendering with state:', {
    loading: auth.loading,
    hasUser: !!auth.user,
    hasProfile: !!auth.profile
  });
  
  // Add updateUser as alias for updateProfile
  const contextValue = {
    ...auth,
    updateUser: auth.updateProfile
  };
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}