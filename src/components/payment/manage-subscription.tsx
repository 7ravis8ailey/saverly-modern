import { useState } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { CreditCard, Calendar, AlertTriangle, Loader2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

export function ManageSubscription() {
  const { user, updateUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [canceling, setCanceling] = useState(false)

  if (!user || user.subscriptionStatus !== 'active') {
    return null
  }

  const handleCancelSubscription = async () => {
    setCanceling(true)
    try {
      // In a real app, you'd call your backend to cancel the Stripe subscription
      // For now, we'll just update the local database
      
      const { error } = await supabase
        .from('users')
        .update({
          subscriptionStatus: 'inactive',
          subscription_canceled_at: new Date().toISOString()
        })
        .eq('uid', user.uid)

      if (error) {
        console.error('Failed to cancel subscription:', error)
        toast({
          title: "Error",
          description: "Failed to cancel subscription. Please try again.",
          variant: "destructive"
        })
        return
      }

      // Update local user state
      await updateUser({
        subscription_status: 'inactive'
      })
      
      toast({
        title: "Subscription Canceled",
        description: "Your subscription has been canceled successfully.",
        variant: "success"
      })

      // TODO: In production, call Stripe API via Supabase Edge Function:
      /*
      const { error: stripeError } = await supabase.functions.invoke('cancel-subscription', {
        body: { subscription_id: user.stripeSubscriptionId }
      })
      */

    } catch (error) {
      console.error('Cancellation error:', error)
    } finally {
      setCanceling(false)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <CreditCard className="mr-2 h-5 w-5" />
          Your Subscription
        </CardTitle>
        <CardDescription>
          Manage your Saverly subscription and billing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">Saverly Premium</div>
            <div className="text-sm text-gray-600">$4.99/month</div>
          </div>
          <Badge className="bg-green-500">
            Active
          </Badge>
        </div>

        {user.subscriptionPeriodEnd && (
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="mr-2 h-4 w-4" />
            Next billing date: {formatDate(user.subscriptionPeriodEnd)}
          </div>
        )}

        <div className="pt-4 border-t">
          <div className="flex space-x-2">
            <Button variant="outline" disabled={loading}>
              <CreditCard className="mr-2 h-4 w-4" />
              Update Payment Method
            </Button>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  Cancel Subscription
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center">
                    <AlertTriangle className="mr-2 h-5 w-5 text-red-500" />
                    Cancel Subscription
                  </DialogTitle>
                  <DialogDescription>
                    Are you sure you want to cancel your subscription? You'll lose access to:
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                    <li>Exclusive local deals and discounts</li>
                    <li>QR code coupon redemptions</li>
                    <li>Priority access to new offers</li>
                  </ul>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="destructive"
                      onClick={handleCancelSubscription}
                      disabled={canceling}
                      className="flex-1"
                    >
                      {canceling ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Canceling...
                        </>
                      ) : (
                        'Yes, Cancel Subscription'
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="text-xs text-gray-500">
          <p>Your subscription will remain active until the end of your current billing period.</p>
          <p>You can reactivate anytime before then.</p>
        </div>
      </CardContent>
    </Card>
  )
}