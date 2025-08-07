# Stripe Payment System Setup Guide

## Overview
This guide walks you through setting up the complete Stripe payment system for Saverly, including:
- Supabase Edge Functions for payment processing
- Stripe webhooks for subscription management
- Database schema for payment tracking
- Environment variable configuration

## Prerequisites
- Supabase project: `lziayzusujlvhebyagdl`
- Netlify deployment: `https://saverly-web.netlify.app`
- Stripe account with API keys
- Supabase CLI installed

## Step 1: Configure Stripe Account

### 1.1 Get Stripe API Keys
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers** > **API Keys**
3. Copy your **Publishable Key** and **Secret Key**
4. For webhooks, also copy your **Webhook Signing Secret**

### 1.2 Create Stripe Product and Price
1. Go to **Products** in your Stripe Dashboard
2. Create a new product: "Saverly Premium Subscription"
3. Add a recurring price: $4.99/month
4. Copy the **Price ID** (starts with `price_`)

## Step 2: Configure Supabase Environment Variables

### 2.1 Set Edge Function Secrets
Run these commands in your terminal:

```bash
# Navigate to project directory
cd /Users/travisbailey/Claude\ Workspace/Saverly/saverly-modern

# Set Stripe secret key for Edge Functions
supabase secrets set --project-ref lziayzusujlvhebyagdl STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here

# Set webhook signing secret
supabase secrets set --project-ref lziayzusujlvhebyagdl STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Set Supabase service role key (for webhook database operations)
supabase secrets set --project-ref lziayzusujlvhebyagdl SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 2.2 Update Frontend Environment Variables
Update the `.env` file with your Stripe publishable key:

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
```

## Step 3: Apply Database Schema

### 3.1 Create Subscription Events Table
Run this SQL in your Supabase SQL Editor:

```sql
-- Create subscription_events table for webhook audit trail
CREATE TABLE IF NOT EXISTS subscription_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  event_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS subscription_events_user_id_idx ON subscription_events(user_id);
CREATE INDEX IF NOT EXISTS subscription_events_stripe_subscription_id_idx ON subscription_events(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS subscription_events_created_at_idx ON subscription_events(created_at);

-- Add RLS policies
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;

-- Users can only see their own subscription events
CREATE POLICY subscription_events_user_policy ON subscription_events
  FOR SELECT
  USING (user_id = auth.uid());

-- Only service role can insert/update subscription events (webhooks)
CREATE POLICY subscription_events_service_policy ON subscription_events
  FOR ALL
  TO service_role
  USING (true);

-- Add additional columns to users table if they don't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Create indexes for Stripe IDs
CREATE INDEX IF NOT EXISTS users_stripe_customer_id_idx ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS users_stripe_subscription_id_idx ON users(stripe_subscription_id);
```

## Step 4: Configure Stripe Webhooks

### 4.1 Create Webhook Endpoint
1. Go to **Developers** > **Webhooks** in your Stripe Dashboard
2. Click **Add endpoint**
3. Set endpoint URL: `https://lziayzusujlvhebyagdl.supabase.co/functions/v1/handle-subscription-webhook`
4. Select these events to listen for:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the **Signing secret** (starts with `whsec_`)

### 4.2 Update Webhook Secret
Update the webhook secret in Supabase:

```bash
supabase secrets set --project-ref lziayzusujlvhebyagdl STRIPE_WEBHOOK_SECRET=whsec_your_actual_webhook_secret_here
```

## Step 5: Update Price ID in Frontend

### 5.1 Update Subscription Dialog
Edit `src/components/payment/subscription-dialog.tsx` and replace the price ID:

```typescript
const { data, error } = await supabase.functions.invoke('create-payment-intent', {
  body: {
    priceId: 'price_your_actual_price_id_here', // Replace with your actual Stripe Price ID
    email: user.email
  }
})
```

## Step 6: Rebuild and Deploy

### 6.1 Update Environment Variables in Netlify
1. Go to your Netlify dashboard
2. Navigate to **Site settings** > **Environment variables**
3. Add/update:
   ```
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
   ```

### 6.2 Rebuild and Deploy
```bash
# Build the project
npm run build

# Deploy to Netlify
netlify deploy --prod
```

## Step 7: Test the Payment Flow

### 7.1 Test Subscription Creation
1. Go to https://saverly-web.netlify.app
2. Create a new account or log in
3. Click "Subscribe" button
4. Use Stripe test card: `4242 4242 4242 4242`
5. Complete the payment flow

### 7.2 Verify Webhook Processing
1. Check Stripe Dashboard > **Webhooks** for successful webhook calls
2. Check Supabase Dashboard > **Table Editor** > `subscription_events` for logged events
3. Check Supabase Dashboard > **Table Editor** > `users` for updated subscription status

## Edge Functions Deployed

The following Edge Functions are already deployed to your Supabase project:

1. **create-payment-intent**: Creates Stripe payment intents for subscriptions
   - URL: `https://lziayzusujlvhebyagdl.supabase.co/functions/v1/create-payment-intent`
   - Function: Handles subscription creation with Stripe

2. **handle-subscription-webhook**: Processes Stripe webhooks
   - URL: `https://lziayzusujlvhebyagdl.supabase.co/functions/v1/handle-subscription-webhook`
   - Function: Updates user subscription status based on Stripe events

## Troubleshooting

### Common Issues

1. **"Payment System Setup Required" message**
   - Ensure all environment variables are set correctly
   - Verify Edge Functions are deployed
   - Check Stripe Price ID is correct

2. **Webhook not processing**
   - Verify webhook URL is correct in Stripe Dashboard
   - Check webhook signing secret matches
   - Review Supabase Function logs

3. **Payment fails**
   - Use Stripe test cards for testing
   - Check browser console for errors
   - Verify Stripe publishable key is correct

### Logs and Monitoring
- **Supabase Function Logs**: Dashboard > Edge Functions > Logs
- **Stripe Webhook Logs**: Dashboard > Webhooks > [Your webhook]
- **Browser Console**: F12 > Console tab

## Security Considerations

1. **Never expose secret keys** in frontend code
2. **Use test keys** during development
3. **Validate all webhook signatures** (already implemented)
4. **Enable RLS policies** on all tables (already implemented)

## Production Checklist

- [ ] Replace test Stripe keys with live keys
- [ ] Update webhook URL to production endpoint
- [ ] Test complete payment flow in production
- [ ] Monitor webhook delivery and processing
- [ ] Set up Stripe Dashboard monitoring and alerts

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Supabase and Stripe logs
3. Verify all configuration steps were completed
4. Test with Stripe's test cards first

The payment system is now ready for testing and production use!