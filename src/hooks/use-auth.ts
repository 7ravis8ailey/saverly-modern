import { useEffect, useCallback } from 'react';
import { api } from '@/lib/supabase-api';
import { useAuthStore } from '@/stores/auth-store';
import type { User, AuthUser, AuthError, SignUpMetadata } from '@/types';

export function useAuthProvider() {
  const {
    user,
    profile,
    loading,
    initialized,
    setUser,
    setProfile,
    setLoading,
    setInitialized,
    clearAuth,
    updateProfile: updateStoreProfile
  } = useAuthStore();

  // Initialize auth state with race condition protection
  const initializeAuth = useCallback(async () => {
    if (initialized) return;
    
    try {
      const { user: currentUser } = await api.auth.getUser();
      if (currentUser) {
        const authUser: AuthUser = {
          uid: currentUser.id,
          id: currentUser.id,
          email: currentUser.email || undefined
        };
        setUser(authUser);
      }
      
      if (currentUser) {
        const { data: profileData } = await api.users.getById(currentUser.id);
        setProfile(profileData);
      }
    } catch (error) {
      console.error('Error getting initial session:', error);
      // Clear state on error
      clearAuth();
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }, [initialized, setUser, setProfile, setLoading, setInitialized, clearAuth]);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const signIn = async (email: string, password: string): Promise<{ error: AuthError | null }> => {
    console.log('🔐 Starting sign in for:', email);
    setLoading(true);
    try {
      const { data, error } = await api.auth.signIn(email, password);
      console.log('🔐 Sign in response:', { success: !error, userId: data?.user?.id });
      
      if (!error && data.user) {
        const authUser: AuthUser = {
          uid: data.user.id,
          id: data.user.id,
          email: data.user.email || undefined
        };
        console.log('🔐 Setting user in auth store:', authUser);
        setUser(authUser);
        
        console.log('🔐 Fetching user profile...');
        const { data: profileData, error: profileError } = await api.users.getById(data.user.id);
        
        if (profileError) {
          console.error('🔐 Profile fetch error:', profileError);
        } else {
          console.log('🔐 Profile fetched successfully:', { 
            id: profileData?.id, 
            email: profileData?.email, 
            user_role: profileData?.user_role,
            is_admin: profileData?.is_admin 
          });
        }
        
        setProfile(profileData);
      }
      
      return { error };
    } catch (error) {
      console.error('🔐 Sign in error:', error);
      const authError: AuthError = {
        message: error instanceof Error ? error.message : 'Sign in failed',
        code: 'AUTH_ERROR'
      };
      return { error: authError };
    } finally {
      setLoading(false);
      console.log('🔐 Sign in process complete');
    }
  };

  const signUp = async (email: string, password: string, metadata?: SignUpMetadata): Promise<{ error: AuthError | null }> => {
    setLoading(true);
    try {
      const { data, error } = await api.auth.signUp(email, password, metadata);
      
      if (!error && data.user) {
        // Create user profile
        const profileData: Partial<User> = {
          id: data.user.id,
          email: data.user.email!,
          full_name: metadata?.fullName,
          phone: metadata?.phone,
          address: metadata?.address,
          city: metadata?.city,
          state: metadata?.state,
          zip_code: metadata?.zipCode,
          latitude: metadata?.latitude,
          longitude: metadata?.longitude,
          subscription_status: 'inactive' as const,
          is_admin: false,
          preferences: {
            notifications_enabled: true,
            location_sharing: true,
            email_marketing: false,
            theme: 'system',
            distance_unit: 'miles'
          }
        };

        const { data: profile, error: profileError } = await api.users.create(profileData);
        
        if (!profileError) {
          const authUser: AuthUser = {
            uid: data.user.id,
            id: data.user.id,
            email: data.user.email || undefined
          };
          setUser(authUser);
          setProfile(profile as User);
        }
        
        return { error: profileError || error };
      }
      
      return { error };
    } catch (error) {
      const authError: AuthError = {
        message: error instanceof Error ? error.message : 'Sign up failed',
        code: 'AUTH_ERROR'
      };
      return { error: authError };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await api.auth.signOut();
      clearAuth();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<User>): Promise<{ error: AuthError | null }> => {
    if (!user) {
      const authError: AuthError = {
        message: 'No user logged in',
        code: 'NO_USER'
      };
      return { error: authError };
    }
    
    try {
      const { data, error } = await api.users.update(user.id, updates);
      
      if (!error && data) {
        setProfile(data);
        updateStoreProfile(updates);
      }
      
      return { error };
    } catch (error) {
      const authError: AuthError = {
        message: error instanceof Error ? error.message : 'Profile update failed',
        code: 'PROFILE_UPDATE_ERROR'
      };
      return { error: authError };
    }
  };

  return {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile
  };
}