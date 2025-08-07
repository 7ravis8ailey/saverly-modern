import type { UseFormReturn } from 'react-hook-form';
import { Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { BusinessFormData, BusinessHours } from './types';

interface BusinessHoursStepProps {
  form: UseFormReturn<BusinessFormData>;
}

const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

export function BusinessHoursStep({ form }: BusinessHoursStepProps) {
  const { setValue, watch } = form;
  const watchedData = watch();

  const handleDayToggle = (day: keyof BusinessHours, isOpen: boolean) => {
    setValue(`businessHours.${day}.closed`, !isOpen);
  };

  const handleTimeChange = (day: keyof BusinessHours, timeType: 'open' | 'close', value: string) => {
    setValue(`businessHours.${day}.${timeType}`, value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Clock className="w-5 h-5 inline mr-2" />
          Business Hours
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {days.map((day) => {
            const hours = watchedData.businessHours?.[day];
            if (!hours) return null;

            return (
              <div key={day} className="flex items-center space-x-4">
                <div className="w-20 text-sm font-medium capitalize">
                  {day}
                </div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={!hours.closed}
                    onChange={(e) => handleDayToggle(day, e.target.checked)}
                    className="mr-2"
                  />
                  Open
                </label>
                {!hours.closed && (
                  <>
                    <Input
                      type="time"
                      value={hours.open}
                      onChange={(e) => handleTimeChange(day, 'open', e.target.value)}
                      className="w-32"
                    />
                    <span>to</span>
                    <Input
                      type="time"
                      value={hours.close}
                      onChange={(e) => handleTimeChange(day, 'close', e.target.value)}
                      className="w-32"
                    />
                  </>
                )}
                {hours.closed && (
                  <Badge variant="outline" className="ml-4">Closed</Badge>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}