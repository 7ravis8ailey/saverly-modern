/**
 * Webhook Resilience System for Saverly
 * Handles webhook failures with retry mechanisms and fallback polling
 */

import { api } from './supabase-api';

interface WebhookEvent {
  id: string;
  type: string;
  data: any;
  attempts: number;
  created_at: string;
  next_attempt_at?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string;
}

interface SubscriptionSyncData {
  user_email: string;
  subscription_status: 'free' | 'active' | 'cancelled' | 'past_due' | 'unpaid' | 'trialing';
  subscription_period_end?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
}

class WebhookResilienceManager {
  private retryIntervals = [1000, 5000, 15000, 60000, 300000]; // 1s, 5s, 15s, 1m, 5m
  private maxRetries = 5;
  private pollingInterval = 30000; // 30 seconds
  private isPolling = false;

  /**
   * Process incoming webhook with resilience handling
   */
  async processWebhook(event: any): Promise<{ success: boolean; error?: string }> {
    try {
      // Store webhook event for retry tracking
      const webhookEvent = await this.storeWebhookEvent(event);
      
      // Process the webhook
      const result = await this.handleWebhookEvent(event);
      
      if (result.success) {
        await this.markWebhookCompleted(webhookEvent.id);
        return { success: true };
      } else {
        await this.scheduleRetry(webhookEvent.id, result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Webhook processing error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Handle specific webhook event types
   */
  private async handleWebhookEvent(event: any): Promise<{ success: boolean; error?: string }> {
    try {
      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          return await this.handleSubscriptionUpdate(event.data.object);
          
        case 'customer.subscription.deleted':
          return await this.handleSubscriptionCanceled(event.data.object);
          
        case 'invoice.payment_succeeded':
          return await this.handlePaymentSucceeded(event.data.object);
          
        case 'invoice.payment_failed':
          return await this.handlePaymentFailed(event.data.object);
          
        default:
          console.log(`Unhandled webhook type: ${event.type}`);
          return { success: true }; // Don't retry unknown events
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Event handling failed' 
      };
    }
  }

  /**
   * Handle subscription updates from Stripe
   */
  private async handleSubscriptionUpdate(subscription: any): Promise<{ success: boolean; error?: string }> {
    try {
      // Get customer email from Stripe (this would be cached or retrieved)
      const customerEmail = await this.getCustomerEmail(subscription.customer);
      
      if (!customerEmail) {
        return { success: false, error: 'Customer email not found' };
      }

      const syncData: SubscriptionSyncData = {
        user_email: customerEmail,
        subscription_status: this.mapStripeStatus(subscription.status),
        subscription_period_end: subscription.current_period_end 
          ? new Date(subscription.current_period_end * 1000).toISOString() 
          : undefined,
        stripe_customer_id: subscription.customer,
        stripe_subscription_id: subscription.id
      };

      return await this.updateUserSubscription(syncData);
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Subscription update failed' 
      };
    }
  }

  /**
   * Handle subscription cancellation
   */
  private async handleSubscriptionCanceled(subscription: any): Promise<{ success: boolean; error?: string }> {
    try {
      const customerEmail = await this.getCustomerEmail(subscription.customer);
      
      if (!customerEmail) {
        return { success: false, error: 'Customer email not found' };
      }

      const syncData: SubscriptionSyncData = {
        user_email: customerEmail,
        subscription_status: 'cancelled',
        subscription_period_end: subscription.current_period_end 
          ? new Date(subscription.current_period_end * 1000).toISOString() 
          : undefined,
        stripe_customer_id: subscription.customer,
        stripe_subscription_id: subscription.id
      };

      return await this.updateUserSubscription(syncData);
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Subscription cancellation failed' 
      };
    }
  }

  /**
   * Handle successful payment
   */
  private async handlePaymentSucceeded(invoice: any): Promise<{ success: boolean; error?: string }> {
    try {
      const customerEmail = await this.getCustomerEmail(invoice.customer);
      
      if (!customerEmail) {
        return { success: false, error: 'Customer email not found' };
      }

      // Reactivate subscription on successful payment
      const syncData: SubscriptionSyncData = {
        user_email: customerEmail,
        subscription_status: 'active'
      };

      return await this.updateUserSubscription(syncData);
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Payment success handling failed' 
      };
    }
  }

  /**
   * Handle failed payment
   */
  private async handlePaymentFailed(invoice: any): Promise<{ success: boolean; error?: string }> {
    try {
      const customerEmail = await this.getCustomerEmail(invoice.customer);
      
      if (!customerEmail) {
        return { success: false, error: 'Customer email not found' };
      }

      const syncData: SubscriptionSyncData = {
        user_email: customerEmail,
        subscription_status: 'past_due'
      };

      return await this.updateUserSubscription(syncData);
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Payment failure handling failed' 
      };
    }
  }

  /**
   * Update user subscription in database
   */
  private async updateUserSubscription(syncData: SubscriptionSyncData): Promise<{ success: boolean; error?: string }> {
    try {
      const updates: any = {
        subscription_status: syncData.subscription_status,
        updated_at: new Date().toISOString()
      };

      if (syncData.subscription_period_end) {
        updates.subscription_period_end = syncData.subscription_period_end;
      }

      if (syncData.stripe_customer_id) {
        updates.stripe_customer_id = syncData.stripe_customer_id;
      }

      if (syncData.stripe_subscription_id) {
        updates.stripe_subscription_id = syncData.stripe_subscription_id;
      }

      const { error } = await api.supabase
        .from('users')
        .update(updates)
        .eq('email', syncData.user_email);

      if (error) {
        return { success: false, error: error.message };
      }

      console.log(`✅ Updated subscription for ${syncData.user_email}: ${syncData.subscription_status}`);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Database update failed' 
      };
    }
  }

  /**
   * Store webhook event for retry tracking
   */
  private async storeWebhookEvent(event: any): Promise<WebhookEvent> {
    const webhookEvent: WebhookEvent = {
      id: event.id || `webhook_${Date.now()}_${Math.random()}`,
      type: event.type,
      data: event,
      attempts: 0,
      created_at: new Date().toISOString(),
      status: 'pending'
    };

    // Store in database for retry tracking
    const { error } = await api.supabase
      .from('webhook_events')
      .insert([webhookEvent]);

    if (error) {
      console.error('Failed to store webhook event:', error);
    }

    return webhookEvent;
  }

  /**
   * Mark webhook as completed
   */
  private async markWebhookCompleted(eventId: string): Promise<void> {
    await api.supabase
      .from('webhook_events')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', eventId);
  }

  /**
   * Schedule webhook retry
   */
  private async scheduleRetry(eventId: string, error?: string): Promise<void> {
    const { data: event } = await api.supabase
      .from('webhook_events')
      .select('attempts')
      .eq('id', eventId)
      .single();

    const attempts = (event?.attempts || 0) + 1;
    
    if (attempts >= this.maxRetries) {
      // Max retries reached, mark as failed
      await api.supabase
        .from('webhook_events')
        .update({ 
          status: 'failed',
          attempts,
          error_message: error,
          updated_at: new Date().toISOString()
        })
        .eq('id', eventId);
      return;
    }

    // Schedule next retry
    const nextAttemptDelay = this.retryIntervals[attempts - 1] || this.retryIntervals[this.retryIntervals.length - 1];
    const nextAttemptAt = new Date(Date.now() + nextAttemptDelay).toISOString();

    await api.supabase
      .from('webhook_events')
      .update({ 
        attempts,
        next_attempt_at: nextAttemptAt,
        error_message: error,
        updated_at: new Date().toISOString()
      })
      .eq('id', eventId);

    // Schedule retry execution
    setTimeout(() => {
      this.retryWebhookEvent(eventId);
    }, nextAttemptDelay);
  }

  /**
   * Retry failed webhook event
   */
  private async retryWebhookEvent(eventId: string): Promise<void> {
    try {
      const { data: event, error } = await api.supabase
        .from('webhook_events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error || !event) {
        console.error('Failed to retrieve webhook event for retry:', error);
        return;
      }

      // Update status to processing
      await api.supabase
        .from('webhook_events')
        .update({ 
          status: 'processing',
          updated_at: new Date().toISOString()
        })
        .eq('id', eventId);

      // Retry processing
      const result = await this.handleWebhookEvent(event.data);
      
      if (result.success) {
        await this.markWebhookCompleted(eventId);
      } else {
        await this.scheduleRetry(eventId, result.error);
      }
    } catch (error) {
      console.error('Webhook retry failed:', error);
      await this.scheduleRetry(eventId, error instanceof Error ? error.message : 'Retry failed');
    }
  }

  /**
   * Start fallback polling for subscription sync
   */
  public startFallbackPolling(): void {
    if (this.isPolling) return;

    this.isPolling = true;
    this.pollSubscriptionStatus();
  }

  /**
   * Stop fallback polling
   */
  public stopFallbackPolling(): void {
    this.isPolling = false;
  }

  /**
   * Poll for subscription status discrepancies
   */
  private async pollSubscriptionStatus(): Promise<void> {
    if (!this.isPolling) return;

    try {
      // Check for users with potential subscription discrepancies
      const { data: users, error } = await api.supabase
        .from('users')
        .select('id, email, subscription_status, stripe_subscription_id, updated_at')
        .not('stripe_subscription_id', 'is', null)
        .lt('updated_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()); // Not updated in last 5 minutes

      if (!error && users && users.length > 0) {
        console.log(`Polling found ${users.length} users needing subscription sync check`);
        
        // This would integrate with Stripe API to verify current status
        // For now, we log the users that might need syncing
        for (const user of users) {
          console.log(`User ${user.email} may need subscription sync check`);
        }
      }
    } catch (error) {
      console.error('Subscription polling error:', error);
    }

    // Schedule next poll
    if (this.isPolling) {
      setTimeout(() => this.pollSubscriptionStatus(), this.pollingInterval);
    }
  }

  /**
   * Get customer email from Stripe customer ID
   * This would typically cache customer data or make Stripe API calls
   */
  private async getCustomerEmail(customerId: string): Promise<string | null> {
    // In production, this would:
    // 1. Check local cache first
    // 2. Query Stripe API if not cached
    // 3. Store result for future use
    
    // For now, we'll look it up in our users table
    const { data: user, error } = await api.supabase
      .from('users')
      .select('email')
      .eq('stripe_customer_id', customerId)
      .single();

    if (error || !user) {
      console.error('Customer email lookup failed:', error);
      return null;
    }

    return user.email;
  }

  /**
   * Map Stripe subscription status to our internal status
   */
  private mapStripeStatus(stripeStatus: string): SubscriptionSyncData['subscription_status'] {
    switch (stripeStatus) {
      case 'active':
        return 'active';
      case 'canceled':
      case 'cancelled':
        return 'cancelled';
      case 'past_due':
        return 'past_due';
      case 'unpaid':
        return 'unpaid';
      case 'trialing':
        return 'trialing';
      default:
        return 'free';
    }
  }

  /**
   * Get retry statistics for monitoring
   */
  public async getRetryStats(): Promise<{
    pending: number;
    processing: number;
    failed: number;
    completed: number;
  }> {
    const { data: stats, error } = await api.supabase
      .rpc('get_webhook_stats');

    if (error) {
      console.error('Failed to get webhook stats:', error);
      return { pending: 0, processing: 0, failed: 0, completed: 0 };
    }

    return stats || { pending: 0, processing: 0, failed: 0, completed: 0 };
  }
}

// Export singleton instance
export const webhookManager = new WebhookResilienceManager();

// Auto-start fallback polling in production
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  webhookManager.startFallbackPolling();
}