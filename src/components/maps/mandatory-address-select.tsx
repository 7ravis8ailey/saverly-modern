import { useState, useRef, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { MapPin, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GooglePlace {
  place_id: string
  description: string
  structured_formatting: {
    main_text: string
    secondary_text: string
  }
}

interface PlaceDetails {
  address: string
  city: string
  state: string
  zipCode: string
  latitude: number
  longitude: number
  formatted_address: string
  place_id: string
}

interface MandatoryAddressSelectProps {
  value: string
  onChange: (value: string) => void
  onPlaceSelect: (place: PlaceDetails | null) => void
  placeholder?: string
  className?: string
  required?: boolean
  error?: string
}

declare global {
  interface Window {
    google: any
  }
}

export function MandatoryAddressSelect({ 
  value, 
  onChange, 
  onPlaceSelect, 
  placeholder = "Type address (3+ characters required)...",
  className,
  required = true,
  error
}: MandatoryAddressSelectProps) {
  const [suggestions, setSuggestions] = useState<GooglePlace[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [selectedPlace, setSelectedPlace] = useState<PlaceDetails | null>(null)
  const [hasUserSelection, setHasUserSelection] = useState(false)
  
  const autocompleteService = useRef<any>(null)
  const placesService = useRef<any>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)

  // Initialize Google Maps API
  useEffect(() => {
    const initializeGoogleMaps = async () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        try {
          autocompleteService.current = new window.google.maps.places.AutocompleteService()
          placesService.current = new window.google.maps.places.PlacesService(
            document.createElement('div')
          )
          setIsGoogleLoaded(true)
          console.log('Google Maps services initialized successfully')
        } catch (error) {
          console.error('Error initializing Google Maps services:', error)
          setApiError('Failed to initialize address lookup service')
        }
        return
      }

      // Load Google Maps API if not already loaded
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
      if (!existingScript) {
        const script = document.createElement('script')
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
        
        if (!apiKey) {
          setApiError('Google Maps API key not configured')
          return
        }

        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
        script.async = false
        script.defer = false
        
        script.onload = () => {
          setTimeout(() => {
            if (window.google && window.google.maps && window.google.maps.places) {
              try {
                autocompleteService.current = new window.google.maps.places.AutocompleteService()
                placesService.current = new window.google.maps.places.PlacesService(
                  document.createElement('div')
                )
                setIsGoogleLoaded(true)
                console.log('Google Maps services initialized after script load')
              } catch (error) {
                console.error('Error initializing Google Maps services after load:', error)
                setApiError('Failed to initialize address lookup service')
              }
            } else {
              setApiError('Google Maps API failed to load properly')
            }
          }, 100)
        }
        
        script.onerror = () => {
          console.error('Failed to load Google Maps API script')
          setApiError('Unable to load address lookup service')
        }
        
        document.head.appendChild(script)
      }
    }

    initializeGoogleMaps()
  }, [])

  // Debounced address suggestions fetcher
  const fetchSuggestions = useCallback(async (input: string) => {
    if (!autocompleteService.current || input.length < 3) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    setIsLoading(true)
    
    try {
      autocompleteService.current.getPlacePredictions(
        {
          input,
          types: ['address'],
          componentRestrictions: { country: 'us' }
        },
        (predictions: GooglePlace[] | null, status: string) => {
          setIsLoading(false)
          
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            setSuggestions(predictions.slice(0, 5))
            setShowSuggestions(true)
            setApiError(null)
          } else if (status === window.google.maps.places.PlacesServiceStatus.REQUEST_DENIED) {
            setApiError('Google Maps billing not enabled. Please contact support.')
            setSuggestions([])
            setShowSuggestions(false)
          } else if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            setSuggestions([])
            setShowSuggestions(false)
          } else {
            console.warn('Places API status:', status)
            setSuggestions([])
            setShowSuggestions(false)
          }
        }
      )
    } catch (error) {
      console.error('Error fetching address suggestions:', error)
      setIsLoading(false)
      setSuggestions([])
      setApiError('Error fetching address suggestions')
    }
  }, [])

  // Handle place selection with mandatory enforcement
  const selectPlace = useCallback((placeId: string, description: string) => {
    if (!placesService.current) return

    setShowSuggestions(false)
    setIsLoading(true)
    
    placesService.current.getDetails(
      {
        placeId,
        fields: ['address_components', 'geometry', 'formatted_address', 'place_id']
      },
      (place: any, status: string) => {
        setIsLoading(false)
        
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
          const addressComponents = place.address_components || []
          
          let address = ''
          let city = ''
          let state = ''
          let zipCode = ''
          
          // Parse address components
          addressComponents.forEach((component: any) => {
            const types = component.types
            
            if (types.includes('street_number')) {
              address = component.long_name + ' '
            } else if (types.includes('route')) {
              address += component.long_name
            } else if (types.includes('locality')) {
              city = component.long_name
            } else if (types.includes('administrative_area_level_1')) {
              state = component.short_name
            } else if (types.includes('postal_code')) {
              zipCode = component.long_name
            }
          })

          const latitude = place.geometry?.location?.lat() || 0
          const longitude = place.geometry?.location?.lng() || 0

          const placeDetails: PlaceDetails = {
            address: address || place.formatted_address || description,
            city,
            state,
            zipCode,
            latitude,
            longitude,
            formatted_address: place.formatted_address || description,
            place_id: place.place_id
          }

          setSelectedPlace(placeDetails)
          setHasUserSelection(true)
          onChange(placeDetails.formatted_address)
          onPlaceSelect(placeDetails)
          setApiError(null)
        } else {
          setApiError('Unable to get place details')
          setSelectedPlace(null)
          setHasUserSelection(false)
          onPlaceSelect(null)
        }
      }
    )
  }, [onChange, onPlaceSelect])

  // Handle input changes with debouncing
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    
    // Clear previous selection when user types
    if (hasUserSelection) {
      setSelectedPlace(null)
      setHasUserSelection(false)
      onPlaceSelect(null)
    }
    
    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }
    
    // Debounce the API call
    debounceTimer.current = setTimeout(() => {
      if (newValue.length >= 3) {
        fetchSuggestions(newValue)
      } else {
        setSuggestions([])
        setShowSuggestions(false)
      }
    }, 300)
  }, [onChange, onPlaceSelect, hasUserSelection, fetchSuggestions])

  const handleInputFocus = () => {
    if (suggestions.length > 0 && value.length >= 3) {
      setShowSuggestions(true)
    }
  }

  const handleInputBlur = () => {
    // Add delay to allow clicking on suggestions
    setTimeout(() => {
      setShowSuggestions(false)
    }, 200)
  }

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [])

  // Determine validation state
  const isValid = hasUserSelection && selectedPlace !== null
  const showError = (error || (!isValid && required && value.length > 0))
  const showSuccess = isValid && hasUserSelection

  if (!isGoogleLoaded) {
    return (
      <div className="relative">
        <Input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          placeholder="Loading address lookup..."
          className={cn(className, "pr-10")}
          disabled
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          className={cn(
            className,
            "pr-10",
            showError && "border-red-500 focus-visible:ring-red-500",
            showSuccess && "border-green-500 focus-visible:ring-green-500"
          )}
          required={required}
          aria-invalid={showError ? "true" : "false"}
          aria-describedby={showError ? "address-error" : undefined}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          ) : showError ? (
            <AlertCircle className="h-4 w-4 text-red-500" />
          ) : showSuccess ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <MapPin className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </div>

      {/* Error message */}
      {showError && (
        <p id="address-error" className="mt-1 text-sm text-red-600">
          {error || (required && !isValid ? "Please select an address from the suggestions" : "")}
        </p>
      )}

      {/* Success message */}
      {showSuccess && (
        <p className="mt-1 text-sm text-green-600">
          Address validated and coordinates captured
        </p>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <Card className="absolute z-50 w-full mt-1 py-2 shadow-lg border bg-white max-h-64 overflow-y-auto">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.place_id}
              className="px-4 py-3 hover:bg-gray-100 cursor-pointer transition-colors border-b border-gray-50 last:border-b-0"
              onMouseDown={() => selectPlace(suggestion.place_id, suggestion.description)}
            >
              <div className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-grow min-w-0">
                  <div className="font-medium text-sm truncate text-gray-900">
                    {suggestion.structured_formatting.main_text}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {suggestion.structured_formatting.secondary_text}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </Card>
      )}
      
      {/* No results message */}
      {showSuggestions && suggestions.length === 0 && !isLoading && value.length >= 3 && !apiError && (
        <Card className="absolute z-50 w-full mt-1 py-4 shadow-lg border bg-white">
          <div className="px-4 text-center text-sm text-gray-500">
            <MapPin className="h-5 w-5 text-gray-400 mx-auto mb-2" />
            No addresses found. Please try a different search.
          </div>
        </Card>
      )}
      
      {/* API Error message */}
      {apiError && (
        <Card className="absolute z-50 w-full mt-1 py-4 shadow-lg border bg-red-50 border-red-200">
          <div className="px-4 text-center text-sm text-red-600">
            <AlertCircle className="h-5 w-5 text-red-500 mx-auto mb-2" />
            <div className="font-medium">Address lookup unavailable</div>
            <div className="text-xs mt-1">{apiError}</div>
          </div>
        </Card>
      )}

      {/* Coordinates display (if selected) */}
      {selectedPlace && (
        <div className="mt-2 text-xs text-gray-500 space-y-1">
          <div>Latitude: {selectedPlace.latitude.toFixed(6)}</div>
          <div>Longitude: {selectedPlace.longitude.toFixed(6)}</div>
        </div>
      )}
    </div>
  )
}

// Export types for external use
export type { PlaceDetails, MandatoryAddressSelectProps }