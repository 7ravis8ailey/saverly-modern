// Simplified Supabase API for Launch
import { supabase } from './supabase';
import type { AuthUser, User, Business, Coupon, Redemption } from '@/types';

export { supabase };

// Auth functions (working with existing auth provider)
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  return { data, error };
};

export const signUp = async (email: string, password: string, metadata?: Record<string, unknown>) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata
    }
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
};

// These are stub functions for launch - working with existing components
export const createUser = async (userData: Partial<User>) => {
  // This would integrate with the existing user system
  console.log('Creating user:', userData);
  return { data: userData, error: null };
};

export const updateUser = async (uid: string, userData: Partial<User>) => {
  const { data, error } = await supabase
    .from('users')
    .update(userData)
    .eq('uid', uid);
  return { data, error };
};

export const getUsers = async () => {
  const { data, error } = await supabase.from('users').select('*');
  return { data, error };
};

// Business functions (working with existing system)
export const createBusiness = async (businessData: Partial<Business>) => {
  const { data, error } = await supabase
    .from('businesses')
    .insert(businessData)
    .select()
    .single();
  return { data, error };
};

export const getBusinesses = async () => {
  const { data, error } = await supabase.from('businesses').select('*');
  return { data, error };
};

// Coupon functions (working with existing system)
export const createCoupon = async (couponData: Partial<Coupon>) => {
  const { data, error } = await supabase
    .from('coupons')
    .insert(couponData)
    .select()
    .single();
  return { data, error };
};

export const getCoupons = async () => {
  const { data, error } = await supabase
    .from('coupons')
    .select(`*, business:businesses(*)`);
  return { data, error };
};

// Redemption functions (working with existing system)
export const createRedemption = async (redemptionData: Partial<Redemption>) => {
  const { data, error } = await supabase
    .from('redemptions')
    .insert(redemptionData)
    .select()
    .single();
  return { data, error };
};

export const getRedemptions = async () => {
  const { data, error } = await supabase
    .from('redemptions')
    .select(`*, user:users(*), coupon:coupons(*), business:businesses(*)`);
  return { data, error };
};

// Create api object for compatibility with existing hooks
export const api = {
  auth: {
    signIn,
    signUp,
    signOut,
    getUser: getCurrentUser
  },
  users: {
    create: createUser,
    update: updateUser,
    getAll: getUsers,
    getById: async (id: string) => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      return { data, error };
    }
  },
  businesses: {
    create: createBusiness,
    getAll: getBusinesses
  },
  coupons: {
    create: createCoupon,
    getAll: getCoupons
  },
  redemptions: {
    create: createRedemption,
    getAll: getRedemptions
  }
};

// Export types for compatibility
export type { AuthUser, User, Business, Coupon, Redemption };