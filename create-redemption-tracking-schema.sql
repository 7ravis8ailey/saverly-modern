-- Enhanced Coupon Redemption Tracking Schema
-- Supports QR code generation, usage limits, and monthly resets

-- First, check current coupon_redemptions table structure
SELECT 'CURRENT COUPON_REDEMPTIONS TABLE STRUCTURE' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'coupon_redemptions' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Add missing columns to coupon_redemptions table for enhanced tracking
ALTER TABLE public.coupon_redemptions 
ADD COLUMN IF NOT EXISTS id TEXT PRIMARY KEY DEFAULT 'redemption_' || extract(epoch from now()) || '_' || substr(md5(random()::text), 1, 8),
ADD COLUMN IF NOT EXISTS qr_data TEXT,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'used'));

-- Ensure we have the basic redemption tracking structure
-- (This handles cases where the table might not exist or be incomplete)
CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
    id TEXT PRIMARY KEY DEFAULT 'redemption_' || extract(epoch from now()) || '_' || substr(md5(random()::text), 1, 8),
    coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    qr_data TEXT,
    redeemed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'used')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_coupon_id ON public.coupon_redemptions(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_user_id ON public.coupon_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_redeemed_at ON public.coupon_redemptions(redeemed_at);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_status ON public.coupon_redemptions(status);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_expires_at ON public.coupon_redemptions(expires_at);

-- Composite index for usage tracking queries
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_user_coupon_date 
ON public.coupon_redemptions(user_id, coupon_id, redeemed_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_coupon_redemptions_updated_at ON public.coupon_redemptions;
CREATE TRIGGER update_coupon_redemptions_updated_at
    BEFORE UPDATE ON public.coupon_redemptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies for coupon_redemptions
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own redemptions
DROP POLICY IF EXISTS "Users can view their own redemptions" ON public.coupon_redemptions;
CREATE POLICY "Users can view their own redemptions" ON public.coupon_redemptions
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own redemptions
DROP POLICY IF EXISTS "Users can insert their own redemptions" ON public.coupon_redemptions;
CREATE POLICY "Users can insert their own redemptions" ON public.coupon_redemptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own redemptions (for status changes)
DROP POLICY IF EXISTS "Users can update their own redemptions" ON public.coupon_redemptions;
CREATE POLICY "Users can update their own redemptions" ON public.coupon_redemptions
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Business owners can view redemptions for their coupons
DROP POLICY IF EXISTS "Business owners can view redemptions for their coupons" ON public.coupon_redemptions;
CREATE POLICY "Business owners can view redemptions for their coupons" ON public.coupon_redemptions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.coupons c
            JOIN public.businesses b ON c.business_id = b.id
            WHERE c.id = coupon_id AND b.owner_id = auth.uid()
        )
    );

-- Ensure coupons table has all needed columns for usage tracking
ALTER TABLE public.coupons
ADD COLUMN IF NOT EXISTS usage_limit VARCHAR(50) DEFAULT 'unlimited',
ADD COLUMN IF NOT EXISTS current_usage_count INTEGER DEFAULT 0;

-- Add check constraint for usage_limit
ALTER TABLE public.coupons
DROP CONSTRAINT IF EXISTS coupons_usage_limit_check;
ALTER TABLE public.coupons
ADD CONSTRAINT coupons_usage_limit_check 
CHECK (usage_limit IN ('unlimited', 'once_per_user', '1_per_month', '2_per_month', '3_per_month', '4_per_month', '5_per_month'));

-- Function to update coupon usage count
CREATE OR REPLACE FUNCTION update_coupon_usage_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the current_usage_count when a redemption is inserted
    IF TG_OP = 'INSERT' THEN
        UPDATE public.coupons 
        SET current_usage_count = current_usage_count + 1
        WHERE id = NEW.coupon_id;
        RETURN NEW;
    END IF;
    
    -- Update the count when a redemption is deleted (unlikely but good practice)
    IF TG_OP = 'DELETE' THEN
        UPDATE public.coupons 
        SET current_usage_count = GREATEST(0, current_usage_count - 1)
        WHERE id = OLD.coupon_id;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Trigger to automatically update coupon usage count
DROP TRIGGER IF EXISTS update_coupon_usage_trigger ON public.coupon_redemptions;
CREATE TRIGGER update_coupon_usage_trigger
    AFTER INSERT OR DELETE ON public.coupon_redemptions
    FOR EACH ROW
    EXECUTE FUNCTION update_coupon_usage_count();

-- View for easy redemption analytics
CREATE OR REPLACE VIEW public.redemption_analytics AS
SELECT 
    c.id as coupon_id,
    c.title as coupon_title,
    b.name as business_name,
    b.category as business_category,
    COUNT(r.id) as total_redemptions,
    COUNT(CASE WHEN r.redeemed_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as last_30_days,
    COUNT(CASE WHEN r.redeemed_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as last_7_days,
    COUNT(CASE WHEN r.redeemed_at >= CURRENT_DATE THEN 1 END) as today,
    ROUND(AVG(EXTRACT(EPOCH FROM (r.expires_at - r.redeemed_at)))) as avg_qr_display_seconds
FROM public.coupons c
LEFT JOIN public.coupon_redemptions r ON c.id = r.coupon_id
JOIN public.businesses b ON c.business_id = b.id
GROUP BY c.id, c.title, b.name, b.category;

-- Show updated table structure
SELECT 'UPDATED COUPON_REDEMPTIONS TABLE STRUCTURE' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'coupon_redemptions' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show updated coupons table structure (usage tracking columns)
SELECT 'UPDATED COUPONS TABLE USAGE TRACKING COLUMNS' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'coupons' AND table_schema = 'public'
AND column_name IN ('usage_limit', 'current_usage_count')
ORDER BY ordinal_position;

-- Sample data for testing (optional)
SELECT 'TESTING REDEMPTION SYSTEM' as info;

-- Insert some test redemptions (only if we have test data)
DO $$
DECLARE
    test_coupon_id UUID;
    test_user_id UUID;
BEGIN
    -- Get first available coupon and user for testing
    SELECT id INTO test_coupon_id FROM public.coupons WHERE active = true LIMIT 1;
    SELECT id INTO test_user_id FROM public.users LIMIT 1;
    
    IF test_coupon_id IS NOT NULL AND test_user_id IS NOT NULL THEN
        -- Insert test redemption
        INSERT INTO public.coupon_redemptions (
            coupon_id, user_id, qr_data, status,
            expires_at, redeemed_at
        ) VALUES (
            test_coupon_id,
            test_user_id,
            '{"test": true, "redemption_id": "test_123"}',
            'used',
            NOW() + INTERVAL '1 minute',
            NOW()
        ) ON CONFLICT (id) DO NOTHING;
        
        RAISE NOTICE 'Test redemption created successfully';
    ELSE
        RAISE NOTICE 'No test data available - skipping test redemption creation';
    END IF;
END $$;

-- Show sample redemption data
SELECT 'SAMPLE REDEMPTION DATA' as info;
SELECT 
    r.id,
    r.status,
    r.redeemed_at,
    c.title as coupon_title,
    u.email as user_email,
    EXTRACT(EPOCH FROM (r.expires_at - r.redeemed_at)) as qr_duration_seconds
FROM public.coupon_redemptions r
JOIN public.coupons c ON r.coupon_id = c.id
LEFT JOIN public.users u ON r.user_id = u.id
ORDER BY r.redeemed_at DESC
LIMIT 5;

-- Show redemption analytics sample
SELECT 'REDEMPTION ANALYTICS SAMPLE' as info;
SELECT * FROM public.redemption_analytics
ORDER BY total_redemptions DESC
LIMIT 5;