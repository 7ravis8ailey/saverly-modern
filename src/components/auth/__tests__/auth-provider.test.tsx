/**
 * AuthProvider Component Test Suite
 * Comprehensive tests for authentication state management and user context
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { renderHook } from '@testing-library/react'
import { AuthProvider, useAuth } from '../auth-provider'

// Mock Supabase auth
const mockAuth = {
  onAuthStateChange: vi.fn(),
  getSession: vi.fn(),
  getUser: vi.fn(),
  signUp: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn()
}

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: mockAuth,
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        }))
      }))
    }))
  }
}))

// Mock user data
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  user_metadata: {
    full_name: 'Test User'
  },
  app_metadata: {},
  aud: 'authenticated',
  created_at: '2024-01-01T00:00:00Z'
}

const mockSession = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_at: Date.now() + 3600 * 1000,
  user: mockUser
}

const mockUserRecord = {
  uid: 'user-123',
  email: 'test@example.com',
  full_name: 'Test User',
  account_type: 'subscriber',
  subscription_status: 'active',
  subscription_plan: 'monthly',
  created_at: '2024-01-01T00:00:00Z'
}

describe('AuthProvider', () => {
  const mockUnsubscribe = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } }
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const renderWithProvider = (children: React.ReactNode) => {
    return render(
      <AuthProvider>
        {children}
      </AuthProvider>
    )
  }

  describe('Initialization', () => {
    it('initializes with loading state', () => {
      mockAuth.getSession.mockResolvedValue({ data: { session: null }, error: null })
      
      renderWithProvider(
        <div data-testid="auth-consumer">
          {/* Consumer component would use useAuth here */}
        </div>
      )
      
      expect(mockAuth.getSession).toHaveBeenCalled()
      expect(mockAuth.onAuthStateChange).toHaveBeenCalled()
    })

    it('loads initial session on mount', async () => {
      mockAuth.getSession.mockResolvedValue({ 
        data: { session: mockSession }, 
        error: null 
      })

      const { supabase } = await import('@/lib/supabase')
      ;(supabase.from as any)().select().eq().single.mockResolvedValue({
        data: mockUserRecord,
        error: null
      })

      renderWithProvider(<div data-testid="test" />)

      await waitFor(() => {
        expect(mockAuth.getSession).toHaveBeenCalled()
      })
    })

    it('handles session loading errors gracefully', async () => {
      mockAuth.getSession.mockResolvedValue({ 
        data: { session: null }, 
        error: new Error('Session load failed') 
      })

      renderWithProvider(<div data-testid="test" />)

      await waitFor(() => {
        expect(mockAuth.getSession).toHaveBeenCalled()
      })
    })
  })

  describe('Authentication State Changes', () => {
    it('updates state when user signs in', async () => {
      let authStateCallback: any
      mockAuth.onAuthStateChange.mockImplementation((callback) => {
        authStateCallback = callback
        return { data: { subscription: { unsubscribe: mockUnsubscribe } } }
      })

      mockAuth.getSession.mockResolvedValue({ data: { session: null }, error: null })

      const TestComponent = () => {
        const { user, isAuthenticated, loading } = useAuth()
        return (
          <div>
            <div data-testid="user">{user ? user.email : 'No user'}</div>
            <div data-testid="authenticated">{isAuthenticated.toString()}</div>
            <div data-testid="loading">{loading.toString()}</div>
          </div>
        )
      }

      renderWithProvider(<TestComponent />)

      // Simulate sign in
      const { supabase } = await import('@/lib/supabase')
      ;(supabase.from as any)().select().eq().single.mockResolvedValue({
        data: mockUserRecord,
        error: null
      })

      await act(async () => {
        authStateCallback('SIGNED_IN', mockSession)
      })

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('test@example.com')
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true')
        expect(screen.getByTestId('loading')).toHaveTextContent('false')
      })
    })

    it('updates state when user signs out', async () => {
      let authStateCallback: any
      mockAuth.onAuthStateChange.mockImplementation((callback) => {
        authStateCallback = callback
        return { data: { subscription: { unsubscribe: mockUnsubscribe } } }
      })

      mockAuth.getSession.mockResolvedValue({ 
        data: { session: mockSession }, 
        error: null 
      })

      const { supabase } = await import('@/lib/supabase')
      ;(supabase.from as any)().select().eq().single.mockResolvedValue({
        data: mockUserRecord,
        error: null
      })

      const TestComponent = () => {
        const { user, isAuthenticated } = useAuth()
        return (
          <div>
            <div data-testid="user">{user ? user.email : 'No user'}</div>
            <div data-testid="authenticated">{isAuthenticated.toString()}</div>
          </div>
        )
      }

      renderWithProvider(<TestComponent />)

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('test@example.com')
      })

      // Simulate sign out
      await act(async () => {
        authStateCallback('SIGNED_OUT', null)
      })

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('No user')
        expect(screen.getByTestId('authenticated')).toHaveTextContent('false')
      })
    })
  })

  describe('User Data Loading', () => {
    it('loads user profile data after authentication', async () => {
      let authStateCallback: any
      mockAuth.onAuthStateChange.mockImplementation((callback) => {
        authStateCallback = callback
        return { data: { subscription: { unsubscribe: mockUnsubscribe } } }
      })

      const { supabase } = await import('@/lib/supabase')
      ;(supabase.from as any)().select().eq().single.mockResolvedValue({
        data: mockUserRecord,
        error: null
      })

      const TestComponent = () => {
        const { userProfile } = useAuth()
        return (
          <div data-testid="profile">
            {userProfile ? userProfile.full_name : 'No profile'}
          </div>
        )
      }

      renderWithProvider(<TestComponent />)

      await act(async () => {
        authStateCallback('SIGNED_IN', mockSession)
      })

      await waitFor(() => {
        expect(screen.getByTestId('profile')).toHaveTextContent('Test User')
      })
    })

    it('handles user profile loading errors', async () => {
      let authStateCallback: any
      mockAuth.onAuthStateChange.mockImplementation((callback) => {
        authStateCallback = callback
        return { data: { subscription: { unsubscribe: mockUnsubscribe } } }
      })

      const { supabase } = await import('@/lib/supabase')
      ;(supabase.from as any)().select().eq().single.mockResolvedValue({
        data: null,
        error: new Error('Profile not found')
      })

      const TestComponent = () => {
        const { userProfile, error } = useAuth()
        return (
          <div>
            <div data-testid="profile">{userProfile ? userProfile.full_name : 'No profile'}</div>
            <div data-testid="error">{error ? error.message : 'No error'}</div>
          </div>
        )
      }

      renderWithProvider(<TestComponent />)

      await act(async () => {
        authStateCallback('SIGNED_IN', mockSession)
      })

      await waitFor(() => {
        expect(screen.getByTestId('profile')).toHaveTextContent('No profile')
        expect(screen.getByTestId('error')).toHaveTextContent('Profile not found')
      })
    })
  })

  describe('Subscription Status', () => {
    it('provides subscription status from user profile', async () => {
      let authStateCallback: any
      mockAuth.onAuthStateChange.mockImplementation((callback) => {
        authStateCallback = callback
        return { data: { subscription: { unsubscribe: mockUnsubscribe } } }
      })

      const { supabase } = await import('@/lib/supabase')
      ;(supabase.from as any)().select().eq().single.mockResolvedValue({
        data: mockUserRecord,
        error: null
      })

      const TestComponent = () => {
        const { isSubscribed } = useAuth()
        return <div data-testid="subscribed">{isSubscribed.toString()}</div>
      }

      renderWithProvider(<TestComponent />)

      await act(async () => {
        authStateCallback('SIGNED_IN', mockSession)
      })

      await waitFor(() => {
        expect(screen.getByTestId('subscribed')).toHaveTextContent('true')
      })
    })

    it('handles inactive subscription status', async () => {
      let authStateCallback: any
      mockAuth.onAuthStateChange.mockImplementation((callback) => {
        authStateCallback = callback
        return { data: { subscription: { unsubscribe: mockUnsubscribe } } }
      })

      const inactiveUserRecord = {
        ...mockUserRecord,
        subscription_status: 'inactive'
      }

      const { supabase } = await import('@/lib/supabase')
      ;(supabase.from as any)().select().eq().single.mockResolvedValue({
        data: inactiveUserRecord,
        error: null
      })

      const TestComponent = () => {
        const { isSubscribed } = useAuth()
        return <div data-testid="subscribed">{isSubscribed.toString()}</div>
      }

      renderWithProvider(<TestComponent />)

      await act(async () => {
        authStateCallback('SIGNED_IN', mockSession)
      })

      await waitFor(() => {
        expect(screen.getByTestId('subscribed')).toHaveTextContent('false')
      })
    })
  })

  describe('Authentication Methods', () => {
    it('provides signIn method', async () => {
      mockAuth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      })

      const TestComponent = () => {
        const { signIn } = useAuth()
        return (
          <button onClick={() => signIn('test@example.com', 'password')}>
            Sign In
          </button>
        )
      }

      renderWithProvider(<TestComponent />)

      const button = screen.getByText('Sign In')
      await act(async () => {
        button.click()
      })

      expect(mockAuth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password'
      })
    })

    it('provides signUp method', async () => {
      mockAuth.signUp.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      })

      const TestComponent = () => {
        const { signUp } = useAuth()
        return (
          <button onClick={() => signUp('test@example.com', 'password', { full_name: 'Test User' })}>
            Sign Up
          </button>
        )
      }

      renderWithProvider(<TestComponent />)

      const button = screen.getByText('Sign Up')
      await act(async () => {
        button.click()
      })

      expect(mockAuth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
        options: {
          data: { full_name: 'Test User' }
        }
      })
    })

    it('provides signOut method', async () => {
      mockAuth.signOut.mockResolvedValue({ error: null })

      const TestComponent = () => {
        const { signOut } = useAuth()
        return (
          <button onClick={() => signOut()}>
            Sign Out
          </button>
        )
      }

      renderWithProvider(<TestComponent />)

      const button = screen.getByText('Sign Out')
      await act(async () => {
        button.click()
      })

      expect(mockAuth.signOut).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('handles sign in errors', async () => {
      mockAuth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: new Error('Invalid credentials')
      })

      const TestComponent = () => {
        const { signIn, error } = useAuth()
        return (
          <div>
            <button onClick={() => signIn('test@example.com', 'wrong-password')}>
              Sign In
            </button>
            <div data-testid="error">{error ? error.message : 'No error'}</div>
          </div>
        )
      }

      renderWithProvider(<TestComponent />)

      const button = screen.getByText('Sign In')
      await act(async () => {
        button.click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Invalid credentials')
      })
    })

    it('clears errors on successful operations', async () => {
      // First, create an error state
      mockAuth.signInWithPassword.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: new Error('Invalid credentials')
      })

      const TestComponent = () => {
        const { signIn, error } = useAuth()
        return (
          <div>
            <button onClick={() => signIn('test@example.com', 'password')}>
              Sign In
            </button>
            <div data-testid="error">{error ? error.message : 'No error'}</div>
          </div>
        )
      }

      renderWithProvider(<TestComponent />)

      const button = screen.getByText('Sign In')
      
      // First attempt - should fail
      await act(async () => {
        button.click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Invalid credentials')
      })

      // Second attempt - should succeed and clear error
      mockAuth.signInWithPassword.mockResolvedValueOnce({
        data: { user: mockUser, session: mockSession },
        error: null
      })

      await act(async () => {
        button.click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('No error')
      })
    })
  })

  describe('Cleanup', () => {
    it('unsubscribes from auth changes on unmount', () => {
      const { unmount } = renderWithProvider(<div>Test</div>)
      
      unmount()
      
      expect(mockUnsubscribe).toHaveBeenCalled()
    })
  })

  describe('Hook Usage Outside Provider', () => {
    it('throws error when useAuth is used outside AuthProvider', () => {
      // Mock console.error to avoid noise in test output
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      expect(() => {
        renderHook(() => useAuth())
      }).toThrow('useAuth must be used within an AuthProvider')
      
      consoleSpy.mockRestore()
    })
  })
})

// Export test utilities
export const createMockAuthProvider = (initialState = {}) => {
  const defaultState = {
    user: null,
    userProfile: null,
    isAuthenticated: false,
    isSubscribed: false,
    loading: false,
    error: null,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn()
  }

  return {
    ...defaultState,
    ...initialState
  }
}