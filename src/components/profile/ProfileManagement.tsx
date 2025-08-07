/**
 * Profile Management Component
 * Allows users to edit their profile and manage subscriptions
 * ALL address inputs use Google Maps Places API for validation
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  User, Mail, MapPin, Crown, Calendar, CreditCard, 
  Save, Edit, Loader2, AlertCircle, CheckCircle, Star
} from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

// Google Maps Places Autocomplete Component
interface GoogleMapsAddressInputProps {
  value: string;
  onChange: (address: string, placeData?: google.maps.places.PlaceResult) => void;
  placeholder?: string;
  disabled?: boolean;
}

const GoogleMapsAddressInput: React.FC<GoogleMapsAddressInputProps> = ({
  value,
  onChange,
  placeholder = "Start typing your address...",
  disabled = false
}) => {
  const [inputRef, setInputRef] = useState<HTMLInputElement | null>(null);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!inputRef || !window.google || disabled) return;

    const autocompleteService = new window.google.maps.places.Autocomplete(inputRef, {
      types: ['address'],
      componentRestrictions: { country: 'US' },
      fields: ['formatted_address', 'geometry.location', 'address_components']
    });

    autocompleteService.addListener('place_changed', () => {
      const place = autocompleteService.getPlace();
      if (place.formatted_address) {
        onChange(place.formatted_address, place);
      }
    });

    setAutocomplete(autocompleteService);
    setIsLoaded(true);

    return () => {
      if (autocompleteService) {
        window.google.maps.event.clearInstanceListeners(autocompleteService);
      }
    };
  }, [inputRef, onChange, disabled]);

  return (
    <div className="relative">
      <Input
        ref={setInputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="pr-10"
      />
      {!isLoaded && !disabled && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
        </div>
      )}
      <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
    </div>
  );
};

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  formatted_address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  latitude: number | null;
  longitude: number | null;
  subscription_status: string | null;
  subscription_period_end: string | null;
  created_at: string;
}

export default function ProfileManagement() {
  const { user } = useAuth();
  const { subscriptionStatus, refreshStatus } = useSubscriptionStatus();
  const { toast } = useToast();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    formatted_address: '',
    city: '',
    state: '',
    zip_code: '',
    latitude: null as number | null,
    longitude: null as number | null
  });

  // Load user profile
  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.uid)
        .single();

      if (error) throw error;

      setProfile(data);
      setFormData({
        full_name: data.full_name || '',
        email: data.email || '',
        formatted_address: data.formatted_address || '',
        city: data.city || '',
        state: data.state || '',
        zip_code: data.zip_code || '',
        latitude: data.latitude,
        longitude: data.longitude
      });
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: "Error Loading Profile",
        description: "Could not load your profile information. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddressChange = (address: string, placeData?: google.maps.places.PlaceResult) => {
    setFormData(prev => ({ ...prev, formatted_address: address }));

    if (placeData?.formatted_address && placeData.geometry?.location) {
      // Extract city, state, zip from address components
      const components = placeData.address_components || [];
      const city = components.find(c => c.types.includes('locality'))?.long_name || '';
      const state = components.find(c => c.types.includes('administrative_area_level_1'))?.short_name || '';
      const zip = components.find(c => c.types.includes('postal_code'))?.long_name || '';

      setFormData(prev => ({
        ...prev,
        formatted_address: placeData.formatted_address!,
        city,
        state,
        zip_code: zip,
        latitude: placeData.geometry!.location!.lat(),
        longitude: placeData.geometry!.location!.lng()
      }));
    }
  };

  const handleSaveProfile = async () => {
    if (!user || !profile) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: formData.full_name || null,
          formatted_address: formData.formatted_address || null,
          city: formData.city || null,
          state: formData.state || null,
          zip_code: formData.zip_code || null,
          latitude: formData.latitude,
          longitude: formData.longitude,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.uid);

      if (error) throw error;

      await loadProfile(); // Reload fresh data
      setIsEditing(false);

      toast({
        title: "Profile Updated",
        description: "Your profile information has been successfully updated.",
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error Saving Profile",
        description: "Could not update your profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSubscribe = () => {
    window.location.href = '/upgrade';
  };

  const handleManageSubscription = () => {
    window.location.href = '/account/billing';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading profile...</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <AlertCircle className="w-8 h-8 text-red-500 mr-2" />
        <span>Could not load profile information.</span>
      </div>
    );
  }

  const subscriptionEndDate = profile.subscription_period_end 
    ? new Date(profile.subscription_period_end) 
    : null;

  const isActiveSubscriber = subscriptionStatus.isActive;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile Information Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <User className="w-5 h-5" />
            Profile Information
          </CardTitle>
          <Button
            variant={isEditing ? "outline" : "default"}
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            disabled={isSaving}
          >
            <Edit className="w-4 h-4 mr-2" />
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
              disabled={!isEditing}
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              value={formData.email}
              disabled={true} // Email cannot be edited
              className="bg-gray-50"
            />
            <p className="text-xs text-gray-500 mt-1">
              Email cannot be changed. Contact support if needed.
            </p>
          </div>

          <div>
            <Label htmlFor="address">Address</Label>
            <GoogleMapsAddressInput
              value={formData.formatted_address}
              onChange={handleAddressChange}
              placeholder="Start typing your address..."
              disabled={!isEditing}
            />
            <p className="text-xs text-gray-500 mt-1">
              Address must be selected from Google Maps suggestions for accurate location services.
            </p>
          </div>

          {isEditing && (
            <div className="flex gap-2 pt-4">
              <Button onClick={handleSaveProfile} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Changes
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subscription Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Subscription Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                {isActiveSubscriber ? (
                  <div className="flex items-center gap-2">
                    <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                      <Crown className="w-3 h-3 mr-1" />
                      Premium Active
                    </Badge>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Free Account</Badge>
                    <AlertCircle className="w-5 h-5 text-gray-400" />
                  </div>
                )}
              </div>
            </div>

            {isActiveSubscriber && subscriptionEndDate && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-green-900">Next Billing Date</span>
                </div>
                <p className="text-green-700">
                  Your subscription renews on {subscriptionEndDate.toLocaleDateString()}
                </p>
              </div>
            )}

            {!isActiveSubscriber && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-blue-900">Upgrade to Premium</span>
                </div>
                <p className="text-blue-700 mb-3">
                  Save money while supporting local businesses and non profits in your area
                </p>
                <div className="text-2xl font-bold text-blue-900 mb-3">
                  $4.99<span className="text-sm font-normal text-blue-600">/month</span>
                </div>
                <ul className="text-sm text-blue-700 space-y-1 mb-4">
                  <li>• Unlimited coupon access</li>
                  <li>• Advanced search & filtering</li>
                  <li>• Location-based recommendations</li>
                  <li>• Business discovery tools</li>
                </ul>
                <Button onClick={handleSubscribe} className="w-full">
                  <Crown className="w-4 h-4 mr-2" />
                  Subscribe Now - $4.99/month
                </Button>
              </div>
            )}

            {isActiveSubscriber && (
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleManageSubscription}>
                  Manage Subscription
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Account Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Account Created:</span>
              <span>{new Date(profile.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">User ID:</span>
              <span className="font-mono text-xs">{profile.id}</span>
            </div>
            <Separator />
            <div className="text-xs text-gray-500 space-y-1">
              <p>• Your data is encrypted and secured</p>
              <p>• Location data is only used for coupon discovery</p>
              <p>• You can delete your account anytime</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}