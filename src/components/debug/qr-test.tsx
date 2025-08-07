import { useState } from 'react';
import { QRCodeModal } from '@/components/qr-code-modal';
import { Button } from '@/components/ui/button';
import type { Coupon } from '@/types';

// Mock coupon data for testing
const mockCoupon: Coupon = {
  uid: 'test-coupon-uid',
  businessUid: 'test-business-uid',
  title: 'Test 20% Off Coupon',
  description: 'Test coupon for QR system validation',
  discount: '20%',
  startDate: new Date().toISOString(),
  endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  active: true,
  usageLimit: 'one_time',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

const mockUserUid = 'test-user-uid';

export function QRTest() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="p-8 max-w-md mx-auto">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">QR Code System Test</h2>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Test Features:</h3>
          <ul className="text-sm space-y-1">
            <li>✅ 60-second countdown timer</li>
            <li>✅ Unique QR code generation (crypto.randomBytes)</li>
            <li>✅ 8-digit display code (XXXX-XXXX format)</li>
            <li>✅ Animated modal with Framer Motion</li>
            <li>✅ Progress bar color coding (red ≤25%)</li>
            <li>✅ Auto-close when timer expires</li>
            <li>✅ QR code bounce animation</li>
            <li>✅ Supabase database integration</li>
          </ul>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Testing Coupon:</h3>
          <p className="text-sm"><strong>Title:</strong> {mockCoupon.title}</p>
          <p className="text-sm"><strong>Discount:</strong> {mockCoupon.discount}</p>
          <p className="text-sm"><strong>Business:</strong> {mockCoupon.businessUid}</p>
        </div>

        <Button 
          onClick={() => setIsModalOpen(true)}
          className="w-full"
          size="lg"
        >
          Test QR Code Generation
        </Button>

        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>Expected Behavior:</strong></p>
          <p>• Modal slides in with animations</p>
          <p>• QR code appears with bounce effect</p>
          <p>• 8-digit code displays below QR</p>
          <p>• Timer counts down from 01:00</p>
          <p>• Progress bar turns red at 15 seconds</p>
          <p>• Modal auto-closes at 00:00</p>
        </div>
      </div>

      <QRCodeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        coupon={mockCoupon}
        userUid={mockUserUid}
      />
    </div>
  );
}