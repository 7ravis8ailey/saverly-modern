# 🚀 Deployment Instructions

## Step 1: Push to GitHub

1. Create new repo at: https://github.com/new
   - Name: `saverly-modern`
   - Public repository
   - Don't initialize with README

2. Run these commands:
```bash
git remote add origin https://github.com/YOUR_USERNAME/saverly-modern.git
git push -u origin main
```

## Step 2: Deploy to Netlify

1. Go to: https://app.netlify.com/start
2. Connect your GitHub account
3. Select the `saverly-modern` repository
4. **Build settings**:
   - Build command: `npm run build`
   - Publish directory: `dist`

5. **Environment Variables** (CRITICAL):
```
VITE_SUPABASE_URL=https://lziayzusujlvhebyagdl.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6aWF5enVzdWpsdmhlYnlhZ2RsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0ODU5NjUsImV4cCI6MjA2OTA2MTk2NX0.zghVA_8Gijpk2L8iC5bRhD8SIrW6GmPJp-Q39ykYszc
VITE_GOOGLE_MAPS_API_KEY=AIzaSyD7tG8B_Y851kIfPuLaJpX5Cnt8e5W7Gn8
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

6. **Deploy!**

## Step 3: Enable Google Maps Billing

⚠️ **CRITICAL**: Go to Google Cloud Console and enable billing for the Maps API to work!

## Step 4: Test Features

After deployment:
1. Visit your Netlify URL
2. Test subscription gating at `/coupons`
3. Test profile management at `/profile`
4. Test full coupon redemption flow

## 🔗 Links You'll Need

- **GitHub**: https://github.com/new
- **Netlify**: https://app.netlify.com/start
- **Google Cloud Console**: https://console.cloud.google.com/
- **Supabase Dashboard**: https://lziayzusujlvhebyagdl.supabase.co

---

**Your Saverly Modern v2.0.0 app is ready for production!**