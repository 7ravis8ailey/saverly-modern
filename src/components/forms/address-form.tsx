import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MandatoryAddressSelect, type PlaceDetails } from '@/components/maps/mandatory-address-select'
import { useMandatoryAddress } from '@/hooks/use-mandatory-address'
import { Input } from '@/components/ui/input'
import { MapPin } from 'lucide-react'

// Form validation schema
const addressFormSchema = z.object({
  businessName: z.string().min(1, 'Business name is required'),
  address: z.object({
    place_id: z.string().min(1, 'Please select an address from the suggestions'),
    formatted_address: z.string().min(1, 'Address is required'),
    latitude: z.number(),
    longitude: z.number(),
    address: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string()
  }).refine(
    (data) => data.place_id && data.place_id.length > 0,
    'Please select a valid address from Google suggestions'
  ),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal(''))
})

type AddressFormData = z.infer<typeof addressFormSchema>

interface AddressFormProps {
  onSubmit: (data: AddressFormData) => void | Promise<void>
  initialValues?: Partial<AddressFormData>
  isLoading?: boolean
  className?: string
}

export function AddressForm({
  onSubmit,
  initialValues,
  isLoading = false,
  className
}: AddressFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Initialize mandatory address hook
  const {
    address,
    selectedPlace,
    isValid: isAddressValid,
    error: addressError,
    getFormProps
  } = useMandatoryAddress({
    required: true,
    onAddressChange: (place) => {
      // Update form value when address is selected
      if (place) {
        setValue('address', place, { shouldValidate: true })
      } else {
        setValue('address', null as any, { shouldValidate: true })
      }
    }
  })

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid }
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: {
      businessName: initialValues?.businessName || '',
      address: initialValues?.address || null as any,
      phone: initialValues?.phone || '',
      website: initialValues?.website || ''
    },
    mode: 'onChange'
  })

  const watchedAddress = watch('address')

  // Handle form submission
  const onFormSubmit = async (data: AddressFormData) => {
    if (!isAddressValid || !selectedPlace) {
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(data)
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const canSubmit = isValid && isAddressValid && selectedPlace !== null && !isSubmitting && !isLoading

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MapPin className="h-5 w-5" />
          <span>Business Address Information</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          {/* Business Name */}
          <div className="space-y-2">
            <label htmlFor="businessName" className="text-sm font-medium">
              Business Name *
            </label>
            <Input
              id="businessName"
              {...register('businessName')}
              placeholder="Enter your business name"
              className={errors.businessName ? 'border-red-500' : ''}
            />
            {errors.businessName && (
              <p className="text-sm text-red-600">{errors.businessName.message}</p>
            )}
          </div>

          {/* Mandatory Address Selection */}
          <div className="space-y-2">
            <label htmlFor="address" className="text-sm font-medium">
              Business Address *
            </label>
            <MandatoryAddressSelect
              {...getFormProps()}
              placeholder="Start typing your address (3+ characters)..."
              className={errors.address || addressError ? 'border-red-500' : ''}
            />
            {errors.address && (
              <p className="text-sm text-red-600">{errors.address.message}</p>
            )}
            
            {/* Address validation status */}
            {selectedPlace && (
              <div className="text-xs text-gray-600 bg-green-50 p-2 rounded border">
                <div className="font-medium text-green-700">Address Validated ✓</div>
                <div>Place ID: {selectedPlace.place_id}</div>
                <div>Coordinates: {selectedPlace.latitude.toFixed(6)}, {selectedPlace.longitude.toFixed(6)}</div>
              </div>
            )}
          </div>

          {/* Coordinate Display (Read-Only) */}
          {selectedPlace && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">
                  Latitude
                </label>
                <Input
                  value={selectedPlace.latitude.toFixed(6)}
                  readOnly
                  className="bg-gray-50 cursor-not-allowed"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">
                  Longitude
                </label>
                <Input
                  value={selectedPlace.longitude.toFixed(6)}
                  readOnly
                  className="bg-gray-50 cursor-not-allowed"
                />
              </div>
            </div>
          )}

          {/* Phone Number */}
          <div className="space-y-2">
            <label htmlFor="phone" className="text-sm font-medium">
              Phone Number
            </label>
            <Input
              id="phone"
              {...register('phone')}
              placeholder="(555) 123-4567"
              type="tel"
            />
            {errors.phone && (
              <p className="text-sm text-red-600">{errors.phone.message}</p>
            )}
          </div>

          {/* Website */}
          <div className="space-y-2">
            <label htmlFor="website" className="text-sm font-medium">
              Website
            </label>
            <Input
              id="website"
              {...register('website')}
              placeholder="https://example.com"
              type="url"
            />
            {errors.website && (
              <p className="text-sm text-red-600">{errors.website.message}</p>
            )}
          </div>

          {/* Form Validation Summary */}
          {!canSubmit && (
            <div className="bg-amber-50 border border-amber-200 rounded p-3">
              <p className="text-sm text-amber-700 font-medium">Form Requirements:</p>
              <ul className="text-xs text-amber-600 mt-1 space-y-1">
                <li className={errors.businessName ? 'text-red-600' : 'text-green-600'}>
                  {errors.businessName ? '✗' : '✓'} Business name required
                </li>
                <li className={!isAddressValid ? 'text-red-600' : 'text-green-600'}>
                  {!isAddressValid ? '✗' : '✓'} Valid Google Maps address required
                </li>
                <li className={!selectedPlace ? 'text-red-600' : 'text-green-600'}>
                  {!selectedPlace ? '✗' : '✓'} Address must be selected from suggestions
                </li>
              </ul>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex items-center justify-end space-x-4">
            <Button
              type="submit"
              disabled={!canSubmit}
              className="min-w-[120px]"
            >
              {isSubmitting ? 'Saving...' : 'Save Address'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

// Export form data type for external use
export type { AddressFormData }