/**
 * Generate a unique QR code using Web Crypto API (browser-compatible)
 */
export function generateUniqueQRCode(): string {
  // Use crypto.getRandomValues for browser compatibility
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate an 8-digit numeric display code for manual entry
 */
export function generateDisplayCode(): string {
  // Generate 8 random digits
  const digits = Array.from({ length: 8 }, () => 
    Math.floor(Math.random() * 10)
  ).join('');
  
  return digits;
}

/**
 * Create QR content object with proper structure
 */
export function createQRContent(params: {
  couponId: string;
  businessId: string;
  userUid: string;
  redemptionId: string;
  qrCode: string;
  displayCode: string;
}) {
  return {
    ...params,
    timestamp: new Date().toISOString(),
    version: '2.0'
  };
}

/**
 * Format display code with dashes for readability (XXXX-XXXX)
 */
export function formatDisplayCode(code: string): string {
  if (code.length !== 8) return code;
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

/**
 * Validate QR code format
 */
export function isValidQRCode(qrCode: string): boolean {
  // Should be 64 characters (32 bytes in hex)
  return /^[a-f0-9]{64}$/i.test(qrCode);
}

/**
 * Validate display code format
 */
export function isValidDisplayCode(displayCode: string): boolean {
  // Should be exactly 8 digits
  return /^\d{8}$/.test(displayCode);
}