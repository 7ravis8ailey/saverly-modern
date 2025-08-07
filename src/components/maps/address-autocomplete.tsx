import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { MapPin, Loader2 } from 'lucide-react'

interface AddressSuggestion {
  place_id: string
  description: string
  structured_formatting: {
    main_text: string
    secondary_text: string
  }
}

interface AddressDetails {
  address: string
  city: string
  state: string
  zipCode: string
  latitude: number
  longitude: number
}

interface AddressAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onAddressSelect: (address: AddressDetails) => void
  placeholder?: string
  className?: string
}

declare global {
  interface Window {
    google: any
    initGoogleMaps: () => void
  }
}

export function AddressAutocomplete({ 
  value, 
  onChange, 
  onAddressSelect, 
  placeholder = "Enter address...",
  className 
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  
  const autocompleteService = useRef<any>(null)
  const placesService = useRef<any>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Initialize Google Maps API when component mounts
  useEffect(() => {
    const initializeGoogleMaps = () => {
      console.log('Initializing Google Maps API...')
      console.log('API Key:', import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? 'Present' : 'Missing')
      
      if (window.google && window.google.maps && window.google.maps.places) {
        console.log('Google Maps API already loaded, initializing services...')
        try {
          autocompleteService.current = new window.google.maps.places.AutocompleteService()
          placesService.current = new window.google.maps.places.PlacesService(
            document.createElement('div')
          )
          setIsGoogleLoaded(true)
          console.log('Google Maps services initialized successfully!')
        } catch (error) {
          console.error('Error initializing Google Maps services:', error)
        }
        return
      }

      // Load Google Maps API if not already loaded
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
      if (!existingScript) {
        console.log('Loading Google Maps API script...')
        const script = document.createElement('script')
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
        
        // Use a simpler approach without callback conflicts
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
        script.async = false
        script.defer = false
        
        script.onload = () => {
          console.log('Google Maps API script loaded, initializing services...')
          try {
            // Add a small delay to ensure everything is ready
            setTimeout(() => {
              if (window.google && window.google.maps && window.google.maps.places) {
                autocompleteService.current = new window.google.maps.places.AutocompleteService()
                placesService.current = new window.google.maps.places.PlacesService(
                  document.createElement('div')
                )
                setIsGoogleLoaded(true)
                console.log('Google Maps services initialized successfully!')
              } else {
                console.error('Google Maps API not fully loaded after script load')
              }
            }, 100)
          } catch (error) {
            console.error('Error initializing Google Maps services after load:', error)
          }
        }
        
        script.onerror = (error) => {
          console.error('Failed to load Google Maps API script:', error)
        }
        
        document.head.appendChild(script)
        console.log('Google Maps script added to head (no callback)')
      } else {
        console.log('Google Maps script already exists in DOM, checking if loaded...')
        // If script exists but services aren't initialized, try again after delay
        setTimeout(() => {
          if (window.google && window.google.maps && window.google.maps.places && !isGoogleLoaded) {
            try {
              autocompleteService.current = new window.google.maps.places.AutocompleteService()
              placesService.current = new window.google.maps.places.PlacesService(
                document.createElement('div')
              )
              setIsGoogleLoaded(true)
              console.log('Google Maps services initialized from existing script!')
            } catch (error) {
              console.error('Error initializing Google Maps services from existing script:', error)
            }
          }
        }, 500)
      }
    }

    initializeGoogleMaps()
  }, [])

  // Fetch address suggestions from Google Places API
  const fetchSuggestions = async (input: string) => {
    console.log('fetchSuggestions called with input:', input)
    console.log('autocompleteService.current:', autocompleteService.current ? 'Available' : 'Not available')
    console.log('Input length:', input.length)
    
    if (!autocompleteService.current || input.length < 3) {
      console.log('Skipping fetch - service not ready or input too short')
      setSuggestions([])
      return
    }

    console.log('Starting to fetch suggestions...')
    setIsLoading(true)
    
    try {
      autocompleteService.current.getPlacePredictions(
        {
          input,
          types: ['address'],
          componentRestrictions: { country: 'us' }
        },
        (predictions: AddressSuggestion[] | null, status: string) => {
          console.log('Google Places API response:', { predictions, status })
          setIsLoading(false)
          
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            console.log('Received', predictions.length, 'predictions')
            setSuggestions(predictions.slice(0, 5)) // Limit to 5 suggestions
            setShowSuggestions(true)
            setApiError(null)
          } else if (status === window.google.maps.places.PlacesServiceStatus.REQUEST_DENIED) {
            console.error('Google Places API: REQUEST_DENIED - Billing may not be enabled')
            setApiError('Google Maps billing not enabled. Please contact support.')
            setSuggestions([])
            setShowSuggestions(false)
          } else {
            console.log('No predictions or error status:', status)
            setSuggestions([])
            setShowSuggestions(false)
          }
        }
      )
    } catch (error) {
      console.error('Error fetching address suggestions:', error)
      setIsLoading(false)
      setSuggestions([])
    }
  }

  // Get detailed place information when user selects an address
  const selectAddress = (placeId: string, description: string) => {
    if (!placesService.current) return

    setShowSuggestions(false)
    onChange(description)
    
    placesService.current.getDetails(
      {
        placeId,
        fields: ['address_components', 'geometry', 'formatted_address']
      },
      (place: any, status: string) => {
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

          onAddressSelect({
            address: address || place.formatted_address || description,
            city,
            state,
            zipCode,
            latitude,
            longitude
          })
        }
      }
    )
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    
    if (newValue.length >= 3) {
      fetchSuggestions(newValue)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true)
    }
  }

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => {
      setShowSuggestions(false)
    }, 200)
  }

  if (!isGoogleLoaded) {
    return (
      <div className="relative">
        <Input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          placeholder="Loading maps..."
          className={className}
          disabled
        />
        <div className="absolute right-3 top-3">
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
          className={className}
        />
        <div className="absolute right-3 top-3">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          ) : (
            <MapPin className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <Card className="absolute z-50 w-full mt-1 py-2 shadow-lg border bg-white">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.place_id}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer transition-colors"
              onMouseDown={() => selectAddress(suggestion.place_id, suggestion.description)}
            >
              <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-grow min-w-0">
                  <div className="font-medium text-sm truncate">
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
            No addresses found. Please check your input.
          </div>
        </Card>
      )}
      
      {/* API Error message */}
      {apiError && (
        <Card className="absolute z-50 w-full mt-1 py-4 shadow-lg border bg-red-50 border-red-200">
          <div className="px-4 text-center text-sm text-red-600">
            <div className="font-medium">Google Maps unavailable</div>
            <div className="text-xs mt-1">Please type your full address manually</div>
          </div>
        </Card>
      )}
    </div>
  )
}