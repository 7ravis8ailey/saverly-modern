-- Update Business Schema for Admin Management
-- Adds missing fields needed for admin business management

-- 1. Check current business table structure
SELECT 'CURRENT BUSINESS TABLE STRUCTURE' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'businesses' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Add missing columns to businesses table
DO $$
BEGIN
    -- Add contact_name column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'businesses' AND column_name = 'contact_name' AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.businesses ADD COLUMN contact_name TEXT;
        RAISE NOTICE 'Added contact_name column';
    ELSE
        RAISE NOTICE 'contact_name column already exists';
    END IF;
    
    -- Add phone column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'businesses' AND column_name = 'phone' AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.businesses ADD COLUMN phone VARCHAR(20);
        RAISE NOTICE 'Added phone column';
    ELSE
        RAISE NOTICE 'phone column already exists';
    END IF;
    
    -- Add place_id column for Google Maps integration
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'businesses' AND column_name = 'place_id' AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.businesses ADD COLUMN place_id VARCHAR(255);
        RAISE NOTICE 'Added place_id column';
    ELSE
        RAISE NOTICE 'place_id column already exists';
    END IF;
    
    -- Add formatted_address column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'businesses' AND column_name = 'formatted_address' AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.businesses ADD COLUMN formatted_address TEXT;
        RAISE NOTICE 'Added formatted_address column';
    ELSE
        RAISE NOTICE 'formatted_address column already exists';
    END IF;
    
    -- Add city, state, zip_code columns if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'businesses' AND column_name = 'city' AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.businesses ADD COLUMN city VARCHAR(100);
        RAISE NOTICE 'Added city column';
    ELSE
        RAISE NOTICE 'city column already exists';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'businesses' AND column_name = 'state' AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.businesses ADD COLUMN state VARCHAR(50);
        RAISE NOTICE 'Added state column';
    ELSE
        RAISE NOTICE 'state column already exists';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'businesses' AND column_name = 'zip_code' AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.businesses ADD COLUMN zip_code VARCHAR(20);
        RAISE NOTICE 'Added zip_code column';
    ELSE
        RAISE NOTICE 'zip_code column already exists';
    END IF;
    
    -- Add created_at and updated_at if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'businesses' AND column_name = 'created_at' AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.businesses ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Added created_at column';
    ELSE
        RAISE NOTICE 'created_at column already exists';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'businesses' AND column_name = 'updated_at' AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.businesses ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column';
    ELSE
        RAISE NOTICE 'updated_at column already exists';
    END IF;
END $$;

-- 3. Update existing businesses to populate missing data where possible
UPDATE public.businesses 
SET 
    contact_name = COALESCE(contact_name, 'Business Owner'),
    formatted_address = COALESCE(formatted_address, CONCAT(address, ', ', city, ', ', state, ' ', zipCode)),
    city = COALESCE(city, 'Unknown'),
    state = COALESCE(state, 'Unknown'),
    zip_code = COALESCE(zip_code, zipCode),
    created_at = COALESCE(created_at, createdAt::timestamptz, NOW()),
    updated_at = COALESCE(updated_at, updatedAt::timestamptz, NOW())
WHERE contact_name IS NULL 
   OR formatted_address IS NULL 
   OR city IS NULL 
   OR state IS NULL 
   OR zip_code IS NULL 
   OR created_at IS NULL 
   OR updated_at IS NULL;

-- 4. Create indexes for admin management performance
CREATE INDEX IF NOT EXISTS idx_businesses_name ON public.businesses(name);
CREATE INDEX IF NOT EXISTS idx_businesses_category ON public.businesses(category);
CREATE INDEX IF NOT EXISTS idx_businesses_city ON public.businesses(city);
CREATE INDEX IF NOT EXISTS idx_businesses_state ON public.businesses(state);
CREATE INDEX IF NOT EXISTS idx_businesses_active ON public.businesses(active);
CREATE INDEX IF NOT EXISTS idx_businesses_created_at ON public.businesses(created_at);
CREATE INDEX IF NOT EXISTS idx_businesses_owner_id ON public.businesses(owner_id);

-- 5. Create updated_at trigger for businesses
CREATE OR REPLACE FUNCTION update_updated_at_businesses()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_businesses_updated_at ON public.businesses;

-- Create new trigger
CREATE TRIGGER update_businesses_updated_at
    BEFORE UPDATE ON public.businesses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_businesses();

-- 6. Update RLS policies for admin business management
-- Drop old policies that might conflict
DROP POLICY IF EXISTS "businesses_select_all" ON public.businesses;
DROP POLICY IF EXISTS "businesses_insert_admin" ON public.businesses;
DROP POLICY IF EXISTS "businesses_update_admin" ON public.businesses;
DROP POLICY IF EXISTS "businesses_delete_admin" ON public.businesses;

-- Create comprehensive admin policies
CREATE POLICY "businesses_select_public" ON public.businesses
    FOR SELECT USING (active = true OR public.is_admin_user());

CREATE POLICY "businesses_insert_admin" ON public.businesses
    FOR INSERT WITH CHECK (public.is_admin_user());

CREATE POLICY "businesses_update_admin" ON public.businesses
    FOR UPDATE USING (public.is_admin_user());

CREATE POLICY "businesses_delete_admin" ON public.businesses
    FOR DELETE USING (public.is_admin_user());

-- Business owners can update their own business
CREATE POLICY "businesses_update_owner" ON public.businesses
    FOR UPDATE USING (owner_id = auth.uid());

-- 7. Show updated table structure
SELECT 'UPDATED BUSINESS TABLE STRUCTURE' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'businesses' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 8. Show sample data
SELECT 'SAMPLE BUSINESS DATA' as info;
SELECT 
    id, name, category, email, contact_name, city, state, 
    active, created_at
FROM public.businesses
ORDER BY created_at DESC
LIMIT 5;

-- Comments for documentation
COMMENT ON COLUMN public.businesses.contact_name IS 'Primary contact person for the business';
COMMENT ON COLUMN public.businesses.phone IS 'Business phone number';
COMMENT ON COLUMN public.businesses.formatted_address IS 'Complete formatted address from Google Maps';
COMMENT ON COLUMN public.businesses.place_id IS 'Google Maps Place ID for address verification';
COMMENT ON COLUMN public.businesses.city IS 'Business city (extracted from address)';
COMMENT ON COLUMN public.businesses.state IS 'Business state/province (extracted from address)';
COMMENT ON COLUMN public.businesses.zip_code IS 'Business ZIP/postal code (extracted from address)';

-- SUCCESS! Business table is now ready for admin management