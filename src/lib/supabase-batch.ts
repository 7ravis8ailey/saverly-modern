// PERFORMANCE OPTIMIZATION: Batch operations for database efficiency
import { supabase } from '@/lib/supabase'

/**
 * Batch check usage limits for multiple coupons
 * Eliminates N+1 queries by using single database function call
 */
export async function batchCheckUsageLimits(
  userId: string, 
  couponUids: string[]
): Promise<Record<string, { canRedeem: boolean; reason?: string }>> {
  try {
    // Use existing batch_check_usage_limits function
    const { data, error } = await supabase.rpc('batch_check_usage_limits', {
      user_id: userId,
      coupon_uids: couponUids
    })

    if (error) throw error

    // Transform response to expected format
    return (data || []).reduce((acc: Record<string, any>, item: any) => {
      acc[item.coupon_uid] = {
        canRedeem: item.can_redeem,
        reason: item.reason
      }
      return acc
    }, {})
  } catch (error) {
    console.error('Batch usage limit check failed:', error)
    // Return safe defaults
    return couponUids.reduce((acc, uid) => {
      acc[uid] = { canRedeem: false, reason: 'Check failed' }
      return acc
    }, {} as Record<string, { canRedeem: boolean; reason?: string }>)
  }
}

/**
 * Batch fetch redemption counts
 * Single query instead of N individual queries
 */
export async function batchFetchRedemptionCounts(
  couponUids: string[]
): Promise<Record<string, number>> {
  try {
    const { data } = await supabase
      .from('redemptions')
      .select('couponUid')
      .in('couponUid', couponUids)
      .eq('status', 'redeemed')
    
    return (data || []).reduce((acc: Record<string, number>, item) => {
      acc[item.couponUid] = (acc[item.couponUid] || 0) + 1
      return acc
    }, {})
  } catch (error) {
    console.error('Batch redemption count fetch failed:', error)
    return {}
  }
}

/**
 * Batch insert redemptions
 * Improves performance for multiple redemption operations
 */
export async function batchInsertRedemptions(
  redemptions: Array<{
    userId: string
    couponUid: string
    businessId: string
    redeemedAt?: string
  }>
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('redemptions')
      .insert(
        redemptions.map(r => ({
          userId: r.userId,
          couponUid: r.couponUid,
          businessId: r.businessId,
          redeemedAt: r.redeemedAt || new Date().toISOString(),
          status: 'redeemed'
        }))
      )

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('Batch redemption insert failed:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Batch insert failed' 
    }
  }
}

/**
 * Connection pooling configuration
 * Optimize database connections for better performance
 */
export const performanceConfig = {
  // Connection pool settings
  pool: {
    min: 2,
    max: 10,
    acquireTimeoutMillis: 30000,
    idleTimeoutMillis: 30000
  },
  
  // Query timeout settings
  timeout: {
    query: 10000,
    transaction: 30000
  },
  
  // Cache settings
  cache: {
    ttl: 300000, // 5 minutes
    maxSize: 100
  }
}