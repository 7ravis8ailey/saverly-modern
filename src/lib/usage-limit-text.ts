// PERFORMANCE OPTIMIZATION: Move utility function outside component to reduce bundle size
export function getUsageLimitText(usageLimit: string): string {
  switch (usageLimit) {
    case 'one_time':
      return 'One-time use'
    case 'daily':
      return 'Daily use'
    case 'monthly_one':
      return '1x per month'
    case 'monthly_two':
      return '2x per month'
    case 'monthly_four':
      return '4x per month'
    default:
      return 'Limited use'
  }
}