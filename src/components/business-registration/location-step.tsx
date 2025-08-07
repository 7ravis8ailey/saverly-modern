import type { UseFormReturn } from 'react-hook-form';
import { MapPin, Phone, Mail, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import GooglePlacesAutocomplete from '@/components/maps/google-places-autocomplete';
import type { BusinessFormData } from './types';

interface LocationStepProps {
  form: UseFormReturn<BusinessFormData>;
  onLocationSelect: (place: any) => void;
}

export function LocationStep({ form, onLocationSelect }: LocationStepProps) {
  const { register, formState: { errors }, setValue, watch } = form;

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return value;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setValue('phone', formatted);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Location & Contact</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            <MapPin className="w-4 h-4 inline mr-1" />
            Business Address *
          </label>
          <GooglePlacesAutocomplete
            onPlaceSelected={onLocationSelect}
            placeholder="Start typing your business address..."
            className="w-full"
          />
          {errors.address && (
            <p className="text-sm text-red-600 mt-1">{errors.address.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              <Phone className="w-4 h-4 inline mr-1" />
              Phone Number *
            </label>
            <Input
              {...register('phone')}
              placeholder="(555) 123-4567"
              onChange={handlePhoneChange}
              maxLength={14}
            />
            {errors.phone && (
              <p className="text-sm text-red-600 mt-1">{errors.phone.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              <Mail className="w-4 h-4 inline mr-1" />
              Email Address *
            </label>
            <Input
              {...register('email')}
              type="email"
              placeholder="business@example.com"
            />
            {errors.email && (
              <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            <Globe className="w-4 h-4 inline mr-1" />
            Website (Optional)
          </label>
          <Input
            {...register('website')}
            placeholder="https://www.yourbusiness.com"
          />
          {errors.website && (
            <p className="text-sm text-red-600 mt-1">{errors.website.message}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}