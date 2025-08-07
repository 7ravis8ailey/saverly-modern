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
      setUser: (user) => set({ user }),
      
      setProfile: (profile) => set({ profile }),
      
      setLoading: (loading) => set({ loading }),
      
      setInitialized: (initialized) => set({ initialized }),
      
      clearAuth: () => set({
        user: null,
        profile: null,
        loading: false,
        initialized: true
      }),
      
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
      })
    }
  )
);