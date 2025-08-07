import type { UseFormReturn } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CategoryIcon } from '@/lib/category-icons';
import type { BusinessFormData } from './types';

interface BasicInfoStepProps {
  form: UseFormReturn<BusinessFormData>;
}

const categories = [
  'Food & Beverage',
  'Retail',
  'Health & Wellness', 
  'Entertainment & Recreation',
  'Personal Services'
] as const;

export function BasicInfoStep({ form }: BasicInfoStepProps) {
  const { register, formState: { errors }, setValue, watch } = form;
  const watchedData = watch();

  return (
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
                  onClick={() => setValue('category', category)}
                  className={`
                    flex items-center p-3 rounded-lg border-2 transition-all
                    ${isSelected 
                      ? 'border-primary bg-primary/5' 
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <CategoryIcon category={category} size={20} className="mr-3" />
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
  );
}