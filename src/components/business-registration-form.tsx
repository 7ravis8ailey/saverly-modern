import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, MapPin, Phone, Mail, Globe, Clock, Upload, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import GooglePlacesAutocomplete from '@/components/maps/google-places-autocomplete';
import { CategoryIcon } from '@/lib/category-icons';
import { motion, AnimatePresence } from 'framer-motion';

// Business registration schema
const businessSchema = z.object({
  name: z.string().min(2, 'Business name must be at least 2 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.enum([
    'Food & Beverage',
    'Retail', 
    'Health & Wellness',
    'Entertainment & Recreation',
    'Personal Services'
  ]),
  address: z.string().min(5, 'Please select a valid address'),
  phone: z.string().regex(/^\(\d{3}\) \d{3}-\d{4}$/, 'Phone must be in format (555) 123-4567'),
  email: z.string().email('Please enter a valid email'),
  website: z.string().url().optional().or(z.literal('')),
  businessHours: z.object({
    monday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
    tuesday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
    wednesday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
    thursday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
    friday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
    saturday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
    sunday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() })
  }).optional()
});

type BusinessFormData = z.infer<typeof businessSchema>;

interface BusinessRegistrationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (business: any) => void;
}

export function BusinessRegistrationForm({ isOpen, onClose, onSuccess }: BusinessRegistrationFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<BusinessFormData>({
    resolver: zodResolver(businessSchema),
    defaultValues: {
      businessHours: {
        monday: { open: '09:00', close: '17:00', closed: false },
        tuesday: { open: '09:00', close: '17:00', closed: false },
        wednesday: { open: '09:00', close: '17:00', closed: false },
        thursday: { open: '09:00', close: '17:00', closed: false },
        friday: { open: '09:00', close: '17:00', closed: false },
        saturday: { open: '10:00', close: '16:00', closed: false },
        sunday: { open: '10:00', close: '16:00', closed: true }
      }
    }
  });

  const watchedData = watch();

  const steps = [
    { title: 'Basic Info', description: 'Business name and category' },
    { title: 'Location', description: 'Address and contact details' },
    { title: 'Hours', description: 'Business hours and availability' },
    { title: 'Review', description: 'Confirm your information' }
  ];

  const categories = [
    'Food & Beverage',
    'Retail',
    'Health & Wellness', 
    'Entertainment & Recreation',
    'Personal Services'
  ];

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

  const handleLocationSelect = (place: any) => {
    setSelectedLocation(place);
    setValue('address', place.formatted_address);
  };

  const onSubmit = async (data: BusinessFormData) => {
    try {
      setIsSubmitting(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const businessData = {
        ...data,
        latitude: selectedLocation?.geometry?.location?.lat(),
        longitude: selectedLocation?.geometry?.location?.lng(),
        status: 'pending_verification',
        created_at: new Date().toISOString()
      };

      onSuccess?.(businessData);
      reset();
      setCurrentStep(1);
      onClose();
      
    } catch (error) {
      console.error('Error submitting business registration:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return watchedData.name && watchedData.category && watchedData.description;
      case 2:
        return watchedData.address && watchedData.phone && watchedData.email;
      case 3:
        return true; // Business hours are optional but have defaults
      default:
        return true;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold saverly-gradient-text">
            Register Your Business
          </DialogTitle>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center">
              <div className={`
                flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                ${index + 1 <= currentStep 
                  ? 'bg-primary text-white' 
                  : 'bg-gray-200 text-gray-500'
                }
              `}>
                {index + 1}
              </div>
              <div className="ml-2 hidden sm:block">
                <div className="text-sm font-medium">{step.title}</div>
                <div className="text-xs text-gray-500">{step.description}</div>
              </div>
              {index < steps.length - 1 && (
                <ChevronRight className="w-4 h-4 text-gray-400 mx-4" />
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <AnimatePresence mode="wait">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="space-y-6"
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Business Name *
                      </label>
                      <Input
                        {...register('name')}
                        placeholder="Enter your business name"
                      />
                      {errors.name && (
                        <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Category *
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {categories.map((category) => {
                          const isSelected = watchedData.category === category;
                          
                          return (
                            <button
                              key={category}
                              type="button"
                              onClick={() => setValue('category', category as any)}
                              className={`
                                flex items-center p-3 rounded-lg border-2 transition-all
                                ${isSelected 
                                  ? 'border-primary bg-primary/5' 
                                  : 'border-gray-200 hover:border-gray-300'
                                }
                              `}
                            >
                              <CategoryIcon category={category as any} size={20} className="mr-3" />
                              <span className="text-sm font-medium">{category}</span>
                            </button>
                          );
                        })}
                      </div>
                      {errors.category && (
                        <p className="text-sm text-red-600 mt-1">{errors.category.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Description *
                      </label>
                      <textarea
                        {...register('description')}
                        placeholder="Describe your business and what makes it special..."
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                      {errors.description && (
                        <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 2: Location & Contact */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="space-y-6"
              >
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
                        onPlaceSelected={handleLocationSelect}
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
              </motion.div>
            )}

            {/* Step 3: Business Hours */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="space-y-6"
              >
                <Card>
                  <CardHeader>
                    <CardTitle>
                      <Clock className="w-5 h-5 inline mr-2" />
                      Business Hours
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(watchedData.businessHours || {}).map(([day, hours]) => (
                        <div key={day} className="flex items-center space-x-4">
                          <div className="w-20 text-sm font-medium capitalize">
                            {day}
                          </div>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={!hours.closed}
                              onChange={(e) => 
                                setValue(`businessHours.${day}.closed` as any, !e.target.checked)
                              }
                              className="mr-2"
                            />
                            Open
                          </label>
                          {!hours.closed && (
                            <>
                              <Input
                                type="time"
                                value={hours.open}
                                onChange={(e) => 
                                  setValue(`businessHours.${day}.open` as any, e.target.value)
                                }
                                className="w-32"
                              />
                              <span>to</span>
                              <Input
                                type="time"
                                value={hours.close}
                                onChange={(e) => 
                                  setValue(`businessHours.${day}.close` as any, e.target.value)
                                }
                                className="w-32"
                              />
                            </>
                          )}
                          {hours.closed && (
                            <Badge variant="outline" className="ml-4">Closed</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 4: Review */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="space-y-6"
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Review Your Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Basic Information</h4>
                        <div className="space-y-1 text-sm">
                          <p><strong>Name:</strong> {watchedData.name}</p>
                          <p><strong>Category:</strong> {watchedData.category}</p>
                          <p><strong>Description:</strong> {watchedData.description}</p>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Contact Information</h4>
                        <div className="space-y-1 text-sm">
                          <p><strong>Address:</strong> {watchedData.address}</p>
                          <p><strong>Phone:</strong> {watchedData.phone}</p>
                          <p><strong>Email:</strong> {watchedData.email}</p>
                          {watchedData.website && (
                            <p><strong>Website:</strong> {watchedData.website}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
                      <div className="text-sm text-blue-700 space-y-1">
                        <p>• Your business registration will be reviewed by our team</p>
                        <p>• We'll verify your business information and location</p>
                        <p>• You'll receive an email within 2-3 business days with approval status</p>
                        <p>• Once approved, you can start creating coupons and offers</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              Previous
            </Button>

            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              
              {currentStep < steps.length ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  disabled={!isStepValid(currentStep)}
                  variant="saverly"
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isSubmitting || !isStepValid(currentStep)}
                  variant="saverly"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Registration'
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}