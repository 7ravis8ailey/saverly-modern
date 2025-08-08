import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, AuthUser, AuthError } from '@/types';

interface AuthState {
  // State
  user: AuthUser | null;
  profile: User | null;
  loading: boolean;
  initialized: boolean;
  
  // Actions
  setUser: (user: AuthUser | null) => void;
  setProfile: (profile: User | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  clearAuth: () => void;
  updateProfile: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      profile: null,
      loading: true,
      initialized: false,

      // Actions
      setUser: (user) => {
        console.log('💾 Auth Store: Setting user:', user?.email);
        set({ user });
      },
      
      setProfile: (profile) => {
        console.log('💾 Auth Store: Setting profile:', profile?.email, profile?.user_role);
        set({ profile });
      },
      
      setLoading: (loading) => {
        console.log('💾 Auth Store: Setting loading:', loading);
        set({ loading });
      },
      
      setInitialized: (initialized) => {
        console.log('💾 Auth Store: Setting initialized:', initialized);
        set({ initialized });
      },
      
      clearAuth: () => {
        console.log('💾 Auth Store: Clearing auth');
        set({
          user: null,
          profile: null,
          loading: false,
          initialized: true
        });
      },
      
      updateProfile: (updates) => {
        const currentProfile = get().profile;
        if (currentProfile) {
          set({ 
            profile: { 
              ...currentProfile, 
              ...updates,
              updated_at: new Date().toISOString()
            } 
          });
        }
      }
    }),
    {
      name: 'saverly-auth-storage',
      partialize: (state) => ({
        user: state.user,
        profile: state.profile,
        initialized: state.initialized
      }),
      // Add error handling for corrupted storage
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('💾 Auth Store: Rehydration error, clearing storage:', error);
          // Clear corrupted storage
          localStorage.removeItem('saverly-auth-storage');
          return;
        }
        console.log('💾 Auth Store: Rehydrated with state:', {
          hasUser: !!state?.user,
          hasProfile: !!state?.profile,
          initialized: state?.initialized,
          loading: state?.loading
        });
        
        // CRITICAL FIX: Reset loading state after rehydration
        // This ensures the AuthProvider can render its children
        if (state) {
          console.log('💾 Auth Store: Resetting loading state after rehydration');
          state.loading = false;
        }
      }
    }
  )
);