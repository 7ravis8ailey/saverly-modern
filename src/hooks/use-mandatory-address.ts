import { useState, useCallback } from 'react'
import type { PlaceDetails } from '@/components/maps/mandatory-address-select'

interface UseMandatoryAddressOptions {
  required?: boolean
  onAddressChange?: (address: PlaceDetails | null) => void
}

interface UseMandatoryAddressReturn {
  // State
  address: string
  selectedPlace: PlaceDetails | null
  isValid: boolean
  error: string | null
  
  // Actions
  setAddress: (address: string) => void
  setSelectedPlace: (place: PlaceDetails | null) => void
  setError: (error: string | null) => void
  clearAddress: () => void
  validateAddress: () => boolean
  
  // Form integration helpers
  getFormProps: () => {
    value: string
    onChange: (value: string) => void
    onPlaceSelect: (place: PlaceDetails | null) => void
    error?: string
    required?: boolean
  }
}

/**
 * Custom hook for managing mandatory Google Places address selection
 * Provides form validation and state management for address components
 */
export function useMandatoryAddress(options: UseMandatoryAddressOptions = {}): UseMandatoryAddressReturn {
  const { required = true, onAddressChange } = options
  
  const [address, setAddressState] = useState<string>('')
  const [selectedPlace, setSelectedPlaceState] = useState<PlaceDetails | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Address setter with validation
  const setAddress = useCallback((newAddress: string) => {
    setAddressState(newAddress)
    
    // Clear error when user starts typing
    if (error) {
      setError(null)
    }
  }, [error])

  // Place selector with validation
  const setSelectedPlace = useCallback((place: PlaceDetails | null) => {
    setSelectedPlaceState(place)
    setError(null)
    
    // Notify parent component
    if (onAddressChange) {
      onAddressChange(place)
    }
  }, [onAddressChange])

  // Clear all address data
  const clearAddress = useCallback(() => {
    setAddressState('')
    setSelectedPlaceState(null)
    setError(null)
    
    if (onAddressChange) {
      onAddressChange(null)
    }
  }, [onAddressChange])

  // Validation logic
  const isValid = selectedPlace !== null && address.length > 0

  // Validate address selection
  const validateAddress = useCallback((): boolean => {
    if (required && !isValid) {
      setError('Please select a valid address from the suggestions')
      return false
    }
    
    setError(null)
    return true
  }, [required, isValid])

  // Form integration props
  const getFormProps = useCallback(() => ({
    value: address,
    onChange: setAddress,
    onPlaceSelect: setSelectedPlace,
    error: error || undefined,
    required
  }), [address, setAddress, setSelectedPlace, error, required])

  return {
    // State
    address,
    selectedPlace,
    isValid,
    error,
    
    // Actions
    setAddress,
    setSelectedPlace,
    setError,
    clearAddress,
    validateAddress,
    
    // Form integration
    getFormProps
  }
}

// Form validation helper for React Hook Form integration
export function createAddressValidator(required: boolean = true) {
  return {
    validate: (value: any) => {
      if (required && (!value || !value.place_id)) {
        return 'Please select a valid address from the suggestions'
      }
      return true
    }
  }
}

// Type guard for checking if address is selected
export function isAddressSelected(place: PlaceDetails | null): place is PlaceDetails {
  return place !== null && typeof place.place_id === 'string' && place.place_id.length > 0
}

// Utility to extract coordinates from selected place
export function getCoordinates(place: PlaceDetails | null): { lat: number; lng: number } | null {
  if (!isAddressSelected(place)) {
    return null
  }
  
  return {
    lat: place.latitude,
    lng: place.longitude
  }
}

// Utility to format address for display
export function formatAddressDisplay(place: PlaceDetails | null): string {
  if (!isAddressSelected(place)) {
    return ''
  }
  
  return place.formatted_address || place.address
}

// Export types
export type { PlaceDetails, UseMandatoryAddressOptions, UseMandatoryAddressReturn }