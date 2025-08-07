import { useState, useEffect } from 'react'
import { Elements } from '@stripe/react-stripe-js'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PaymentForm } from './payment-form'
import { stripePromise } from '@/lib/stripe'
import { useAuth } from '@/components/auth/auth-provider'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Loader2, UserX } from 'lucide-react'

interface SubscriptionDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function SubscriptionDialog({ isOpen, onClose, onSuccess }: SubscriptionDialogProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && user) {
      createPaymentIntent()
    }
  }, [isOpen, user])

  const createPaymentIntent = async () => {
    if (!user) return

    setLoading(true)
    try {
      // In a real app, this would be a server-side API call
      // For now, we'll simulate creating a payment intent
      // You would need to implement a Supabase Edge Function for this
      
      // Don't set a mock client secret - show a message instead
      // const mockClientSecret = 'pi_mock_client_secret'
      // setClientSecret(mockClientSecret)
      setClientSecret(null)
      
      // TODO: Replace with actual Supabase Edge Function call:
      /*
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          amount: 499, // $4.99 in cents
          currency: 'usd',
          customer_email: user.email,
          user_id: user.uid
        }
      })
      
      if (error) throw error
      setClientSecret(data.client_secret)
      */
      
    } catch (error) {
      console.error('Failed to create payment intent:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSuccess = () => {
    onSuccess?.()
    onClose()
  }

  const handleCreateAccount = () => {
    onClose()
    navigate('/auth')
  }

  const appearance = {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#22c55e', // Saverly green
    },
  }

  // If user is not logged in, show sign-up prompt
  if (!user) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Account Required</DialogTitle>
          </DialogHeader>
          
          <div className="text-center py-8 space-y-4">
            <UserX className="h-16 w-16 mx-auto text-gray-400" />
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Sign in to Subscribe
              </h3>
              <p className="text-sm text-gray-600">
                You need an account to subscribe to Saverly. Create one now to get started!
              </p>
            </div>
            
            <div className="space-y-3 pt-4">
              <Button onClick={handleCreateAccount} className="w-full">
                Create Account
              </Button>
              <Button variant="outline" onClick={onClose} className="w-full">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Subscribe to Saverly</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-saverly-green" />
            <span className="ml-2 text-sm text-gray-600">Setting up payment...</span>
          </div>
        ) : clientSecret && stripePromise ? (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance,
            }}
          >
            <PaymentForm onSuccess={handleSuccess} onCancel={onClose} />
          </Elements>
        ) : (
          <div className="text-center py-8 space-y-4">
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-yellow-800 font-medium">
                Payment System Setup Required
              </p>
              <p className="text-xs text-yellow-700 mt-2">
                To enable payments, you need to:
              </p>
              <ol className="text-xs text-yellow-700 mt-2 text-left list-decimal list-inside">
                <li>Create a Supabase Edge Function for payment intents</li>
                <li>Connect your Stripe account</li>
                <li>Configure webhook endpoints</li>
              </ol>
            </div>
            <p className="text-sm text-gray-600">
              For testing, you can explore the app without subscribing.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}