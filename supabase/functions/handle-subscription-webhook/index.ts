import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from "https://esm.sh/stripe@12.18.0?target=deno"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const signature = req.headers.get('Stripe-Signature')
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
  
  if (!signature || !webhookSecret) {
    return new Response('Webhook signature verification failed', { status: 400 })
  }

  try {
    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    })

    // Initialize Supabase client with service role key for admin operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get raw body for signature verification
    const body = await req.text()
    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error(`Webhook signature verification failed:`, err.message)
      return new Response(`Webhook Error: ${err.message}`, { status: 400 })
    }

    console.log(`Processing webhook event: ${event.type}`)

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionChange(supabaseClient, subscription, 'updated')
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionChange(supabaseClient, subscription, 'cancelled')
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
          await handleSubscriptionChange(supabaseClient, subscription, 'active')
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
          await handleSubscriptionChange(supabaseClient, subscription, 'past_due')
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Webhook handler error:', error)
    return new Response(`Webhook Error: ${error.message}`, { status: 400 })
  }
})

async function handleSubscriptionChange(
  supabaseClient: any, 
  subscription: Stripe.Subscription, 
  status: string
) {
  try {
    const supabaseUserId = subscription.metadata.supabase_user_id
    
    if (!supabaseUserId) {
      console.error('No Supabase user ID found in subscription metadata')
      return
    }

    // Calculate subscription period end
    let subscriptionPeriodEnd: string | null = null
    if (subscription.current_period_end) {
      subscriptionPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString()
    }

    // Update user subscription status in Supabase
    const { data, error } = await supabaseClient
      .from('users')
      .update({
        subscription_status: status,
        subscription_period_end: subscriptionPeriodEnd,
        stripe_customer_id: subscription.customer,
        stripe_subscription_id: subscription.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', supabaseUserId)

    if (error) {
      console.error('Error updating user subscription:', error)
      throw error
    }

    console.log(`Successfully updated subscription for user ${supabaseUserId}: ${status}`)

    // Create a subscription event record for audit trail
    await supabaseClient
      .from('subscription_events')
      .insert({
        user_id: supabaseUserId,
        event_type: status,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer,
        event_data: subscription,
        created_at: new Date().toISOString()
      })

  } catch (error) {
    console.error('Error in handleSubscriptionChange:', error)
    throw error
  }
}