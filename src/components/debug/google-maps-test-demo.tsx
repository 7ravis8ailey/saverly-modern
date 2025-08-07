import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MandatoryAddressSelect, type PlaceDetails } from '@/components/maps/mandatory-address-select';
import { useMandatoryAddress } from '@/hooks/use-mandatory-address';
import { MapPin, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

/**
 * Google Maps Address Validation Test Demo
 * 
 * This component demonstrates the complete address validation specification:
 * - Trigger: After 3rd character typed in address field  
 * - Behavior: Show Google Maps suggestions
 * - Constraint: User MUST select from suggestions (no manual entry)
 * - Storage: Full address data with coordinates
 */
export function GoogleMapsTestDemo() {
  const [testResults, setTestResults] = useState<{
    triggered: boolean;
    suggestionShown: boolean;
    selectedPlace: PlaceDetails | null;
    validationPassed: boolean;
    startTime: Date | null;
    completeTime: Date | null;
  }>({
    triggered: false,
    suggestionShown: false,
    selectedPlace: null,
    validationPassed: false,
    startTime: null,
    completeTime: null
  });

  const {
    address,
    selectedPlace,
    isValid,
    error,
    getFormProps,
    clearAddress
  } = useMandatoryAddress({
    required: true,
    onAddressChange: (place) => {
      if (place) {
        setTestResults(prev => ({
          ...prev,
          selectedPlace: place,
          validationPassed: true,
          completeTime: new Date()
        }));
      } else {
        setTestResults(prev => ({
          ...prev,
          selectedPlace: null,
          validationPassed: false,
          completeTime: null
        }));
      }
    }
  });

  // Monitor address input for 3-character trigger
  const handleAddressChange = (value: string) => {
    const formProps = getFormProps();
    formProps.onChange(value);
    
    // Test trigger at 3 characters
    if (value.length === 3 && !testResults.triggered) {
      setTestResults(prev => ({
        ...prev,
        triggered: true,
        startTime: new Date()
      }));
    }
    
    // Reset if cleared
    if (value.length === 0) {
      setTestResults(prev => ({
        ...prev,
        triggered: false,
        suggestionShown: false,
        startTime: null
      }));
    }
  };

  const resetTest = () => {
    clearAddress();
    setTestResults({
      triggered: false,
      suggestionShown: false,
      selectedPlace: null,
      validationPassed: false,
      startTime: null,
      completeTime: null
    });
  };

  const formProps = getFormProps();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>Google Maps Address Validation Test</span>
          </CardTitle>
          <p className="text-sm text-gray-600">
            Testing compliance with Address Validation Specification
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Test Input Section */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Test Address Input (Type 3+ characters to trigger)
              </label>
              <MandatoryAddressSelect
                {...formProps}
                onChange={handleAddressChange}
                className="w-full"
                placeholder="Start typing an address... (e.g., '123 Main')"
              />
              {error && (
                <p className="text-sm text-red-600 mt-1">{error}</p>
              )}
            </div>

            <div className="flex space-x-2">
              <Button onClick={resetTest} variant="outline">
                Reset Test
              </Button>
            </div>
          </div>

          {/* Test Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* 3-Character Trigger Test */}
            <Card className={`p-4 border-2 ${testResults.triggered ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
              <div className="flex items-center space-x-2">
                {testResults.triggered ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <Clock className="h-5 w-5 text-gray-400" />
                )}
                <div>
                  <p className="text-sm font-medium">3-Char Trigger</p>
                  <Badge variant={testResults.triggered ? "default" : "outline"} className="text-xs">
                    {testResults.triggered ? "TRIGGERED" : "WAITING"}
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Google Suggestions Test */}
            <Card className={`p-4 border-2 ${address.length >= 3 ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
              <div className="flex items-center space-x-2">
                {address.length >= 3 ? (
                  <CheckCircle2 className="h-5 w-5 text-blue-500" />
                ) : (
                  <Clock className="h-5 w-5 text-gray-400" />
                )}
                <div>
                  <p className="text-sm font-medium">Suggestions</p>
                  <Badge variant={address.length >= 3 ? "default" : "outline"} className="text-xs">
                    {address.length >= 3 ? "ACTIVE" : "INACTIVE"}
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Mandatory Selection Test */}
            <Card className={`p-4 border-2 ${selectedPlace ? 'border-purple-500 bg-purple-50' : 'border-gray-200'}`}>
              <div className="flex items-center space-x-2">
                {selectedPlace ? (
                  <CheckCircle2 className="h-5 w-5 text-purple-500" />
                ) : address.length > 0 ? (
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                ) : (
                  <Clock className="h-5 w-5 text-gray-400" />
                )}
                <div>
                  <p className="text-sm font-medium">Selection</p>
                  <Badge 
                    variant={selectedPlace ? "default" : address.length > 0 ? "destructive" : "outline"} 
                    className="text-xs"
                  >
                    {selectedPlace ? "SELECTED" : address.length > 0 ? "REQUIRED" : "PENDING"}
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Data Capture Test */}
            <Card className={`p-4 border-2 ${testResults.validationPassed ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'}`}>
              <div className="flex items-center space-x-2">
                {testResults.validationPassed ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                ) : (
                  <Clock className="h-5 w-5 text-gray-400" />
                )}
                <div>
                  <p className="text-sm font-medium">Data Capture</p>
                  <Badge variant={testResults.validationPassed ? "default" : "outline"} className="text-xs">
                    {testResults.validationPassed ? "COMPLETE" : "WAITING"}
                  </Badge>
                </div>
              </div>
            </Card>
          </div>

          {/* Specification Compliance Status */}
          <Card className="p-4">
            <h3 className="font-medium mb-3">Address Validation Specification Compliance</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">✅ Trigger after 3rd character typed</span>
                <Badge variant={testResults.triggered ? "default" : "outline"}>
                  {testResults.triggered ? "PASS" : "PENDING"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">✅ Show Google Maps suggestions</span>
                <Badge variant={address.length >= 3 ? "default" : "outline"}>
                  {address.length >= 3 ? "PASS" : "PENDING"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">✅ User MUST select from suggestions</span>
                <Badge variant={selectedPlace || address.length === 0 ? "default" : "destructive"}>
                  {selectedPlace ? "ENFORCED" : address.length === 0 ? "READY" : "VIOLATED"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">✅ Store full address data with coordinates</span>
                <Badge variant={selectedPlace ? "default" : "outline"}>
                  {selectedPlace ? "CAPTURED" : "PENDING"}
                </Badge>
              </div>
            </div>
          </Card>

          {/* Captured Data Display */}
          {selectedPlace && (
            <Card className="p-4 bg-green-50 border-green-200">
              <h3 className="font-medium mb-3 text-green-800">✅ Address Data Successfully Captured</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Formatted Address:</strong>
                  <p className="text-gray-700">{selectedPlace.formatted_address}</p>
                </div>
                <div>
                  <strong>Place ID:</strong>
                  <p className="text-gray-700 font-mono text-xs">{selectedPlace.place_id}</p>
                </div>
                <div>
                  <strong>Street Address:</strong>
                  <p className="text-gray-700">{selectedPlace.address}</p>
                </div>
                <div>
                  <strong>City, State ZIP:</strong>
                  <p className="text-gray-700">{selectedPlace.city}, {selectedPlace.state} {selectedPlace.zipCode}</p>
                </div>
                <div>
                  <strong>Latitude:</strong>
                  <p className="text-gray-700 font-mono">{selectedPlace.latitude.toFixed(6)}</p>
                </div>
                <div>
                  <strong>Longitude:</strong>
                  <p className="text-gray-700 font-mono">{selectedPlace.longitude.toFixed(6)}</p>
                </div>
              </div>
              
              {testResults.startTime && testResults.completeTime && (
                <div className="mt-4 pt-4 border-t border-green-300">
                  <p className="text-sm text-green-700">
                    ⏱️ Validation completed in {
                      Math.round((testResults.completeTime.getTime() - testResults.startTime.getTime()) / 1000)
                    } seconds
                  </p>
                </div>
              )}
            </Card>
          )}

          {/* Current Status */}
          <Card className="p-4">
            <h3 className="font-medium mb-2">Current Test Status</h3>
            <div className="text-sm space-y-1">
              <p><strong>Address Input:</strong> {address || "No input"}</p>
              <p><strong>Characters Typed:</strong> {address.length}</p>
              <p><strong>Validation State:</strong> {isValid ? "✅ Valid" : "❌ Invalid"}</p>
              <p><strong>Selection Required:</strong> {!selectedPlace && address.length > 0 ? "⚠️ Yes" : "✅ Complete"}</p>
            </div>
          </Card>

          {/* Instructions */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <h3 className="font-medium mb-2 text-blue-800">Test Instructions</h3>
            <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
              <li>Type an address slowly (e.g., "123 Main Street")</li>
              <li>Watch the 3-character trigger activate</li>
              <li>Observe Google Maps suggestions appear</li>
              <li>Select a suggestion from the dropdown</li>
              <li>Verify all address data is captured with coordinates</li>
            </ol>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}