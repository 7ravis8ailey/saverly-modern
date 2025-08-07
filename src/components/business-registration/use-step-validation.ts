import type { UseFormReturn } from 'react-hook-form';
import type { BusinessFormData } from './types';

export function useStepValidation(form: UseFormReturn<BusinessFormData>) {
  const watchedData = form.watch();

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(watchedData.name && watchedData.category && watchedData.description);
      case 2:
        return !!(watchedData.address && watchedData.phone && watchedData.email);
      case 3:
        return true; // Business hours are optional but have defaults
      case 4:
        return true; // Review step is always valid if we reach it
      default:
        return true;
    }
  };

  const getStepErrors = (step: number): string[] => {
    const errors: string[] = [];
    const { formState } = form;

    switch (step) {
      case 1:
        if (formState.errors.name) errors.push('Business name is required');
        if (formState.errors.category) errors.push('Category is required');
        if (formState.errors.description) errors.push('Description is required');
        break;
      case 2:
        if (formState.errors.address) errors.push('Address is required');
        if (formState.errors.phone) errors.push('Valid phone number is required');
        if (formState.errors.email) errors.push('Valid email is required');
        break;
    }

    return errors;
  };

  return {
    isStepValid,
    getStepErrors
  };
}