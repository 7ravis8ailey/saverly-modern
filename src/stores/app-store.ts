import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  // UI State
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  searchQuery: string;
  currentLocation: {
    lat: number;
    lng: number;
    address?: string;
  } | null;
  
  // Feature flags
  features: {
    enableNotifications: boolean;
    enableGeolocation: boolean;
    enableAnalytics: boolean;
    maintenanceMode: boolean;
  };
  
  // Error handling
  globalError: string | null;
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    timestamp: number;
    autoHide?: boolean;
  }>;
  
  // Actions
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setSearchQuery: (query: string) => void;
  setCurrentLocation: (location: { lat: number; lng: number; address?: string } | null) => void;
  updateFeature: (feature: keyof AppState['features'], value: boolean) => void;
  setGlobalError: (error: string | null) => void;
  addNotification: (notification: Omit<AppState['notifications'][0], 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      sidebarOpen: false,
      theme: 'system',
      searchQuery: '',
      currentLocation: null,
      features: {
        enableNotifications: true,
        enableGeolocation: true,
        enableAnalytics: false,
        maintenanceMode: false
      },
      globalError: null,
      notifications: [],

      // Actions
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      
      setTheme: (theme) => set({ theme }),
      
      setSearchQuery: (query) => set({ searchQuery: query }),
      
      setCurrentLocation: (location) => set({ currentLocation: location }),
      
      updateFeature: (feature, value) => set((state) => ({
        features: { ...state.features, [feature]: value }
      })),
      
      setGlobalError: (error) => set({ globalError: error }),
      
      addNotification: (notification) => {
        const id = Math.random().toString(36).substring(7);
        const timestamp = Date.now();
        
        set((state) => ({
          notifications: [
            ...state.notifications,
            { ...notification, id, timestamp }
          ]
        }));
        
        // Auto-hide notification after 5 seconds if autoHide is true
        if (notification.autoHide !== false) {
          setTimeout(() => {
            get().removeNotification(id);
          }, 5000);
        }
      },
      
      removeNotification: (id) => set((state) => ({
        notifications: state.notifications.filter(n => n.id !== id)
      })),
      
      clearNotifications: () => set({ notifications: [] })
    }),
    {
      name: 'saverly-app-storage',
      partialize: (state) => ({
        theme: state.theme,
        features: state.features,
        currentLocation: state.currentLocation
      })
    }
  )
);