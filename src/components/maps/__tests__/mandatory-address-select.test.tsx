import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MandatoryAddressSelect } from '../mandatory-address-select'

// Mock Google Maps API
const mockAutocompleteService = {
  getPlacePredictions: vi.fn()
}

const mockPlacesService = {
  getDetails: vi.fn()
}

const mockGoogleMaps = {
  google: {
    maps: {
      places: {
        AutocompleteService: vi.fn(() => mockAutocompleteService),
        PlacesService: vi.fn(() => mockPlacesService),
        PlacesServiceStatus: {
          OK: 'OK',
          REQUEST_DENIED: 'REQUEST_DENIED',
          ZERO_RESULTS: 'ZERO_RESULTS'
        }
      }
    }
  }
}

// Mock environment variable
vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' ')
}))

describe('MandatoryAddressSelect', () => {
  const mockOnChange = vi.fn()
  const mockOnPlaceSelect = vi.fn()

  const defaultProps = {
    value: '',
    onChange: mockOnChange,
    onPlaceSelect: mockOnPlaceSelect,
    placeholder: 'Enter address...'
  }

  beforeEach(() => {
    // Mock Google Maps API
    Object.defineProperty(window, 'google', {
      value: mockGoogleMaps.google,
      writable: true
    })

    // Mock environment variable
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', 'test-api-key')

    // Clear all mocks
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('renders loading state initially', () => {
    // Remove Google Maps to simulate loading
    delete (window as any).google

    render(<MandatoryAddressSelect {...defaultProps} />)
    
    expect(screen.getByPlaceholderText('Loading address lookup...')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toBeDisabled()
  })

  it('renders input field when Google Maps is loaded', async () => {
    render(<MandatoryAddressSelect {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Enter address...')).toBeInTheDocument()
      expect(screen.getByRole('textbox')).not.toBeDisabled()
    })
  })

  it('shows suggestions when typing 3+ characters', async () => {
    const user = userEvent.setup()
    
    const mockPredictions = [
      {
        place_id: 'place1',
        description: '123 Main St, Anytown, USA',
        structured_formatting: {
          main_text: '123 Main St',
          secondary_text: 'Anytown, USA'
        }
      },
      {
        place_id: 'place2',
        description: '456 Oak Ave, Somewhere, USA',
        structured_formatting: {
          main_text: '456 Oak Ave',
          secondary_text: 'Somewhere, USA'
        }
      }
    ]

    mockAutocompleteService.getPlacePredictions.mockImplementation((request, callback) => {
      callback(mockPredictions, 'OK')
    })

    render(<MandatoryAddressSelect {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByRole('textbox')).not.toBeDisabled()
    })

    const input = screen.getByRole('textbox')
    await user.type(input, 'Mai')

    await waitFor(() => {
      expect(mockAutocompleteService.getPlacePredictions).toHaveBeenCalledWith({
        input: 'Mai',
        types: ['address'],
        componentRestrictions: { country: 'us' }
      }, expect.any(Function))
    })

    await waitFor(() => {
      expect(screen.getByText('123 Main St')).toBeInTheDocument()
      expect(screen.getByText('456 Oak Ave')).toBeInTheDocument()
    })
  })

  it('does not show suggestions for less than 3 characters', async () => {
    const user = userEvent.setup()
    
    render(<MandatoryAddressSelect {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByRole('textbox')).not.toBeDisabled()
    })

    const input = screen.getByRole('textbox')
    await user.type(input, 'Ma')

    // Wait a bit to ensure no API call is made
    await new Promise(resolve => setTimeout(resolve, 400))

    expect(mockAutocompleteService.getPlacePredictions).not.toHaveBeenCalled()
  })

  it('handles place selection correctly', async () => {
    const user = userEvent.setup()
    
    const mockPredictions = [
      {
        place_id: 'place1',
        description: '123 Main St, Anytown, USA',
        structured_formatting: {
          main_text: '123 Main St',
          secondary_text: 'Anytown, USA'
        }
      }
    ]

    const mockPlaceDetails = {
      place_id: 'place1',
      formatted_address: '123 Main St, Anytown, USA 12345',
      address_components: [
        { types: ['street_number'], long_name: '123' },
        { types: ['route'], long_name: 'Main St' },
        { types: ['locality'], long_name: 'Anytown' },
        { types: ['administrative_area_level_1'], short_name: 'USA' },
        { types: ['postal_code'], long_name: '12345' }
      ],
      geometry: {
        location: {
          lat: () => 40.7128,
          lng: () => -74.0060
        }
      }
    }

    mockAutocompleteService.getPlacePredictions.mockImplementation((request, callback) => {
      callback(mockPredictions, 'OK')
    })

    mockPlacesService.getDetails.mockImplementation((request, callback) => {
      callback(mockPlaceDetails, 'OK')
    })

    render(<MandatoryAddressSelect {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByRole('textbox')).not.toBeDisabled()
    })

    const input = screen.getByRole('textbox')
    await user.type(input, 'Main')

    await waitFor(() => {
      expect(screen.getByText('123 Main St')).toBeInTheDocument()
    })

    // Click on the suggestion
    await user.click(screen.getByText('123 Main St'))

    await waitFor(() => {
      expect(mockPlacesService.getDetails).toHaveBeenCalledWith({
        placeId: 'place1',
        fields: ['address_components', 'geometry', 'formatted_address', 'place_id']
      }, expect.any(Function))
    })

    await waitFor(() => {
      expect(mockOnPlaceSelect).toHaveBeenCalledWith({
        address: '123 Main St',
        city: 'Anytown',
        state: 'USA',
        zipCode: '12345',
        latitude: 40.7128,
        longitude: -74.0060,
        formatted_address: '123 Main St, Anytown, USA 12345',
        place_id: 'place1'
      })
    })
  })

  it('shows error state when API fails', async () => {
    const user = userEvent.setup()
    
    mockAutocompleteService.getPlacePredictions.mockImplementation((request, callback) => {
      callback(null, 'REQUEST_DENIED')
    })

    render(<MandatoryAddressSelect {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByRole('textbox')).not.toBeDisabled()
    })

    const input = screen.getByRole('textbox')
    await user.type(input, 'Main')

    await waitFor(() => {
      expect(screen.getByText('Google Maps billing not enabled. Please contact support.')).toBeInTheDocument()
    })
  })

  it('shows validation error when required and no selection made', () => {
    render(
      <MandatoryAddressSelect 
        {...defaultProps} 
        value="some typed text"
        required={true}
      />
    )
    
    expect(screen.getByText('Please select an address from the suggestions')).toBeInTheDocument()
  })

  it('shows success state when valid address is selected', async () => {
    const mockPlaceDetails = {
      address: '123 Main St',
      city: 'Anytown',
      state: 'USA',
      zipCode: '12345',
      latitude: 40.7128,
      longitude: -74.0060,
      formatted_address: '123 Main St, Anytown, USA 12345',
      place_id: 'place1'
    }

    render(
      <MandatoryAddressSelect 
        {...defaultProps} 
        value="123 Main St, Anytown, USA 12345"
      />
    )

    // Simulate successful selection by calling onPlaceSelect
    const { rerender } = render(
      <MandatoryAddressSelect {...defaultProps} />
    )

    // This would normally be triggered by the component's internal logic
    mockOnPlaceSelect(mockPlaceDetails)

    await waitFor(() => {
      expect(screen.getByText('Address validated and coordinates captured')).toBeInTheDocument()
    })
  })

  it('clears selection when user starts typing again', async () => {
    const user = userEvent.setup()
    
    render(<MandatoryAddressSelect {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByRole('textbox')).not.toBeDisabled()
    })

    const input = screen.getByRole('textbox')
    
    // First, simulate having a selection, then typing new text
    await user.type(input, 'New address')

    expect(mockOnChange).toHaveBeenCalledWith('New address')
    expect(mockOnPlaceSelect).toHaveBeenCalledWith(null)
  })
})