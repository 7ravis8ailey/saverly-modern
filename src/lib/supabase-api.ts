// Production-ready Supabase API
import { supabase } from './supabase';
import type { User, Business, Coupon, Redemption } from '@/types';

export { supabase };

// Core functions
export const getUsers = async () => {
  const { data, error } = await supabase.from('users').select('*');
  return { data, error };
};

// Business functions
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

// Coupon functions
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

// Redemption functions
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

// Main API object that matches auth hook expectations
export const api = {
  auth: {
    signIn: async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      return { data, error };
    },

    signUp: async (email: string, password: string, metadata?: Record<string, unknown>) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      });
      return { data, error };
    },

    signOut: async () => {
      const { error } = await supabase.auth.signOut();
      return { error };
    },

    getUser: async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      return { user, error };
    }
  },

  users: {
    create: async (userData: Partial<User>) => {
      console.log('Creating user:', userData);
      
      const { data, error } = await supabase
        .from('users')
        .insert({
          id: userData.id,
          email: userData.email,
          full_name: userData.full_name,
          phone: userData.phone,
          address: userData.address,
          city: userData.city,
          state: userData.state,
          zip_code: userData.zip_code,
          latitude: userData.latitude,
          longitude: userData.longitude,
          subscription_status: userData.subscription_status || 'free',
          is_admin: userData.is_admin || false,
          preferences: userData.preferences || {}
        })
        .select()
        .single();

      return { data, error };
    },

    getById: async (id: string) => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      return { data, error };
    },

    update: async (id: string, userData: Partial<User>) => {
      const { data, error } = await supabase
        .from('users')
        .update(userData)
        .eq('id', id)
        .select()
        .single();
      return { data, error };
    },

    getAll: getUsers
  },

  businesses: {
    create: createBusiness,
    getAll: getBusinesses
  },

  coupons: {
    create: createCoupon,
    getAll: getCoupons,
    getAllActive: async () => {
      const { data, error } = await supabase
        .from('coupons')
        .select(`
          *,
          business:businesses (*)
        `)
        .eq('active', true);
      return { data, error };
    }
  },

  redemptions: {
    create: createRedemption,
    getAll: getRedemptions
  }
};