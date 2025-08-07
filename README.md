# 🎯 Saverly Modern v2.0.0

**A production-ready coupon marketplace application with Instagram-style UI and comprehensive redemption system.**

## 🚀 Quick Deploy

### **Deploy to Netlify**
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/yourusername/saverly-modern)

### **Environment Variables for Deployment:**
```
VITE_SUPABASE_URL=https://lziayzusujlvhebyagdl.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6aWF5enVzdWpsdmhlYnlhZ2RsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0ODU5NjUsImV4cCI6MjA2OTA2MTk2NX0.zghVA_8Gijpk2L8iC5bRhD8SIrW6GmPJp-Q39ykYszc
VITE_GOOGLE_MAPS_API_KEY=AIzaSyD7tG8B_Y851kIfPuLaJpX5Cnt8e5W7Gn8
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key_here
```

## ✨ Features

- **Instagram-Style Coupon Feed** - Infinite scroll with beautiful cards
- **QR Code Redemption** - 60-second countdown with visual indicators
- **Subscription Gating** - $4.99/month premium access
- **Google Maps Integration** - Address validation and location search
- **Usage Tracking** - Monthly reset based on subscription date
- **Profile Management** - Complete user profile system

## 🧪 Test the Features

After deployment:

1. **Non-Subscriber Test**: Visit `/coupons` → Should see marketing page
2. **Profile Test**: Visit `/profile` → Test Google Maps address input
3. **Coupon Flow**: As subscriber → Browse feed → Redeem coupon → QR code
4. **Timer Test**: Verify 60-second countdown turns red at 10 seconds

## ⚠️ Important Setup

**Google Maps requires billing enabled in Google Cloud Console!**

## 🏗️ Tech Stack

- React 19 + TypeScript
- Radix UI + Tailwind CSS
- Supabase Database (pre-configured)
- Google Maps Places API
- Stripe Payments Ready

---

**🚀 All coupon redemption features implemented and production-ready!**