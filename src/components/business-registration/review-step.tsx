import type { UseFormReturn } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { BusinessFormData } from './types';

interface ReviewStepProps {
  form: UseFormReturn<BusinessFormData>;
}

export function ReviewStep({ form }: ReviewStepProps) {
  const watchedData = form.watch();

  return (
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
  );
}