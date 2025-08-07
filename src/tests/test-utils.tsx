/**
 * Test Utilities
 * Reusable components and functions for component testing
 */

import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { Elements } from '@stripe/react-stripe-js'
import { vi } from 'vitest'

// Mock Stripe instance for testing
export const mockStripe = {
  elements: vi.fn(() => ({
    create: vi.fn(() => ({
      mount: vi.fn(),
      unmount: vi.fn(),
      on: vi.fn(),
      update: vi.fn()
    })),
    getElement: vi.fn(() => ({
      clear: vi.fn(),
      focus: vi.fn()
    }))
  })),
  createToken: vi.fn(),
  createPaymentMethod: vi.fn(),
  confirmCardPayment: vi.fn()
}

// Test wrapper that provides all necessary contexts
interface AllTheProvidersProps {
  children: React.ReactNode
  queryClient?: QueryClient
  stripePromise?: any
}

const AllTheProviders: React.FC<AllTheProvidersProps> = ({ 
  children, 
  queryClient,
  stripePromise = Promise.resolve(mockStripe)
}) => {
  const testQueryClient = queryClient || new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
        gcTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  })

  return (
    <QueryClientProvider client={testQueryClient}>
      <BrowserRouter>
        <Elements stripe={stripePromise}>
          {children}
        </Elements>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

// Custom render function that includes providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient
  stripePromise?: any
}

export const renderWithProviders = (
  ui: React.ReactElement,
  {
    queryClient,
    stripePromise,
    ...renderOptions
  }: CustomRenderOptions = {}
) => {
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <AllTheProviders queryClient={queryClient} stripePromise={stripePromise}>
      {children}
    </AllTheProviders>
  )

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

// Mock data factories
export const createMockUser = (overrides = {}) => ({
  id: 'user-123',
  email: 'test@example.com',
  user_metadata: {
    full_name: 'Test User'
  },
  app_metadata: {},
  aud: 'authenticated',
  created_at: '2024-01-01T00:00:00Z',
  ...overrides
})

export const createMockUserProfile = (overrides = {}) => ({
  uid: 'user-123',
  email: 'test@example.com',
  full_name: 'Test User',
  account_type: 'subscriber',
  subscription_status: 'active',
  subscription_plan: 'monthly',
  phone: '555-123-4567',
  address: '123 Test St',
  city: 'San Francisco',
  state: 'CA',
  zip_code: '94102',
  created_at: '2024-01-01T00:00:00Z',
  ...overrides
})

export const createMockBusiness = (overrides = {}) => ({
  uid: 'business-123',
  name: 'Test Business',
  email: 'business@example.com',
  contact_name: 'Business Owner',
  phone: '555-987-6543',
  address: '456 Business Ave',
  city: 'San Francisco',
  state: 'CA',
  zip_code: '94103',
  category: 'Food & Beverage',
  description: 'A test business',
  latitude: 37.7749,
  longitude: -122.4194,
  created_at: '2024-01-01T00:00:00Z',
  ...overrides
})

export const createMockCoupon = (overrides = {}) => ({
  uid: 'coupon-123',
  title: 'Test Coupon',
  description: 'A test coupon for testing',
  discount: '20% OFF',
  start_date: '2024-01-01T00:00:00Z',
  end_date: '2025-12-31T23:59:59Z',
  active: true,
  usage_limit: 'monthly_one' as const,
  business_uid: 'business-123',
  business: createMockBusiness(),
  created_at: '2024-01-01T00:00:00Z',
  ...overrides
})

export const createMockRedemption = (overrides = {}) => ({
  uid: 'redemption-123',
  user_uid: 'user-123',
  coupon_uid: 'coupon-123',
  business_uid: 'business-123',
  qr_code: 'test-qr-code',
  display_code: 'TEST123',
  status: 'pending',
  redemption_month: '2024-01',
  expires_at: new Date(Date.now() + 60000).toISOString(), // 1 minute from now
  created_at: '2024-01-01T00:00:00Z',
  ...overrides
})

// Mock hook implementations
export const createMockAuthContext = (overrides = {}) => ({
  user: createMockUser(),
  userProfile: createMockUserProfile(),
  isAuthenticated: true,
  isSubscribed: true,
  loading: false,
  error: null,
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  ...overrides
})

export const createMockToast = () => ({
  toast: vi.fn()
})

// Utility functions for testing
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const createMockSupabaseResponse = <T>(data: T, error?: any) => ({
  data,
  error,
  status: error ? 400 : 200,
  statusText: error ? 'Bad Request' : 'OK'
})

export const mockSupabaseQuery = (mockData: any, mockError?: any) => ({
  select: vi.fn(() => ({
    eq: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({
          data: mockData,
          error: mockError
        })),
        limit: vi.fn(() => Promise.resolve({
          data: Array.isArray(mockData) ? mockData : [mockData],
          error: mockError
        }))
      }))
    }))
  })),
  insert: vi.fn(() => ({
    select: vi.fn(() => ({
      single: vi.fn(() => Promise.resolve({
        data: mockData,
        error: mockError
      }))
    }))
  })),
  update: vi.fn(() => ({
    eq: vi.fn(() => Promise.resolve({
      data: mockData,
      error: mockError
    }))
  })),
  delete: vi.fn(() => ({
    eq: vi.fn(() => Promise.resolve({
      data: null,
      error: mockError
    }))
  }))
})

// Custom matchers for testing
export const expectToBeInDocument = (element: HTMLElement | null) => {
  expect(element).toBeInTheDocument()
}

export const expectToHaveClass = (element: HTMLElement | null, className: string) => {
  expect(element).toHaveClass(className)
}

export const expectToBeDisabled = (element: HTMLElement | null) => {
  expect(element).toBeDisabled()
}

export const expectToBeVisible = (element: HTMLElement | null) => {
  expect(element).toBeVisible()
}

// Test data generators
export const generateTestEmail = () => {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `test-${timestamp}-${random}@example.com`
}

export const generateTestPhone = () => {
  const areaCode = Math.floor(Math.random() * 900) + 100
  const exchange = Math.floor(Math.random() * 900) + 100
  const number = Math.floor(Math.random() * 9000) + 1000
  return `${areaCode}-${exchange}-${number}`
}

// Performance testing utilities
export const measureRenderTime = async (renderFn: () => void) => {
  const start = performance.now()
  renderFn()
  const end = performance.now()
  return end - start
}

// Accessibility testing utilities
export const checkA11y = async (container: HTMLElement) => {
  // This would integrate with @axe-core/react or similar
  // For now, we'll do basic checks
  const buttons = container.querySelectorAll('button')
  const inputs = container.querySelectorAll('input')
  const links = container.querySelectorAll('a')

  buttons.forEach(button => {
    expect(button).toHaveAttribute('type')
  })

  inputs.forEach(input => {
    expect(input).toHaveAccessibleName()
  })

  links.forEach(link => {
    expect(link).toHaveAccessibleName()
  })
}

// Mock window.matchMedia for responsive tests
export const mockMatchMedia = (query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
})

// Setup for tests that need window.matchMedia
export const setupMatchMedia = () => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(mockMatchMedia),
  })
}

// Mock intersection observer for lazy loading tests
export const mockIntersectionObserver = () => {
  const mockIntersectionObserver = vi.fn()
  mockIntersectionObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null
  })
  window.IntersectionObserver = mockIntersectionObserver
}

export * from '@testing-library/react'
export { vi } from 'vitest'