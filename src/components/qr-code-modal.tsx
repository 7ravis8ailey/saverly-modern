import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import QRCode from "react-qr-code";
import type { Coupon } from "@/types";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useQRRedemption } from "@/hooks/use-qr-redemption";
import { formatDisplayCode } from "@/lib/qr-utils";

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  coupon: Coupon;
  userUid: string;
}

export function QRCodeModal({ isOpen, onClose, coupon, userUid }: QRCodeModalProps) {
  const {
    isLoading,
    error,
    redemption,
    timeLeft,
    progress,
    isExpired,
    qrContent,
    displayCode,
    initializeQR,
    reset,
    formattedTime,
    isLowTime
  } = useQRRedemption({ coupon, userUid });

  // Initialize QR when modal opens
  useEffect(() => {
    if (isOpen) {
      initializeQR();
    } else {
      reset();
    }
  }, [isOpen, initializeQR, reset]);

  // Auto-close when expired
  useEffect(() => {
    if (isExpired) {
      onClose();
    }
  }, [isExpired, onClose]);

  // Handle loading state
  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Generating QR Code...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
            />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Handle error state
  if (error) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
          </DialogHeader>
          <div className="p-6 text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
            >
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Show QR Code to Business</DialogTitle>
        </DialogHeader>
        
        <motion.div 
          className="flex flex-col items-center justify-center p-6 space-y-6"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {/* QR Code with bounce animation */}
          <AnimatePresence>
            {qrContent && (
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
                className="qr-card relative p-6 bg-white rounded-xl shadow-lg border-2 border-blue-100"
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
            )}
          </AnimatePresence>

          {/* 8-digit Display Code with enhanced animation */}
          <AnimatePresence>
            {displayCode && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="text-center bg-gray-50 rounded-lg p-4 border"
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
            )}
          </AnimatePresence>

          {/* Enhanced Progress bar with color coding */}
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
                indicatorColor={isLowTime ? '#ef4444' : '#3b82f6'}
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
                {formattedTime}
              </motion.span>
            </motion.div>
          </div>

          {/* Instructions with staggered animation */}
          <motion.div 
            className="text-center space-y-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.6 }}
          >
            <motion.p 
              className="text-sm font-semibold text-gray-700"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              Present this QR code to the business for redemption
            </motion.p>
            
            <motion.p 
              className={cn(
                "text-sm font-medium",
                isLowTime ? "text-red-600" : "text-gray-500"
              )}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              {isLowTime ? "⚠️ " : ""}This code expires in {formattedTime}
            </motion.p>
            
            {displayCode && (
              <motion.p 
                className="text-xs text-gray-500 border-t pt-2 mt-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
              >
                Share the manual entry code if the business cannot scan the QR code
              </motion.p>
            )}
          </motion.div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}