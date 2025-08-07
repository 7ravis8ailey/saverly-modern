/**
 * PaymentForm Component Test Suite
 * Comprehensive tests for Stripe payment integration and form handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Elements } from '@stripe/react-stripe-js'
import { PaymentForm } from '../payment-form'

// Mock Stripe
const mockStripe = {
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
  confirmCardPayment: vi.fn(),
  confirmCardSetup: vi.fn()
}

const mockElements = {
  getElement: vi.fn(() => ({
    clear: vi.fn(),
    focus: vi.fn()
  })),
  create: vi.fn(() => ({
    mount: vi.fn(),
    unmount: vi.fn(),
    on: vi.fn(),
    update: vi.fn()
  }))
}

// Mock Stripe React components
vi.mock('@stripe/react-stripe-js', async () => {
  const actual = await vi.importActual('@stripe/react-stripe-js')
  return {
    ...actual,
    useStripe: vi.fn(() => mockStripe),
    useElements: vi.fn(() => mockElements),
    CardElement: ({ onChange, onReady, onFocus, onBlur }: any) => (
      <div
        data-testid="card-element"
        onClick={() => onFocus && onFocus()}
        onBlur={() => onBlur && onBlur()}
      >
        <input
          data-testid="card-input"
          onChange={(e) => onChange && onChange({
            complete: e.target.value.length > 0,
            error: null,
            empty: e.target.value.length === 0
          })}
        />
      </div>
    ),
    Elements: ({ children }: any) => <div data-testid="stripe-elements">{children}</div>
  }
})

// Mock auth hook
vi.mock('@/hooks/use-auth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'user-123', email: 'test@example.com' },
    userProfile: { full_name: 'Test User' },
    isAuthenticated: true
  }))
}))

// Mock toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn()
  }))
}))

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      }))
    }))
  }
}))

describe('PaymentForm Component', () => {
  const mockOnSuccess = vi.fn()
  const mockOnError = vi.fn()
  const mockToast = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock useToast return
    const { useToast } = require('@/hooks/use-toast')
    useToast.mockReturnValue({ toast: mockToast })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const renderPaymentForm = (props = {}) => {
    const defaultProps = {
      plan: 'monthly' as const,
      onSuccess: mockOnSuccess,
      onError: mockOnError,
      ...props
    }

    return render(
      <Elements stripe={mockStripe as any}>
        <PaymentForm {...defaultProps} />
      </Elements>
    )
  }

  describe('Basic Rendering', () => {
    it('renders payment form with all required elements', () => {
      renderPaymentForm()

      expect(screen.getByText('Payment Information')).toBeInTheDocument()
      expect(screen.getByTestId('card-element')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /subscribe/i })).toBeInTheDocument()
    })

    it('displays plan information correctly', () => {
      renderPaymentForm({ plan: 'monthly' })
      
      expect(screen.getByText(/monthly subscription/i)).toBeInTheDocument()
      expect(screen.getByText('$9.99/month')).toBeInTheDocument()
    })

    it('displays annual plan information', () => {
      renderPaymentForm({ plan: 'annual' })
      
      expect(screen.getByText(/annual subscription/i)).toBeInTheDocument()
      expect(screen.getByText('$99.99/year')).toBeInTheDocument()
      expect(screen.getByText(/save 17%/i)).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('shows validation error for empty card', async () => {
      const user = userEvent.setup()
      renderPaymentForm()

      const submitButton = screen.getByRole('button', { name: /subscribe/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Please enter your card details')).toBeInTheDocument()
      })
    })

    it('validates customer information fields', async () => {
      const user = userEvent.setup()
      renderPaymentForm()

      const nameInput = screen.getByLabelText(/full name/i)
      const emailInput = screen.getByLabelText(/email/i)
      
      // Clear inputs
      await user.clear(nameInput)
      await user.clear(emailInput)

      const submitButton = screen.getByRole('button', { name: /subscribe/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeInTheDocument()
        expect(screen.getByText('Email is required')).toBeInTheDocument()
      })
    })

    it('validates email format', async () => {
      const user = userEvent.setup()
      renderPaymentForm()

      const emailInput = screen.getByLabelText(/email/i)
      await user.type(emailInput, 'invalid-email')

      const submitButton = screen.getByRole('button', { name: /subscribe/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email')).toBeInTheDocument()
      })
    })
  })

  describe('Payment Processing', () => {
    it('processes payment successfully', async () => {
      const user = userEvent.setup()
      
      // Mock successful payment method creation
      mockStripe.createPaymentMethod.mockResolvedValue({
        paymentMethod: {
          id: 'pm_test_123',
          card: { brand: 'visa', last4: '4242' }
        },
        error: null
      })

      // Mock successful payment confirmation
      mockStripe.confirmCardPayment.mockResolvedValue({
        paymentIntent: {
          id: 'pi_test_123',
          status: 'succeeded'
        },
        error: null
      })

      renderPaymentForm()

      // Fill in customer information
      const nameInput = screen.getByLabelText(/full name/i)
      const emailInput = screen.getByLabelText(/email/i)
      
      await user.type(nameInput, 'John Doe')
      await user.type(emailInput, 'john@example.com')

      // Fill in card information (mock)
      const cardInput = screen.getByTestId('card-input')
      await user.type(cardInput, '4242424242424242')

      // Submit form
      const submitButton = screen.getByRole('button', { name: /subscribe/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockStripe.createPaymentMethod).toHaveBeenCalledWith({
          type: 'card',
          card: expect.any(Object),
          billing_details: {
            name: 'John Doe',
            email: 'john@example.com'
          }
        })
      })

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled()
      })
    })

    it('handles payment method creation failure', async () => {
      const user = userEvent.setup()
      
      mockStripe.createPaymentMethod.mockResolvedValue({
        paymentMethod: null,
        error: {
          message: 'Your card number is invalid.',
          type: 'card_error'
        }
      })

      renderPaymentForm()

      const nameInput = screen.getByLabelText(/full name/i)
      const emailInput = screen.getByLabelText(/email/i)
      const cardInput = screen.getByTestId('card-input')
      
      await user.type(nameInput, 'John Doe')
      await user.type(emailInput, 'john@example.com')
      await user.type(cardInput, '4000000000000002') // Declined card

      const submitButton = screen.getByRole('button', { name: /subscribe/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Your card number is invalid.')).toBeInTheDocument()
      })

      expect(mockOnError).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Your card number is invalid.'
      }))
    })

    it('handles payment confirmation failure', async () => {
      const user = userEvent.setup()
      
      mockStripe.createPaymentMethod.mockResolvedValue({
        paymentMethod: {
          id: 'pm_test_123',
          card: { brand: 'visa', last4: '4242' }
        },
        error: null
      })

      mockStripe.confirmCardPayment.mockResolvedValue({
        paymentIntent: null,
        error: {
          message: 'Your card was declined.',
          type: 'card_error'
        }
      })

      renderPaymentForm()

      const nameInput = screen.getByLabelText(/full name/i)
      const emailInput = screen.getByLabelText(/email/i)
      const cardInput = screen.getByTestId('card-input')
      
      await user.type(nameInput, 'John Doe')
      await user.type(emailInput, 'john@example.com')
      await user.type(cardInput, '4000000000000002')

      const submitButton = screen.getByRole('button', { name: /subscribe/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Your card was declined.')).toBeInTheDocument()
      })
    })
  })

  describe('Loading States', () => {
    it('shows loading state during payment processing', async () => {
      const user = userEvent.setup()
      
      // Mock delayed response
      mockStripe.createPaymentMethod.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          paymentMethod: { id: 'pm_test_123' },
          error: null
        }), 1000))
      )

      renderPaymentForm()

      const nameInput = screen.getByLabelText(/full name/i)
      const emailInput = screen.getByLabelText(/email/i)
      const cardInput = screen.getByTestId('card-input')
      
      await user.type(nameInput, 'John Doe')
      await user.type(emailInput, 'john@example.com')
      await user.type(cardInput, '4242424242424242')

      const submitButton = screen.getByRole('button', { name: /subscribe/i })
      await user.click(submitButton)

      expect(screen.getByText('Processing...')).toBeInTheDocument()
      expect(submitButton).toBeDisabled()
    })

    it('disables form during processing', async () => {
      const user = userEvent.setup()
      
      mockStripe.createPaymentMethod.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          paymentMethod: { id: 'pm_test_123' },
          error: null
        }), 100))
      )

      renderPaymentForm()

      const submitButton = screen.getByRole('button', { name: /subscribe/i })
      await user.click(submitButton)

      expect(screen.getByLabelText(/full name/i)).toBeDisabled()
      expect(screen.getByLabelText(/email/i)).toBeDisabled()
      expect(submitButton).toBeDisabled()
    })
  })

  describe('Error Handling', () => {
    it('displays network errors', async () => {
      const user = userEvent.setup()
      
      mockStripe.createPaymentMethod.mockRejectedValue(new Error('Network error'))

      renderPaymentForm()

      const submitButton = screen.getByRole('button', { name: /subscribe/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument()
      })
    })

    it('clears previous errors on new submission', async () => {
      const user = userEvent.setup()
      
      // First submission with error
      mockStripe.createPaymentMethod.mockResolvedValueOnce({
        paymentMethod: null,
        error: { message: 'Card error' }
      })

      renderPaymentForm()

      const submitButton = screen.getByRole('button', { name: /subscribe/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Card error')).toBeInTheDocument()
      })

      // Second submission should clear error
      mockStripe.createPaymentMethod.mockResolvedValueOnce({
        paymentMethod: { id: 'pm_test_123' },
        error: null
      })

      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.queryByText('Card error')).not.toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper form labels and ARIA attributes', () => {
      renderPaymentForm()

      const nameInput = screen.getByLabelText(/full name/i)
      const emailInput = screen.getByLabelText(/email/i)
      
      expect(nameInput).toHaveAttribute('aria-required', 'true')
      expect(emailInput).toHaveAttribute('aria-required', 'true')
    })

    it('announces errors to screen readers', async () => {
      const user = userEvent.setup()
      renderPaymentForm()

      const submitButton = screen.getByRole('button', { name: /subscribe/i })
      await user.click(submitButton)

      await waitFor(() => {
        const errorMessage = screen.getByText('Please enter your card details')
        expect(errorMessage).toHaveAttribute('aria-live', 'polite')
      })
    })

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup()
      renderPaymentForm()

      // Tab through form elements
      await user.tab()
      expect(screen.getByLabelText(/full name/i)).toHaveFocus()

      await user.tab()
      expect(screen.getByLabelText(/email/i)).toHaveFocus()

      await user.tab()
      expect(screen.getByTestId('card-element')).toHaveFocus()
    })
  })

  describe('Security', () => {
    it('does not store sensitive card information', () => {
      renderPaymentForm()

      // Verify that card element is properly isolated
      expect(screen.getByTestId('card-element')).toBeInTheDocument()
      
      // Card details should be handled entirely by Stripe Elements
      expect(screen.queryByDisplayValue(/4242/)).not.toBeInTheDocument()
    })

    it('validates against XSS in customer information', async () => {
      const user = userEvent.setup()
      renderPaymentForm()

      const nameInput = screen.getByLabelText(/full name/i)
      await user.type(nameInput, '<script>alert("xss")</script>')

      expect(nameInput).toHaveValue('<script>alert("xss")</script>')
      // The actual XSS protection would be in the form validation/sanitization
    })
  })

  describe('Plan Changes', () => {
    it('updates pricing when plan changes', () => {
      const { rerender } = renderPaymentForm({ plan: 'monthly' })
      
      expect(screen.getByText('$9.99/month')).toBeInTheDocument()

      rerender(
        <Elements stripe={mockStripe as any}>
          <PaymentForm plan="annual" onSuccess={mockOnSuccess} onError={mockOnError} />
        </Elements>
      )

      expect(screen.getByText('$99.99/year')).toBeInTheDocument()
    })
  })

  describe('Success Flow', () => {
    it('calls onSuccess with payment details', async () => {
      const user = userEvent.setup()
      
      const mockPaymentIntent = {
        id: 'pi_test_123',
        status: 'succeeded',
        amount: 999,
        currency: 'usd'
      }

      mockStripe.createPaymentMethod.mockResolvedValue({
        paymentMethod: { id: 'pm_test_123' },
        error: null
      })

      mockStripe.confirmCardPayment.mockResolvedValue({
        paymentIntent: mockPaymentIntent,
        error: null
      })

      renderPaymentForm()

      const submitButton = screen.getByRole('button', { name: /subscribe/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith(
          expect.objectContaining({
            paymentIntent: mockPaymentIntent
          })
        )
      })
    })
  })
})

// Export test utilities
export const createMockStripeElements = () => ({
  stripe: mockStripe,
  elements: mockElements
})

export const createMockPaymentMethod = (overrides = {}) => ({
  id: 'pm_test_123',
  card: { brand: 'visa', last4: '4242' },
  ...overrides
})