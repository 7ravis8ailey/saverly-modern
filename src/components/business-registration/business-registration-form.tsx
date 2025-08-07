import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ProgressIndicator } from './progress-indicator';
import { BasicInfoStep } from './basic-info-step';
import { LocationStep } from './location-step';
import { BusinessHoursStep } from './business-hours-step';
import { ReviewStep } from './review-step';

import { businessSchema, type BusinessFormData, type BusinessRegistrationFormProps } from './types';
import { useStepValidation } from './use-step-validation';

const steps = [
  { 
    title: 'Basic Info', 
    description: 'Business name and category',
    component: BasicInfoStep 
  },
  { 
    title: 'Location', 
    description: 'Address and contact details',
    component: LocationStep 
  },
  { 
    title: 'Hours', 
    description: 'Business hours and availability',
    component: BusinessHoursStep 
  },
  { 
    title: 'Review', 
    description: 'Confirm your information',
    component: ReviewStep 
  }
];

export function BusinessRegistrationForm({ isOpen, onClose, onSuccess }: BusinessRegistrationFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);

  const form = useForm<BusinessFormData>({
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

  const { isStepValid } = useStepValidation(form);

  const handleLocationSelect = (place: any) => {
    setSelectedLocation(place);
    form.setValue('address', place.formatted_address);
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
      form.reset();
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

  const handleClose = () => {
    form.reset();
    setCurrentStep(1);
    setSelectedLocation(null);
    onClose();
  };

  const CurrentStepComponent = steps[currentStep - 1]?.component;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold saverly-gradient-text">
            Register Your Business
          </DialogTitle>
        </DialogHeader>

        <ProgressIndicator 
          steps={steps} 
          currentStep={currentStep} 
        />

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <AnimatePresence mode="wait">
            {CurrentStepComponent && (
              <motion.div
                key={`step${currentStep}`}
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="space-y-6"
              >
                <CurrentStepComponent
                  form={form}
                  onLocationSelect={handleLocationSelect}
                />
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
                onClick={handleClose}
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