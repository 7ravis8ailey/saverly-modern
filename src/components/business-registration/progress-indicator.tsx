import { ChevronRight } from 'lucide-react';

interface Step {
  title: string;
  description: string;
  component: React.ComponentType<any>;
}

interface ProgressIndicatorProps {
  steps: Step[];
  currentStep: number;
}

export function ProgressIndicator({ steps, currentStep }: ProgressIndicatorProps) {
  return (
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
  );
}