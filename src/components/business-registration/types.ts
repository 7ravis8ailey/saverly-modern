import { z } from 'zod';

// Business registration schema
export const businessSchema = z.object({
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

export type BusinessFormData = z.infer<typeof businessSchema>;

export interface BusinessHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

export interface DayHours {
  open: string;
  close: string;
  closed: boolean;
}

export interface BusinessRegistrationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (business: any) => void;
}

export interface StepConfig {
  title: string;
  description: string;
  component: React.ComponentType<any>;
}

export interface StepValidation {
  [stepNumber: number]: (data: BusinessFormData) => boolean;
}