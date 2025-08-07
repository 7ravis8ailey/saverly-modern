import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Business, Coupon } from '@/types';

interface BusinessState {
  // State
  businesses: Business[];
  currentBusiness: Business | null;
  coupons: Coupon[];
  loading: boolean;
  searchFilters: {
    category: string | null;
    location: string | null;
    radius: number;
    sortBy: 'distance' | 'name' | 'rating' | 'newest';
  };
  
  // Actions
  setBusinesses: (businesses: Business[]) => void;
  setCurrentBusiness: (business: Business | null) => void;
  addBusiness: (business: Business) => void;
  updateBusiness: (id: string, updates: Partial<Business>) => void;
  removeBusiness: (id: string) => void;
  
  setCoupons: (coupons: Coupon[]) => void;
  addCoupon: (coupon: Coupon) => void;
  updateCoupon: (id: string, updates: Partial<Coupon>) => void;
  removeCoupon: (id: string) => void;
  
  setLoading: (loading: boolean) => void;
  updateSearchFilters: (filters: Partial<BusinessState['searchFilters']>) => void;
  clearFilters: () => void;
  
  // Computed getters
  getBusinessById: (id: string) => Business | undefined;
  getCouponsByBusiness: (businessId: string) => Coupon[];
  getFilteredBusinesses: () => Business[];
}

const defaultFilters: BusinessState['searchFilters'] = {
  category: null,
  location: null,
  radius: 10,
  sortBy: 'distance'
};

export const useBusinessStore = create<BusinessState>()(
  persist(
    (set, get) => ({
      // Initial state
      businesses: [],
      currentBusiness: null,
      coupons: [],
      loading: false,
      searchFilters: defaultFilters,

      // Business actions
      setBusinesses: (businesses) => set({ businesses }),
      
      setCurrentBusiness: (business) => set({ currentBusiness: business }),
      
      addBusiness: (business) => set((state) => ({
        businesses: [...state.businesses, business]
      })),
      
      updateBusiness: (id, updates) => set((state) => ({
        businesses: state.businesses.map(b => 
          b.uid === id ? { ...b, ...updates, updatedAt: new Date().toISOString() } : b
        ),
        currentBusiness: state.currentBusiness?.uid === id 
          ? { ...state.currentBusiness, ...updates, updatedAt: new Date().toISOString() }
          : state.currentBusiness
      })),
      
      removeBusiness: (id) => set((state) => ({
        businesses: state.businesses.filter(b => b.uid !== id),
        currentBusiness: state.currentBusiness?.uid === id ? null : state.currentBusiness
      })),

      // Coupon actions
      setCoupons: (coupons) => set({ coupons }),
      
      addCoupon: (coupon) => set((state) => ({
        coupons: [...state.coupons, coupon]
      })),
      
      updateCoupon: (id, updates) => set((state) => ({
        coupons: state.coupons.map(c => 
          c.uid === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
        )
      })),
      
      removeCoupon: (id) => set((state) => ({
        coupons: state.coupons.filter(c => c.uid !== id)
      })),

      // UI actions
      setLoading: (loading) => set({ loading }),
      
      updateSearchFilters: (filters) => set((state) => ({
        searchFilters: { ...state.searchFilters, ...filters }
      })),
      
      clearFilters: () => set({ searchFilters: defaultFilters }),

      // Computed getters
      getBusinessById: (id) => {
        return get().businesses.find(b => b.uid === id);
      },
      
      getCouponsByBusiness: (businessId) => {
        return get().coupons.filter(c => c.businessUid === businessId);
      },
      
      getFilteredBusinesses: () => {
        const { businesses, searchFilters } = get();
        let filtered = [...businesses];
        
        if (searchFilters.category) {
          filtered = filtered.filter(b => b.category === searchFilters.category);
        }
        
        // Add more filtering logic here as needed
        
        return filtered;
      }
    }),
    {
      name: 'saverly-business-storage',
      partialize: (state) => ({
        searchFilters: state.searchFilters
      })
    }
  )
);