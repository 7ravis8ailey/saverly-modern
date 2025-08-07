/**
 * Stripe Webhook Integration for Saverly
 * Automatically updates user subscription status when Stripe events occur
 */

import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
const stripe = new Stripe(STRIPE_SECRET);

export async function handleStripeWebhook(request) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(body, sig, WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return new Response('Invalid signature', { status: 400 });
  }

  // Handle subscription events
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await handleSubscriptionUpdate(event.data.object);
      break;
      
    case 'customer.subscription.deleted':
      await handleSubscriptionCanceled(event.data.object);
      break;
      
    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(event.data.object);
      break;
      
    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object);
      break;
      
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return new Response('Webhook handled successfully', { status: 200 });
}

async function handleSubscriptionUpdate(subscription) {
  try {
    // Get customer email from Stripe
    const customer = await stripe.customers.retrieve(subscription.customer);
    
    // Update user in Supabase
    const { error } = await supabase
      .from('users')
      .update({
        subscription_status: subscription.status === 'active' ? 'active' : subscription.status,
        subscription_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('email', customer.email);
    
    if (error) {
      console.error('Error updating user subscription:', error);
    } else {
      console.log(`✅ Updated subscription for ${customer.email}: ${subscription.status}`);
    }
  } catch (err) {
    console.error('Error handling subscription update:', err);
  }
}

async function handleSubscriptionCanceled(subscription) {
  try {
    const customer = await stripe.customers.retrieve(subscription.customer);
    
    const { error } = await supabase
      .from('users')
      .update({
        subscription_status: 'cancelled',
        subscription_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('email', customer.email);
    
    if (error) {
      console.error('Error canceling user subscription:', error);
    } else {
      console.log(`✅ Canceled subscription for ${customer.email}`);
    }
  } catch (err) {
    console.error('Error handling subscription cancellation:', err);
  }
}

async function handlePaymentSucceeded(invoice) {
  try {
    const customer = await stripe.customers.retrieve(invoice.customer);
    
    // Reactivate subscription on successful payment
    const { error } = await supabase
      .from('users')
      .update({
        subscription_status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('email', customer.email);
    
    if (error) {
      console.error('Error reactivating subscription:', error);
    } else {
      console.log(`✅ Reactivated subscription for ${customer.email}`);
    }
  } catch (err) {
    console.error('Error handling payment success:', err);
  }
}

async function handlePaymentFailed(invoice) {
  try {
    const customer = await stripe.customers.retrieve(invoice.customer);
    
    // Mark subscription as past_due on failed payment
    const { error } = await supabase
      .from('users')
      .update({
        subscription_status: 'past_due',
        updated_at: new Date().toISOString()
      })
      .eq('email', customer.email);
    
    if (error) {
      console.error('Error updating failed payment:', error);
    } else {
      console.log(`⚠️ Payment failed for ${customer.email} - marked as past_due`);
    }
  } catch (err) {
    console.error('Error handling payment failure:', err);
  }
}