import { beforeAll, afterAll, vi } from 'vitest'
import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'

// Load test environment variables (fallback to mock values if not set)
process.env.VITE_SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://mock-supabase-url.supabase.co'
process.env.VITE_SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'mock-supabase-anon-key'
process.env.VITE_GOOGLE_MAPS_API_KEY = process.env.VITE_GOOGLE_MAPS_API_KEY || 'mock-google-maps-key'
process.env.VITE_STRIPE_PUBLISHABLE_KEY = process.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_mock_stripe_key'

// Mock Google Maps API
Object.defineProperty(window, 'google', {
  value: {
    maps: {
      places: {
        AutocompleteService: class {
          getPlacePredictions(request: any, callback: any) {
            // Mock successful response
            callback([{
              place_id: 'mock_place_id',
              description: '123 Mock Street, San Francisco, CA, USA',
              structured_formatting: {
                main_text: '123 Mock Street',
                secondary_text: 'San Francisco, CA, USA'
              }
            }], 'OK')
          }
        },
        PlacesService: class {
          constructor() {}
          getDetails(request: any, callback: any) {
            callback({
              address_components: [
                { types: ['street_number'], long_name: '123' },
                { types: ['route'], long_name: 'Mock Street' },
                { types: ['locality'], long_name: 'San Francisco' },
                { types: ['administrative_area_level_1'], short_name: 'CA' },
                { types: ['postal_code'], long_name: '94102' }
              ],
              geometry: {
                location: {
                  lat: () => 37.7749,
                  lng: () => -122.4194
                }
              },
              formatted_address: '123 Mock Street, San Francisco, CA 94102, USA'
            }, 'OK')
          }
        },
        PlacesServiceStatus: {
          OK: 'OK'
        }
      }
    }
  },
  writable: true
})

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      getUser: vi.fn(),
      getSession: vi.fn()
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(),
            limit: vi.fn(() => ({ data: [] })),
            order: vi.fn(() => ({ data: [] }))
          }))
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      update: vi.fn(() => ({ eq: vi.fn() })),
      delete: vi.fn(() => ({ eq: vi.fn() }))
    }))
  }
}))

// Mock Stripe
vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn(() => Promise.resolve({
    elements: vi.fn(() => ({
      create: vi.fn(() => ({
        mount: vi.fn(),
        unmount: vi.fn(),
        on: vi.fn()
      }))
    })),
    createToken: vi.fn(),
    createPaymentMethod: vi.fn(),
    confirmCardPayment: vi.fn()
  }))
}))

// Mock React Query
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query')
  return {
    ...actual,
    useQuery: vi.fn(() => ({
      data: null,
      isLoading: false,
      error: null,
      refetch: vi.fn()
    })),
    useMutation: vi.fn(() => ({
      mutate: vi.fn(),
      isLoading: false,
      error: null,
      data: null
    }))
  }
})

beforeAll(async () => {
  console.log('Setting up test environment...')
  // Global test setup
})

afterAll(async () => {
  console.log('Cleaning up test environment...')
  cleanup()
})