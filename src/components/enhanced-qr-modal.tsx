/**
 * Enhanced QR Code Modal
 * Integrates the complete redemption flow with validation, confirmation, and success animation
 */

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import QRCode from 'react-qr-code';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Clock, CheckCircle, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDisplayCode } from '@/lib/qr-utils';

import { useRedemptionFlow } from '@/hooks/use-redemption-flow';
import { RedemptionConfirmationDialog } from '@/components/redemption-confirmation-dialog';
import { SuccessAnimation } from '@/components/success-animation';

import type { Coupon } from '@/types';
import type { RedemptionErrorType } from '@/types/redemption';
import { ERROR_MESSAGES } from '@/types/redemption';

interface EnhancedQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  coupon: Coupon;
  userUid: string;
  onRedemptionSuccess?: (data: any) => void;
  onRedemptionError?: (error: string, errorType?: RedemptionErrorType) => void;
}

export function EnhancedQRModal({ 
  isOpen, 
  onClose, 
  coupon, 
  userUid,
  onRedemptionSuccess,
  onRedemptionError
}: EnhancedQRModalProps) {
  const {
    step,
    isLoading,
    showConfirmation,
    error,
    errorType,
    redemption,
    qrContent,
    displayCode,
    confirmationData,
    successAnimation,
    startRedemption,
    confirmRedemption,
    closeConfirmation,
    resetFlow,
    canRedeem,
    isRedemptionExpired
  } = useRedemptionFlow({
    coupon,
    userUid,
    onSuccess: onRedemptionSuccess,
    onError: onRedemptionError
  });

  // Start redemption process when modal opens
  useEffect(() => {
    if (isOpen && step === 'initial') {
      startRedemption();
    } else if (!isOpen) {
      resetFlow();
    }
  }, [isOpen, step, startRedemption, resetFlow]);

  // Auto-close modal when QR expires or on error
  useEffect(() => {
    if (isRedemptionExpired && step === 'success') {
      setTimeout(onClose, 1000);
    }
  }, [isRedemptionExpired, step, onClose]);

  // Render error state
  const renderError = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center space-y-4"
    >
      <div className="flex justify-center">
        <div className="bg-red-100 rounded-full p-3">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
      </div>
      
      <div>
        <h3 className="font-semibold text-gray-900 mb-2">
          {errorType === 'ALREADY_REDEEMED' ? 'Already Redeemed' :
           errorType === 'DAILY_LIMIT_REACHED' ? 'Daily Limit Reached' :
           errorType === 'MONTHLY_LIMIT_REACHED' ? 'Monthly Limit Reached' :
           errorType === 'COUPON_EXPIRED' ? 'Coupon Expired' :
           errorType === 'COUPON_INACTIVE' ? 'Coupon Inactive' :
           errorType === 'USER_NOT_SUBSCRIBED' ? 'Subscription Required' :
           'Redemption Failed'}
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          {error || 'An error occurred during redemption'}
        </p>
      </div>
      
      <div className="space-y-2">
        <Button 
          onClick={startRedemption}
          disabled={isLoading}
          variant="outline"
          className="w-full"
        >
          Try Again
        </Button>
        <Button 
          onClick={onClose}
          variant="default"
          className="w-full"
        >
          Close
        </Button>
      </div>
    </motion.div>
  );

  // Render validation/loading state
  const renderLoading = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-center space-y-4 py-8"
    >
      <div className="flex justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
        />
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 mb-2">
          {step === 'validating' ? 'Validating Coupon...' :
           step === 'generating' ? 'Generating QR Code...' :
           'Processing...'}
        </h3>
        <p className="text-sm text-gray-600">
          {step === 'validating' ? 'Checking usage limits and eligibility' :
           step === 'generating' ? 'Creating your unique redemption code' :
           'Please wait...'}
        </p>
      </div>
    </motion.div>
  );

  // Render QR code display
  const renderQRCode = () => {
    if (!qrContent || !displayCode) return null;

    return (
      <motion.div 
        className="flex flex-col items-center justify-center space-y-6"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {/* QR Code */}
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
            }}
            transition={{ 
              duration: 0.4,
              type: "spring",
              stiffness: 300,
              damping: 20
            }}
            className="relative p-6 bg-white rounded-xl shadow-lg border-2 border-blue-100"
            style={{
              boxShadow: "0 8px 32px rgba(59, 130, 246, 0.15), 0 0 0 1px rgba(59, 130, 246, 0.1)",
            }}
          >
            <motion.div
              animate={{ 
                scale: [1, 1.02, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <QRCode 
                value={qrContent} 
                size={220} 
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                level="M"
              />
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Display Code */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="text-center bg-gray-50 rounded-lg p-4 border w-full"
        >
          <p className="text-sm font-medium text-gray-600 mb-1">
            Manual Entry Code:
          </p>
          <motion.span 
            className="text-2xl font-bold text-gray-900 tracking-wider"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2, delay: 0.3 }}
          >
            {formatDisplayCode(displayCode)}
          </motion.span>
        </motion.div>

        {/* Timer and Progress */}
        {redemption && (
          <QRTimer 
            redemption={redemption}
            onExpired={onClose}
          />
        )}

        {/* Instructions */}
        <motion.div 
          className="text-center space-y-3 w-full"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.6 }}
        >
          <p className="text-sm font-semibold text-gray-700">
            Present this QR code to the business for redemption
          </p>
          <p className="text-xs text-gray-500 border-t pt-2">
            Share the manual entry code if the business cannot scan the QR code
          </p>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <>
      {/* Main QR Modal */}
      <Dialog open={isOpen && !showConfirmation} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {step === 'success' ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  QR Code Ready
                </>
              ) : step === 'error' ? (
                <>
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  Redemption Error
                </>
              ) : (
                <>
                  <Clock className="w-5 h-5 text-blue-500" />
                  Preparing Coupon
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            {step === 'error' && renderError()}
            {(step === 'validating' || step === 'generating' || isLoading) && renderLoading()}
            {step === 'success' && renderQRCode()}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <RedemptionConfirmationDialog
        isOpen={showConfirmation}
        onClose={closeConfirmation}
        onConfirm={confirmRedemption}
        confirmationData={confirmationData}
        isLoading={isLoading}
      />

      {/* Success Animation */}
      <SuccessAnimation
        isVisible={successAnimation.isVisible}
        onComplete={successAnimation.hideSuccess}
        successData={successAnimation.successData}
      />
    </>
  );
}

/**
 * QR Timer Component
 * Shows countdown timer for QR code expiration
 */
interface QRTimerProps {
  redemption: any;
  onExpired: () => void;
}

function QRTimer({ redemption, onExpired }: QRTimerProps) {
  const [timeLeft, setTimeLeft] = useState(60);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!redemption || isExpired) return;

    const expiresAt = new Date(redemption.expires_at);
    const updateTimer = () => {
      const now = new Date();
      const remaining = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
      
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        setIsExpired(true);
        onExpired();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [redemption, isExpired, onExpired]);

  const progress = (timeLeft / 60) * 100;
  const isLowTime = timeLeft <= 15;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="w-full space-y-3">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      >
        <Progress 
          value={progress} 
          className={cn(
            "h-3 rounded-full transition-all duration-500",
            isLowTime ? "bg-red-100" : "bg-blue-100"
          )}
          indicatorClassName={cn(
            "transition-all duration-500",
            isLowTime ? "bg-red-500" : "bg-blue-500"
          )}
        />
      </motion.div>
      
      <motion.div 
        className="flex justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.5 }}
      >
        <motion.span 
          className={cn(
            "text-lg font-bold px-3 py-1 rounded-full",
            isLowTime 
              ? "text-red-600 bg-red-50" 
              : "text-blue-600 bg-blue-50"
          )}
          animate={isLowTime ? { scale: [1, 1.05, 1] } : {}}
          transition={isLowTime ? { 
            duration: 1, 
            repeat: Infinity, 
            ease: "easeInOut" 
          } : {}}
        >
          {formatTime(timeLeft)}
        </motion.span>
      </motion.div>
    </div>
  );
}