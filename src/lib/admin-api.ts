import { supabase } from './supabase-api';

// Types for admin data
export interface AdminStats {
  totalUsers: number;
  activeSubscribers: number;
  totalBusinesses: number;
  activeCoupons: number;
  totalRedemptions: number;
}

export interface AdminUser {
  uid: string;
  auth_uid: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  account_type: 'subscriber' | 'admin' | 'business';
  subscription_status: 'active' | 'inactive' | 'cancelled' | 'past_due';
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminBusiness {
  uid: string;
  owner_uid: string | null;
  name: string;
  description: string | null;
  category: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  latitude: number;
  longitude: number;
  phone: string | null;
  email: string;
  contact_name: string;
  is_verified: boolean;
  is_active: boolean;
  total_coupons_issued: number;
  total_redemptions: number;
  created_at: string;
  updated_at: string;
}

export interface AdminCoupon {
  uid: string;
  business_uid: string;
  title: string;
  description: string;
  discount: string;
  start_date: string;
  end_date: string;
  active: boolean;
  usage_limit: string;
  max_total_redemptions: number | null;
  current_redemptions: number;
  created_at: string;
  updated_at: string;
  // Join data
  business?: {
    name: string;
    email: string;
    contact_name: string;
  };
}

export interface AdminRedemption {
  uid: string;
  user_uid: string;
  coupon_uid: string;
  business_uid: string;
  qr_code: string;
  display_code: string;
  status: 'pending' | 'redeemed' | 'expired' | 'cancelled' | 'refunded';
  redemption_month: string;
  expires_at: string;
  redeemed_at: string | null;
  transaction_amount: number | null;
  savings_amount: number | null;
  rating: number | null;
  review_text: string | null;
  created_at: string;
  // Join data
  user?: {
    full_name: string | null;
    email: string;
  };
  coupon?: {
    title: string;
    discount: string;
  };
  business?: {
    name: string;
    email: string;
  };
}

// Admin API functions
export const adminAPI = {
  // Dashboard stats
  async getStats(): Promise<AdminStats> {
    try {
      const [
        { count: totalUsers },
        { count: activeSubscribers },
        { count: totalBusinesses },
        { count: activeCoupons },
        { count: totalRedemptions }
      ] = await Promise.all([
        // Total users
        supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .then(({ count }) => ({ count: count || 0 })),
        
        // Active subscribers  
        supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('subscription_status', 'active')
          .then(({ count }) => ({ count: count || 0 })),
        
        // Total businesses
        supabase
          .from('businesses')
          .select('*', { count: 'exact', head: true })
          .then(({ count }) => ({ count: count || 0 })),
        
        // Active coupons
        supabase
          .from('coupons')
          .select('*', { count: 'exact', head: true })
          .eq('active', true)
          .gte('end_date', new Date().toISOString())
          .then(({ count }) => ({ count: count || 0 })),
        
        // Total redemptions
        supabase
          .from('redemptions')
          .select('*', { count: 'exact', head: true })
          .then(({ count }) => ({ count: count || 0 }))
      ]);

      return {
        totalUsers,
        activeSubscribers, 
        totalBusinesses,
        activeCoupons,
        totalRedemptions
      };
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      throw error;
    }
  },

  // Users management
  async getUsers(limit = 50, offset = 0): Promise<AdminUser[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  },

  async getUserById(uid: string): Promise<AdminUser | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('uid', uid)
      .single();

    if (error) throw error;
    return data;
  },

  async updateUser(uid: string, updates: Partial<AdminUser>): Promise<AdminUser> {
    const { data, error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('uid', uid)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Businesses management
  async getBusinesses(limit = 50, offset = 0): Promise<AdminBusiness[]> {
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  },

  async getBusinessById(uid: string): Promise<AdminBusiness | null> {
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('uid', uid)
      .single();

    if (error) throw error;
    return data;
  },

  async updateBusiness(uid: string, updates: Partial<AdminBusiness>): Promise<AdminBusiness> {
    const { data, error } = await supabase
      .from('businesses')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('uid', uid)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getBusinessCoupons(businessUid: string): Promise<AdminCoupon[]> {
    const { data, error } = await supabase
      .from('coupons')
      .select(`
        *,
        business:businesses(name, email, contact_name)
      `)
      .eq('business_uid', businessUid)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Coupons management
  async getCoupons(limit = 50, offset = 0): Promise<AdminCoupon[]> {
    const { data, error } = await supabase
      .from('coupons')
      .select(`
        *,
        business:businesses(name, email, contact_name)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  },

  // Redemptions management
  async getRedemptions(limit = 50, offset = 0): Promise<AdminRedemption[]> {
    const { data, error } = await supabase
      .from('redemptions')
      .select(`
        *,
        user:users(full_name, email),
        coupon:coupons(title, discount),
        business:businesses(name, email)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  },

  async getRedemptionById(uid: string): Promise<AdminRedemption | null> {
    const { data, error } = await supabase
      .from('redemptions')
      .select(`
        *,
        user:users(full_name, email),
        coupon:coupons(title, discount, description),
        business:businesses(name, email, contact_name, address, city, state)
      `)
      .eq('uid', uid)
      .single();

    if (error) throw error;
    return data;
  },

  async updateRedemption(uid: string, updates: Partial<AdminRedemption>): Promise<AdminRedemption> {
    const { data, error } = await supabase
      .from('redemptions')
      .update(updates)
      .eq('uid', uid)
      .select(`
        *,
        user:users(full_name, email),
        coupon:coupons(title, discount),
        business:businesses(name, email)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  // Search functions
  async searchUsers(query: string, limit = 20): Promise<AdminUser[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .or(`email.ilike.%${query}%,full_name.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  async searchBusinesses(query: string, limit = 20): Promise<AdminBusiness[]> {
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .or(`name.ilike.%${query}%,email.ilike.%${query}%,contact_name.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }
};