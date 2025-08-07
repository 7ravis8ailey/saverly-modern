/**
 * Redemption Confirmation Dialog
 * 60-second countdown dialog that warns users before QR code generation
 */

import { useEffect, useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { 
  RedemptionConfirmationData, 
  UsageLimitValidation 
} from '@/types/redemption';
import { CONFIRMATION_CONFIG } from '@/types/redemption';

interface RedemptionConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  confirmationData: RedemptionConfirmationData | null;
  isLoading?: boolean;
}

export function RedemptionConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  confirmationData,
  isLoading = false
}: RedemptionConfirmationDialogProps) {
  const [timeLeft, setTimeLeft] = useState<number>(CONFIRMATION_CONFIG.countdownDuration);
  const [isExpired, setIsExpired] = useState(false);
  
  // Reset timer when dialog opens
  useEffect(() => {
    if (isOpen) {
      setTimeLeft(CONFIRMATION_CONFIG.countdownDuration);
      setIsExpired(false);
    }
  }, [isOpen]);
  
  // Countdown timer
  useEffect(() => {
    if (!isOpen || isExpired || isLoading) return;
    
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsExpired(true);
          if (CONFIRMATION_CONFIG.autoCloseOnExpire) {
            setTimeout(onClose, 500);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isOpen, isExpired, isLoading, onClose]);
  
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, []);
  
  const progress = (timeLeft / CONFIRMATION_CONFIG.countdownDuration) * 100;
  const isWarning = timeLeft <= CONFIRMATION_CONFIG.warningThreshold;
  
  if (!confirmationData) return null;
  
  const { coupon, business, usageValidation, estimatedSavings } = confirmationData;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className={cn(
              "w-5 h-5",
              isWarning ? "text-red-500" : "text-blue-500"
            )} />
            Confirm Coupon Redemption
          </DialogTitle>
        </DialogHeader>
        
        <motion.div 
          className="space-y-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Coupon Details */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-lg">
                  {coupon.title}
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  {business.name}
                </p>
                <p className="text-sm text-gray-700">
                  {coupon.description}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">
                  {coupon.discount}
                </p>
                <p className="text-xs text-gray-500">
                  Save ~{estimatedSavings}
                </p>
              </div>
            </div>
          </div>
          
          {/* Usage Information */}
          <div className="bg-gray-50 rounded-lg p-4 border">
            <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Usage Limits
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Limit Type:</p>
                <p className="font-medium capitalize">
                  {usageValidation.usageType.replace('_', ' ')}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Remaining Uses:</p>
                <p className="font-medium">
                  {usageValidation.remaining} of {usageValidation.maxAllowed}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-500">
                  {usageValidation.resetInfo}
                </p>
              </div>
            </div>
          </div>
          
          {/* Warning Message */}
          <motion.div 
            className={cn(
              "flex items-start gap-3 p-4 rounded-lg border",
              isWarning 
                ? "bg-red-50 border-red-200 text-red-800" 
                : "bg-yellow-50 border-yellow-200 text-yellow-800"
            )}
            animate={isWarning ? { scale: [1, 1.02, 1] } : {}}
            transition={isWarning ? { 
              duration: 0.8, 
              repeat: Infinity, 
              ease: "easeInOut" 
            } : {}}
          >
            <AlertTriangle className={cn(
              "w-5 h-5 mt-0.5 flex-shrink-0",
              isWarning ? "text-red-500" : "text-yellow-500"
            )} />
            <div className="text-sm">
              <p className="font-medium mb-1">
                {isWarning ? 'Confirmation Expiring Soon!' : 'Important Notice'}
              </p>
              <p>
                {isExpired 
                  ? 'Confirmation has expired. Please try again.'
                  : isWarning
                    ? 'You have less than 10 seconds to confirm this redemption.'
                    : 'Once confirmed, a QR code will be generated that expires in 60 seconds. Make sure you are ready to use it immediately.'
                }
              </p>
            </div>
          </motion.div>
          
          {/* Countdown Progress */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Time to confirm:
              </span>
              <motion.span 
                className={cn(
                  "text-lg font-bold px-3 py-1 rounded-full",
                  isWarning 
                    ? "text-red-600 bg-red-100" 
                    : "text-blue-600 bg-blue-100"
                )}
                animate={isWarning ? { scale: [1, 1.1, 1] } : {}}
                transition={isWarning ? { 
                  duration: 1, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                } : {}}
              >
                {formatTime(timeLeft)}
              </motion.span>
            </div>
            
            <Progress 
              value={progress} 
              className={cn(
                "h-2 transition-all duration-300",
                isWarning ? "bg-red-100" : "bg-blue-100"
              )}
              indicatorClassName={cn(
                "transition-all duration-300",
                isWarning ? "bg-red-500" : "bg-blue-500"
              )}
            />
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            
            <AnimatePresence>
              {!isExpired && (
                <motion.div
                  className="flex-1"
                  initial={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button
                    onClick={onConfirm}
                    disabled={isLoading || isExpired}
                    className={cn(
                      "w-full",
                      isWarning && "animate-pulse"
                    )}
                  >
                    {isLoading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                      />
                    ) : (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    )}
                    {isLoading ? 'Generating QR...' : 'Confirm & Generate QR'}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {isExpired && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-2"
            >
              <p className="text-sm text-red-600 font-medium">
                Confirmation expired. Please close and try again.
              </p>
            </motion.div>
          )}
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}