/**
 * Google Maps API Validation and Error Handling
 * Saverly v2.0.0 - Production-ready Google Maps integration
 */

import { GoogleMapsStatus } from '@/types'

export interface GoogleMapsValidationResult {
  isValid: boolean
  hasKey: boolean
  keyValid: boolean
  billingEnabled: boolean
  quotaExceeded: boolean
  error?: string
  suggestion?: string
}

/**
 * Validates Google Maps API configuration and status
 */
export async function validateGoogleMapsAPI(): Promise<GoogleMapsValidationResult> {
  const result: GoogleMapsValidationResult = {
    isValid: false,
    hasKey: false,
    keyValid: false,
    billingEnabled: false,
    quotaExceeded: false
  }

  // Check if API key is configured
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    result.error = 'Google Maps API key not configured'
    result.suggestion = 'Add VITE_GOOGLE_MAPS_API_KEY to your environment variables'
    return result
  }

  result.hasKey = true

  // Check if Google Maps API is loaded
  if (!window.google?.maps?.places) {
    result.error = 'Google Maps API not loaded'
    result.suggestion = 'Ensure Google Maps JavaScript API is properly loaded'
    return result
  }

  // Test API key validity with a simple request
  try {
    const service = new window.google.maps.places.AutocompleteService()
    
    return new Promise((resolve) => {
      service.getPlacePredictions(
        {
          input: 'test',
          types: ['address'],
        },
        (predictions: any, status: any) => {
          switch (status) {
            case window.google.maps.places.PlacesServiceStatus.OK:
            case window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS:
              result.isValid = true
              result.keyValid = true
              result.billingEnabled = true
              break

            case window.google.maps.places.PlacesServiceStatus.REQUEST_DENIED:
              result.keyValid = true // Key exists but may have restrictions
              result.error = 'Google Maps billing not enabled or API key restricted'
              result.suggestion = 'Enable billing for your Google Cloud project and ensure Places API is enabled'
              break

            case window.google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT:
              result.keyValid = true
              result.billingEnabled = true
              result.quotaExceeded = true
              result.error = 'Google Maps API quota exceeded'
              result.suggestion = 'Check your Google Cloud Console for quota limits'
              break

            default:
              result.error = `Google Maps API error: ${status}`
              result.suggestion = 'Check your API key configuration and billing settings'
          }
          
          resolve(result)
        }
      )
    })
  } catch (error) {
    result.error = 'Failed to test Google Maps API'
    result.suggestion = 'Check browser console for detailed error information'
    return result
  }
}

/**
 * Gets user-friendly error message based on Google Maps API status
 */
export function getGoogleMapsErrorMessage(status: string): string {
  switch (status) {
    case GoogleMapsStatus.REQUEST_DENIED:
      return 'Google Maps billing not enabled. Please contact support.'
    
    case GoogleMapsStatus.OVER_QUERY_LIMIT:
      return 'Too many requests. Please try again later.'
    
    case GoogleMapsStatus.ZERO_RESULTS:
      return 'No addresses found. Please try a different search.'
    
    case GoogleMapsStatus.INVALID_REQUEST:
      return 'Invalid address search. Please check your input.'
    
    case GoogleMapsStatus.UNKNOWN_ERROR:
      return 'Address lookup service temporarily unavailable.'
    
    default:
      return 'Unable to search addresses at this time.'
  }
}

/**
 * Gets user-friendly suggestion based on Google Maps API status
 */
export function getGoogleMapsSuggestion(status: string): string {
  switch (status) {
    case GoogleMapsStatus.REQUEST_DENIED:
      return 'Contact your administrator to enable Google Maps billing.'
    
    case GoogleMapsStatus.OVER_QUERY_LIMIT:
      return 'Wait a few minutes before searching again.'
    
    case GoogleMapsStatus.ZERO_RESULTS:
      return 'Try typing more of your address or use different keywords.'
    
    case GoogleMapsStatus.INVALID_REQUEST:
      return 'Make sure to type at least 3 characters.'
    
    default:
      return 'Refresh the page or try again later.'
  }
}

/**
 * Monitors Google Maps API health and usage
 */
export class GoogleMapsMonitor {
  private static instance: GoogleMapsMonitor
  private requestCount = 0
  private errorCount = 0
  private startTime = Date.now()

  static getInstance(): GoogleMapsMonitor {
    if (!GoogleMapsMonitor.instance) {
      GoogleMapsMonitor.instance = new GoogleMapsMonitor()
    }
    return GoogleMapsMonitor.instance
  }

  recordRequest(): void {
    this.requestCount++
  }

  recordError(status: string): void {
    this.errorCount++
    console.warn(`Google Maps API error: ${status}`)
  }

  getStats() {
    const uptime = Date.now() - this.startTime
    const errorRate = this.requestCount > 0 ? (this.errorCount / this.requestCount) * 100 : 0

    return {
      requestCount: this.requestCount,
      errorCount: this.errorCount,
      errorRate: parseFloat(errorRate.toFixed(2)),
      uptimeMs: uptime,
      uptimeMinutes: Math.floor(uptime / 60000)
    }
  }

  reset(): void {
    this.requestCount = 0
    this.errorCount = 0
    this.startTime = Date.now()
  }
}

/**
 * Debounces Google Maps API calls to prevent quota exhaustion
 */
export function createAPIDebouncer(delay: number = 300) {
  let timeoutId: NodeJS.Timeout | null = null
  
  return function <T extends any[]>(
    fn: (...args: T) => void,
    ...args: T
  ): void {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
    }
    
    timeoutId = setTimeout(() => {
      fn(...args)
      timeoutId = null
    }, delay)
  }
}

/**
 * Rate limiter for Google Maps API calls
 */
export class GoogleMapsRateLimiter {
  private calls: number[] = []
  private maxCalls: number
  private timeWindow: number

  constructor(maxCalls: number = 10, timeWindowMs: number = 1000) {
    this.maxCalls = maxCalls
    this.timeWindow = timeWindowMs
  }

  canMakeRequest(): boolean {
    const now = Date.now()
    
    // Remove calls outside the time window
    this.calls = this.calls.filter(timestamp => now - timestamp < this.timeWindow)
    
    // Check if we can make another call
    return this.calls.length < this.maxCalls
  }

  recordCall(): void {
    this.calls.push(Date.now())
  }

  getWaitTime(): number {
    if (this.calls.length === 0) return 0
    
    const oldestCall = Math.min(...this.calls)
    const waitTime = this.timeWindow - (Date.now() - oldestCall)
    
    return Math.max(0, waitTime)
  }
}

export default {
  validateGoogleMapsAPI,
  getGoogleMapsErrorMessage,
  getGoogleMapsSuggestion,
  GoogleMapsMonitor,
  createAPIDebouncer,
  GoogleMapsRateLimiter
}