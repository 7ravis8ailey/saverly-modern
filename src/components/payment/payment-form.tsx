import { useState } from 'react'
import { useElements, useStripe, PaymentElement } from '@stripe/react-stripe-js'
import { useAuth } from '@/components/auth/auth-provider'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, AlertTriangle } from 'lucide-react'

interface PaymentFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function PaymentForm({ onSuccess, onCancel }: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const { user, updateUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!stripe || !elements || !user) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Confirm payment
      const { error: stripeError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
        },
        redirect: 'if_required',
      })

      if (stripeError) {
        setError(stripeError.message || 'Payment failed')
        return
      }

      // Update user subscription status in database
      const { error: dbError } = await supabase
        .from('users')
        .update({
          subscription_status: 'active',
          subscription_period_start: new Date().toISOString(),
          subscription_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
          subscription_plan: 'monthly'
        })
        .eq('uid', user.uid)

      if (dbError) {
        console.error('Failed to update subscription status:', dbError)
        setError('Payment succeeded but failed to update account. Please contact support.')
        return
      }

      // Update local user state
      await updateUser({
        subscription_status: 'active'
      })

      onSuccess?.()

    } catch (err) {
      console.error('Payment error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle>Subscribe to Saverly</CardTitle>
        <CardDescription>
          Get access to exclusive local deals for just $4.99/month
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <PaymentElement
              options={{
                layout: {
                  type: 'accordion',
                  defaultCollapsed: false,
                  radios: false,
                  spacedAccordionItems: true
                }
              }}
            />
          </div>

          <div className="flex space-x-3">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
            )}
            
            <Button
              type="submit"
              disabled={!stripe || !elements || loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Subscribe - $4.99/month'
              )}
            </Button>
          </div>
        </form>

        <div className="mt-4 text-center text-xs text-gray-500">
          <p>Cancel anytime. No long-term commitments.</p>
          <p>Secure payments powered by Stripe.</p>
        </div>
      </CardContent>
    </Card>
  )
}