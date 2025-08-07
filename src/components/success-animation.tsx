/**
 * Success Animation Component
 * Displays animated success confirmation after successful coupon redemption
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Sparkles, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RedemptionSuccessData } from '@/types/redemption';
import { SUCCESS_ANIMATION_CONFIG } from '@/types/redemption';

interface SuccessAnimationProps {
  isVisible: boolean;
  onComplete: () => void;
  successData: RedemptionSuccessData | null;
  className?: string;
}

export function SuccessAnimation({
  isVisible,
  onComplete,
  successData,
  className
}: SuccessAnimationProps) {
  const [step, setStep] = useState<'checkmark' | 'text' | 'details' | 'fadeout'>('checkmark');
  
  useEffect(() => {
    if (!isVisible) {
      setStep('checkmark');
      return;
    }
    
    const timers: NodeJS.Timeout[] = [];
    
    // Checkmark animation
    timers.push(setTimeout(() => {
      setStep('text');
    }, SUCCESS_ANIMATION_CONFIG.checkmarkDelay));
    
    // Text animation
    timers.push(setTimeout(() => {
      setStep('details');
    }, SUCCESS_ANIMATION_CONFIG.textDelay));
    
    // Fade out
    timers.push(setTimeout(() => {
      setStep('fadeout');
    }, SUCCESS_ANIMATION_CONFIG.fadeOutDelay));
    
    // Complete
    timers.push(setTimeout(() => {
      onComplete();
    }, SUCCESS_ANIMATION_CONFIG.duration));
    
    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [isVisible, onComplete]);
  
  if (!isVisible || !successData) return null;
  
  return (
    <motion.div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm",
        className
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center overflow-hidden"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 30 
        }}
      >
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-green-200 rounded-full"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
              }}
              animate={{
                scale: [0, 1, 0],
                opacity: [0, 0.6, 0],
              }}
              transition={{
                duration: 2,
                delay: i * 0.2,
                repeat: Infinity,
                repeatType: "loop",
              }}
            />
          ))}
        </div>
        
        {/* Main content */}
        <div className="relative z-10">
          {/* Checkmark Animation */}
          <AnimatePresence>
            {step === 'checkmark' && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ 
                  scale: [0, 1.2, 1], 
                  rotate: [0, 0, 0] 
                }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ 
                  duration: 0.6,
                  times: [0, 0.6, 1],
                  type: "spring",
                  stiffness: 300
                }}
                className="mb-6"
              >
                <div className="relative">
                  {/* Pulsing background circle */}
                  <motion.div
                    animate={{ 
                      scale: [1, 1.3, 1],
                      opacity: [0.3, 0.1, 0.3]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="absolute inset-0 bg-green-200 rounded-full"
                  />
                  
                  {/* Main checkmark */}
                  <div className="relative bg-green-500 text-white rounded-full p-6">
                    <CheckCircle className="w-16 h-16" />
                  </div>
                  
                  {/* Sparkle effects */}
                  {[...Array(4)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute text-yellow-400"
                      style={{
                        top: `${[20, 80, 30, 70][i]}%`,
                        left: `${[80, 20, 10, 90][i]}%`,
                      }}
                      animate={{
                        scale: [0, 1, 0],
                        rotate: [0, 180, 360],
                        opacity: [0, 1, 0],
                      }}
                      transition={{
                        duration: 1.5,
                        delay: i * 0.1,
                        repeat: Infinity,
                        repeatType: "loop",
                      }}
                    >
                      <Sparkles className="w-4 h-4" />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Success Text Animation */}
          <AnimatePresence>
            {step >= 'text' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5 }}
                className="mb-6"
              >
                <motion.h2 
                  className="text-2xl font-bold text-green-600 mb-2"
                  animate={{ 
                    scale: [1, 1.05, 1] 
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  Success!
                </motion.h2>
                <motion.p 
                  className="text-lg text-gray-700 font-medium"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {SUCCESS_ANIMATION_CONFIG.message}
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Redemption Details */}
          <AnimatePresence>
            {step >= 'details' && step !== 'fadeout' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="space-y-4"
              >
                {/* Coupon details */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Gift className="w-5 h-5 text-green-600" />
                    <h3 className="font-semibold text-gray-900">
                      {successData.couponTitle}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">
                    {successData.businessName}
                  </p>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">You saved:</span>
                    <span className="font-bold text-green-600 text-lg">
                      {successData.savedAmount}
                    </span>
                  </div>
                </div>
                
                {/* Redemption code */}
                <div className="bg-gray-50 rounded-lg p-3 border">
                  <p className="text-xs text-gray-500 mb-1">Redemption Code:</p>
                  <p className="font-mono text-sm font-medium text-gray-900">
                    {successData.redemptionCode}
                  </p>
                </div>
                
                {/* Timestamp */}
                <p className="text-xs text-gray-500">
                  Redeemed on {new Date(successData.timestamp).toLocaleString()}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

/**
 * Hook for managing success animation state
 */
export function useSuccessAnimation() {
  const [isVisible, setIsVisible] = useState(false);
  const [successData, setSuccessData] = useState<RedemptionSuccessData | null>(null);
  
  const showSuccess = (data: RedemptionSuccessData) => {
    setSuccessData(data);
    setIsVisible(true);
  };
  
  const hideSuccess = () => {
    setIsVisible(false);
    setSuccessData(null);
  };
  
  return {
    isVisible,
    successData,
    showSuccess,
    hideSuccess
  };
}