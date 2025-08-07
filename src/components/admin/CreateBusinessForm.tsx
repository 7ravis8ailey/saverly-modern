/**
 * Create Business Form for Admin Panel
 * Complete business creation with Google Maps integration
 */

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { 
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '../ui/dialog';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { AlertCircle, Building2, MapPin, User, Mail, Phone, Check, X } from 'lucide-react';
import { api } from '../../lib/supabase-api';
import { useMandatoryAddress } from '../../hooks/use-mandatory-address';

interface BusinessFormData {
  name: string;
  description: string;
  category: string;
  email: string;
  phone: string;
  contact_name: string;
  formatted_address: string;
  city: string;
  state: string;
  zip_code: string;
  latitude: number;
  longitude: number;
  place_id: string;
  active: boolean;
  owner_id?: string;
}

interface CreateBusinessFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const BUSINESS_CATEGORIES = [
  'Food & Beverage',
  'Retail',
  'Health & Wellness',
  'Entertainment & Recreation',
  'Personal Services',
  'Professional Services',
  'Automotive',
  'Home & Garden',
  'Beauty & Spa',
  'Fitness & Sports',
  'Education',
  'Technology',
  'Other'
];

export function CreateBusinessForm({ onSuccess, onCancel }: CreateBusinessFormProps) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [availableUsers, setAvailableUsers] = useState<Array<{id: string, email: string, full_name?: string}>>([]);
  const [formData, setFormData] = useState<BusinessFormData>({
    name: '',
    description: '',
    category: '',
    email: '',
    phone: '',
    contact_name: '',
    formatted_address: '',
    city: '',
    state: '',
    zip_code: '',
    latitude: 0,
    longitude: 0,
    place_id: '',
    active: true,
    owner_id: ''
  });

  const {
    addressInput,
    setAddressInput,
    selectedPlace,
    suggestions,
    loading: addressLoading,
    error: addressError,
    selectPlace,
    clearSelection
  } = useMandatoryAddress();

  // Load available users who can own businesses
  useEffect(() => {
    loadAvailableUsers();
  }, []);

  // Update form data when address is selected
  useEffect(() => {
    if (selectedPlace) {
      setFormData(prev => ({
        ...prev,
        formatted_address: selectedPlace.formatted_address,
        city: selectedPlace.city,
        state: selectedPlace.state,
        zip_code: selectedPlace.zipCode,
        latitude: selectedPlace.latitude,
        longitude: selectedPlace.longitude,
        place_id: selectedPlace.place_id
      }));
    }
  }, [selectedPlace]);

  const loadAvailableUsers = async () => {
    try {
      const { data: users, error } = await api.supabase
        .from('users')
        .select('id, email, full_name, user_role')
        .in('user_role', ['consumer', 'business'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAvailableUsers(users || []);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const validateStep1 = (): boolean => {
    return !!(
      formData.name.trim() &&
      formData.email.trim() &&
      formData.contact_name.trim() &&
      formData.category
    );
  };

  const validateStep2 = (): boolean => {
    return !!(selectedPlace && formData.formatted_address);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep1() || !validateStep2()) return;

    setLoading(true);

    try {
      // Create the business
      const businessData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        category: formData.category,
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
        contact_name: formData.contact_name.trim(),
        formatted_address: formData.formatted_address,
        city: formData.city,
        state: formData.state,
        zip_code: formData.zip_code,
        latitude: formData.latitude,
        longitude: formData.longitude,
        place_id: formData.place_id,
        owner_id: formData.owner_id || null,
        active: formData.active,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: business, error: businessError } = await api.supabase
        .from('businesses')
        .insert([businessData])
        .select()
        .single();

      if (businessError) throw businessError;

      // Update user role to business if owner is assigned
      if (formData.owner_id) {
        const { error: userError } = await api.supabase
          .from('users')
          .update({ 
            user_role: 'business',
            updated_at: new Date().toISOString()
          })
          .eq('id', formData.owner_id);

        if (userError) {
          console.warn('Failed to update user role:', userError);
          // Don't fail the whole operation for this
        }
      }

      onSuccess();
    } catch (error: any) {
      console.error('Failed to create business:', error);
      
      let errorMessage = 'Failed to create business. Please try again.';
      
      if (error.message?.includes('duplicate key')) {
        if (error.message.includes('email')) {
          errorMessage = 'A business with this email already exists.';
        } else if (error.message.includes('name')) {
          errorMessage = 'A business with this name already exists.';
        }
      } else if (error.message?.includes('invalid email')) {
        errorMessage = 'Please provide a valid email address.';
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Business Information
        </DialogTitle>
        <DialogDescription>
          Enter the basic information for the new business.
        </DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Business Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Joe's Pizza Palace"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {BUSINESS_CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Business Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Brief description of the business..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contact_name">Contact Name *</Label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="contact_name"
              value={formData.contact_name}
              onChange={(e) => setFormData(prev => ({ ...prev, contact_name: e.target.value }))}
              placeholder="Contact person name"
              className="pl-10"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Business Email *</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="business@example.com"
              className="pl-10"
              required
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="(555) 123-4567"
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="owner">Business Owner (Optional)</Label>
          <Select
            value={formData.owner_id || ''}
            onValueChange={(value) => setFormData(prev => ({ ...prev, owner_id: value || undefined }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select owner" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No owner assigned</SelectItem>
              {availableUsers.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.full_name || user.email} ({user.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="active"
          checked={formData.active}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
        />
        <Label htmlFor="active">Active (business will be visible to users)</Label>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Business Location
        </DialogTitle>
        <DialogDescription>
          Select the exact business location using Google Maps.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="address">Business Address *</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="address"
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              placeholder="Start typing the business address..."
              className="pl-10"
              required
            />
            {addressLoading && (
              <div className="absolute right-3 top-3">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>
          
          {addressError && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="h-4 w-4" />
              {addressError}
            </div>
          )}

          {/* Address Suggestions */}
          {suggestions.length > 0 && (
            <Card className="absolute z-50 w-full mt-1 border shadow-lg">
              <CardContent className="p-2">
                <div className="space-y-1">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={suggestion.place_id}
                      type="button"
                      onClick={() => selectPlace(suggestion)}
                      className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                    >
                      <div className="font-medium">{suggestion.structured_formatting.main_text}</div>
                      <div className="text-muted-foreground text-xs">
                        {suggestion.structured_formatting.secondary_text}
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Selected Address Display */}
        {selectedPlace && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-800">Address Verified</span>
                  </div>
                  
                  <div className="text-sm text-green-700">
                    <div className="font-medium">{selectedPlace.formatted_address}</div>
                    <div className="text-xs mt-1">
                      {selectedPlace.city}, {selectedPlace.state} {selectedPlace.zipCode}
                    </div>
                    <div className="text-xs mt-1">
                      Coordinates: {selectedPlace.latitude.toFixed(6)}, {selectedPlace.longitude.toFixed(6)}
                    </div>
                  </div>
                </div>
                
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    clearSelection();
                    setFormData(prev => ({
                      ...prev,
                      formatted_address: '',
                      city: '',
                      state: '',
                      zip_code: '',
                      latitude: 0,
                      longitude: 0,
                      place_id: ''
                    }));
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Manual Address Override (for debugging/admin use) */}
        {selectedPlace && (
          <details className="text-sm">
            <summary className="cursor-pointer text-muted-foreground">
              Advanced: Manual Address Override
            </summary>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">City</Label>
                <Input
                  size="sm"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                />
              </div>
              <div>
                <Label className="text-xs">State</Label>
                <Input
                  size="sm"
                  value={formData.state}
                  onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                />
              </div>
              <div>
                <Label className="text-xs">ZIP Code</Label>
                <Input
                  size="sm"
                  value={formData.zip_code}
                  onChange={(e) => setFormData(prev => ({ ...prev, zip_code: e.target.value }))}
                />
              </div>
              <div>
                <Label className="text-xs">Place ID</Label>
                <Input
                  size="sm"
                  value={formData.place_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, place_id: e.target.value }))}
                />
              </div>
            </div>
          </details>
        )}
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            1
          </div>
          <div className="ml-2 text-sm">Business Info</div>
        </div>
        <div className={`flex-1 h-0.5 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
        <div className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            2
          </div>
          <div className="ml-2 text-sm">Location</div>
        </div>
      </div>

      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}

      <DialogFooter>
        <div className="flex items-center justify-between w-full">
          <div>
            {step === 2 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
              >
                Back
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              Cancel
            </Button>

            {step === 1 ? (
              <Button
                type="button"
                onClick={() => setStep(2)}
                disabled={!validateStep1()}
              >
                Next: Location
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={loading || !validateStep2()}
              >
                {loading ? 'Creating Business...' : 'Create Business'}
              </Button>
            )}
          </div>
        </div>
      </DialogFooter>
    </form>
  );
}