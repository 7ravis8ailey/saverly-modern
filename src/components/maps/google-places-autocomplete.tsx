import React, { useEffect, useRef, useState } from 'react'
import { getGoogleMapsApiKey } from '@/api/functions'

declare global {
  interface Window {
    google: any
  }
}

interface GooglePlacesAutocompleteProps {
  onPlaceSelected: (place: any) => void
  defaultValue?: string
  className?: string
  placeholder?: string
}

const loadGoogleMapsScript = (apiKey: string, callback: () => void) => {
  const existingScript = document.getElementById('googleMapsScript')
  if (!existingScript) {
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
    script.id = 'googleMapsScript'
    document.body.appendChild(script)
    script.onload = () => {
      if (callback) callback()
    }
  } else if (window.google && callback) {
    callback()
  }
}

export default function GooglePlacesAutocomplete({ 
  onPlaceSelected, 
  defaultValue = "",
  className = "",
  placeholder = "Start typing your address..."
}: GooglePlacesAutocompleteProps) {
  const autocompleteInput = useRef<HTMLInputElement>(null)
  const [inputValue, setInputValue] = useState(defaultValue)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setInputValue(defaultValue)
  }, [defaultValue])

  useEffect(() => {
    let autocomplete: any = null

    const initAutocomplete = () => {
      if (window.google && autocompleteInput.current) {
        try {
          autocomplete = new window.google.maps.places.Autocomplete(
            autocompleteInput.current,
            { 
              types: ['address'],
              componentRestrictions: { country: 'us' }
            }
          )
          autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace()
            console.log('Place changed:', place)
            if (place.geometry) {
              onPlaceSelected(place)
              setInputValue(place.formatted_address)
            } else {
              console.log('No geometry in place result')
            }
          })
          setError(null)
        } catch (error) {
          console.error("Error initializing Google Places Autocomplete:", error)
          setError("Address lookup unavailable")
        }
      }
    }
    
    setIsLoading(true)
    
    // Fetch API key from backend like the original base44 implementation
    getGoogleMapsApiKey().then(({ data, error }) => {
        if (error) {
            throw new Error(error)
        }
        if(data && data.apiKey){
            loadGoogleMapsScript(data.apiKey, initAutocomplete)
        } else {
            throw new Error("No API key received")
        }
    }).catch(err => {
        console.error("Could not load Google Maps API Key", err)
        setError("Address search unavailable")
    }).finally(() => {
        setIsLoading(false)
    })

    return () => {
      if (autocomplete) {
        try {
          window.google.maps.event.clearInstanceListeners(autocomplete)
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    }
  }, [onPlaceSelected])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)
    
    // Allow manual address entry as fallback
    if (value.length > 10 && value.includes(',')) {
      onPlaceSelected({ formatted_address: value })
    }
  }

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Don't auto-select if user has typed content
    if (!inputValue || inputValue === defaultValue) {
      e.target.select()
    }
  }

  const handleBlur = () => {
    // If user typed an address manually, accept it
    if (inputValue && inputValue !== defaultValue) {
      onPlaceSelected({ formatted_address: inputValue })
    }
  }

  if (error) {
    return (
      <input
        type="text"
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        className={`${className} border-red-300 bg-red-50`}
        placeholder="Enter your address manually..."
        required
      />
    )
  }

  return (
    <input
      ref={autocompleteInput}
      value={inputValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={className}
      placeholder={isLoading ? "Loading address search..." : placeholder}
      required
      disabled={isLoading}
      autoComplete="new-address"
    />
  )
}