/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_MAPS_API_KEY: string
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_STRIPE_PUBLISHABLE_KEY: string
  readonly VITE_APP_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Global Google Maps types
declare global {
  interface Window {
    google: {
      maps: {
        places: {
          AutocompleteService: new () => google.maps.places.AutocompleteService
          PlacesService: new (container: HTMLDivElement) => google.maps.places.PlacesService
          PlacesServiceStatus: {
            OK: 'OK'
            ZERO_RESULTS: 'ZERO_RESULTS'
            OVER_QUERY_LIMIT: 'OVER_QUERY_LIMIT'
            REQUEST_DENIED: 'REQUEST_DENIED'
            INVALID_REQUEST: 'INVALID_REQUEST'
            UNKNOWN_ERROR: 'UNKNOWN_ERROR'
          }
        }
      }
    }
  }
}
