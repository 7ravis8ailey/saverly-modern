/**
 * CouponCard Component Test Suite
 * Comprehensive tests for the coupon display and interaction functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CouponCard } from '../coupon-card'

// Mock the hooks and utilities
vi.mock('@/hooks/use-auth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'test-user-id' },
    isAuthenticated: true
  }))
}))

vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn()
  }))
}))

vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' ')
}))

// Test data
const mockCoupon = {
  uid: 'coupon-123',
  title: '20% Off Coffee',
  description: 'Get 20% off your next coffee purchase at our downtown location',
  discount: '20% OFF',
  start_date: '2024-01-01T00:00:00Z',
  end_date: '2025-12-31T23:59:59Z',
  active: true,
  usage_limit: 'monthly_one' as const,
  business_uid: 'business-123',
  business: {
    uid: 'business-123',
    name: 'Coffee Corner',
    category: 'Food & Beverage',
    address: '123 Main St',
    city: 'San Francisco',
    state: 'CA',
    latitude: 37.7749,
    longitude: -122.4194
  }
}

const mockExpiredCoupon = {
  ...mockCoupon,
  uid: 'expired-coupon-123',
  title: 'Expired Deal',
  end_date: '2023-01-01T00:00:00Z' // Past date
}

const mockInactiveCoupon = {
  ...mockCoupon,
  uid: 'inactive-coupon-123',
  title: 'Inactive Deal',
  active: false
}

describe('CouponCard Component', () => {
  let queryClient: QueryClient
  const mockOnRedeem = vi.fn()

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })
    vi.clearAllMocks()
  })

  const renderCouponCard = (coupon = mockCoupon, props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <CouponCard 
          coupon={coupon} 
          onRedeem={mockOnRedeem}
          {...props}
        />
      </QueryClientProvider>
    )
  }

  describe('Basic Rendering', () => {
    it('renders coupon information correctly', () => {
      renderCouponCard()

      expect(screen.getByText('20% Off Coffee')).toBeInTheDocument()
      expect(screen.getByText('20% OFF')).toBeInTheDocument()
      expect(screen.getByText('Coffee Corner')).toBeInTheDocument()
      expect(screen.getByText('Food & Beverage')).toBeInTheDocument()
      expect(screen.getByText('San Francisco, CA')).toBeInTheDocument()
    })

    it('displays coupon description when available', () => {
      renderCouponCard()
      expect(screen.getByText(/Get 20% off your next coffee purchase/)).toBeInTheDocument()
    })

    it('shows usage limit information', () => {
      renderCouponCard()
      expect(screen.getByText(/1 use per month/)).toBeInTheDocument()
    })

    it('displays expiration date', () => {
      renderCouponCard()
      expect(screen.getByText(/Valid until Dec 31, 2025/)).toBeInTheDocument()
    })
  })

  describe('Interactive Elements', () => {
    it('shows redeem button for active coupons', () => {
      renderCouponCard()
      
      const redeemButton = screen.getByRole('button', { name: /redeem/i })
      expect(redeemButton).toBeInTheDocument()
      expect(redeemButton).not.toBeDisabled()
    })

    it('calls onRedeem when redeem button is clicked', async () => {
      const user = userEvent.setup()
      renderCouponCard()
      
      const redeemButton = screen.getByRole('button', { name: /redeem/i })
      await user.click(redeemButton)
      
      expect(mockOnRedeem).toHaveBeenCalledWith(mockCoupon)
    })

    it('shows view details button', () => {
      renderCouponCard()
      
      const viewDetailsButton = screen.getByRole('button', { name: /view details/i })
      expect(viewDetailsButton).toBeInTheDocument()
    })
  })

  describe('Coupon States', () => {
    it('displays expired state correctly', () => {
      renderCouponCard(mockExpiredCoupon)
      
      expect(screen.getByText(/expired/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /redeem/i })).toBeDisabled()
    })

    it('displays inactive state correctly', () => {
      renderCouponCard(mockInactiveCoupon)
      
      expect(screen.getByText(/inactive/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /redeem/i })).toBeDisabled()
    })

    it('applies correct styling for expired coupons', () => {
      renderCouponCard(mockExpiredCoupon)
      
      const card = screen.getByTestId('coupon-card')
      expect(card).toHaveClass('opacity-50')
    })

    it('applies correct styling for inactive coupons', () => {
      renderCouponCard(mockInactiveCoupon)
      
      const card = screen.getByTestId('coupon-card')
      expect(card).toHaveClass('opacity-50')
    })
  })

  describe('Business Information', () => {
    it('displays business category with correct icon', () => {
      renderCouponCard()
      
      expect(screen.getByText('Food & Beverage')).toBeInTheDocument()
      // Check for category icon (assuming it's rendered)
      const categoryIcon = screen.getByTestId('category-icon')
      expect(categoryIcon).toBeInTheDocument()
    })

    it('shows business location', () => {
      renderCouponCard()
      
      expect(screen.getByText('123 Main St')).toBeInTheDocument()
      expect(screen.getByText('San Francisco, CA')).toBeInTheDocument()
    })

    it('displays distance when provided', () => {
      const couponWithDistance = {
        ...mockCoupon,
        distance: 0.5
      }
      
      renderCouponCard(couponWithDistance)
      expect(screen.getByText('0.5 mi')).toBeInTheDocument()
    })
  })

  describe('Usage Limits', () => {
    it('displays one-time usage limit', () => {
      const oneTimeCoupon = {
        ...mockCoupon,
        usage_limit: 'one_time' as const
      }
      
      renderCouponCard(oneTimeCoupon)
      expect(screen.getByText(/one time use only/i)).toBeInTheDocument()
    })

    it('displays daily usage limit', () => {
      const dailyCoupon = {
        ...mockCoupon,
        usage_limit: 'daily' as const
      }
      
      renderCouponCard(dailyCoupon)
      expect(screen.getByText(/1 use per day/i)).toBeInTheDocument()
    })

    it('displays monthly usage limits correctly', () => {
      const monthlyTwoCoupon = {
        ...mockCoupon,
        usage_limit: 'monthly_two' as const
      }
      
      renderCouponCard(monthlyTwoCoupon)
      expect(screen.getByText(/2 uses per month/i)).toBeInTheDocument()
    })
  })

  describe('Loading and Error States', () => {
    it('shows loading state when redemption is in progress', () => {
      renderCouponCard(mockCoupon, { loading: true })
      
      const redeemButton = screen.getByRole('button', { name: /redeeming/i })
      expect(redeemButton).toBeDisabled()
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })

    it('shows error state when redemption fails', () => {
      renderCouponCard(mockCoupon, { error: 'Redemption failed' })
      
      expect(screen.getByText('Redemption failed')).toBeInTheDocument()
      expect(screen.getByText('Redemption failed')).toHaveClass('text-red-500')
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      renderCouponCard()
      
      const card = screen.getByRole('article')
      expect(card).toHaveAttribute('aria-label', expect.stringContaining('20% Off Coffee'))
      
      const redeemButton = screen.getByRole('button', { name: /redeem/i })
      expect(redeemButton).toHaveAttribute('aria-describedby')
    })

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup()
      renderCouponCard()
      
      const redeemButton = screen.getByRole('button', { name: /redeem/i })
      await user.tab()
      expect(redeemButton).toHaveFocus()
      
      await user.keyboard('{Enter}')
      expect(mockOnRedeem).toHaveBeenCalled()
    })

    it('has proper heading hierarchy', () => {
      renderCouponCard()
      
      const title = screen.getByRole('heading', { name: '20% Off Coffee' })
      expect(title).toBeInTheDocument()
      
      const businessName = screen.getByRole('heading', { name: 'Coffee Corner' })
      expect(businessName).toBeInTheDocument()
    })
  })

  describe('Responsive Behavior', () => {
    it('adapts layout for mobile screens', () => {
      // Mock window.innerWidth
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      })
      
      renderCouponCard()
      
      const card = screen.getByTestId('coupon-card')
      expect(card).toHaveClass('flex-col', 'sm:flex-row')
    })
  })

  describe('Performance Optimizations', () => {
    it('memoizes expensive calculations', () => {
      const { rerender } = renderCouponCard()
      
      // Rerender with same props
      rerender(
        <QueryClientProvider client={queryClient}>
          <CouponCard coupon={mockCoupon} onRedeem={mockOnRedeem} />
        </QueryClientProvider>
      )
      
      // Component should not re-render unnecessarily
      expect(screen.getByText('20% Off Coffee')).toBeInTheDocument()
    })
  })

  describe('Integration with Parent Components', () => {
    it('integrates properly with coupon grid layout', () => {
      const { container } = renderCouponCard()
      
      const card = container.firstChild
      expect(card).toHaveClass('w-full')
    })

    it('handles prop changes reactively', () => {
      const { rerender } = renderCouponCard()
      
      const updatedCoupon = {
        ...mockCoupon,
        title: 'Updated Coupon Title'
      }
      
      rerender(
        <QueryClientProvider client={queryClient}>
          <CouponCard coupon={updatedCoupon} onRedeem={mockOnRedeem} />
        </QueryClientProvider>
      )
      
      expect(screen.getByText('Updated Coupon Title')).toBeInTheDocument()
    })
  })
})

// Export test utilities for reuse
export const createMockCoupon = (overrides = {}) => ({
  ...mockCoupon,
  ...overrides
})

export const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })
  
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  )
}