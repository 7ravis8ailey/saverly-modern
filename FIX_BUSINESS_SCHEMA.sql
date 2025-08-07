-- Fix Business Table Schema for Google Maps Integration
-- Remove required city constraint since Google Maps provides complete addresses

-- 1. First, check current schema
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'businesses'
ORDER BY ordinal_position;

-- 2. Make city, state, zip_code optional (nullable)
-- These are included in the Google Maps formatted address
ALTER TABLE public.businesses 
ALTER COLUMN city DROP NOT NULL;

ALTER TABLE public.businesses 
ALTER COLUMN state DROP NOT NULL;

ALTER TABLE public.businesses 
ALTER COLUMN zip_code DROP NOT NULL;

-- 3. Ensure we have the Google Maps fields
-- Add them if they don't exist
DO $$ 
BEGIN
    -- Add place_id if it doesn't exist (Google's unique identifier)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'businesses' 
        AND column_name = 'place_id'
    ) THEN
        ALTER TABLE public.businesses 
        ADD COLUMN place_id VARCHAR(255);
    END IF;
    
    -- Add formatted_address if it doesn't exist (complete Google address)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'businesses' 
        AND column_name = 'formatted_address'
    ) THEN
        ALTER TABLE public.businesses 
        ADD COLUMN formatted_address TEXT;
    END IF;
    
    -- Ensure latitude and longitude exist for map display
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'businesses' 
        AND column_name = 'latitude'
    ) THEN
        ALTER TABLE public.businesses 
        ADD COLUMN latitude DECIMAL(10, 8);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'businesses' 
        AND column_name = 'longitude'
    ) THEN
        ALTER TABLE public.businesses 
        ADD COLUMN longitude DECIMAL(11, 8);
    END IF;
END $$;

-- 4. Add a comment explaining the schema
COMMENT ON TABLE public.businesses IS 'Business profiles with Google Maps verified addresses. Address components (city, state, zip) are optional as they are included in formatted_address from Google Maps API.';

COMMENT ON COLUMN public.businesses.formatted_address IS 'Complete address from Google Maps Places API';
COMMENT ON COLUMN public.businesses.place_id IS 'Google Maps Place ID for this location';
COMMENT ON COLUMN public.businesses.latitude IS 'Latitude from Google Maps for distance calculations';
COMMENT ON COLUMN public.businesses.longitude IS 'Longitude from Google Maps for distance calculations';
COMMENT ON COLUMN public.businesses.address IS 'Street address portion (legacy, prefer formatted_address)';
COMMENT ON COLUMN public.businesses.city IS 'City (optional - extracted from Google Maps if needed)';
COMMENT ON COLUMN public.businesses.state IS 'State (optional - extracted from Google Maps if needed)';
COMMENT ON COLUMN public.businesses.zip_code IS 'ZIP code (optional - extracted from Google Maps if needed)';

-- 5. Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    CASE 
        WHEN is_nullable = 'YES' THEN '✅ Optional'
        ELSE '❌ Required'
    END as status
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'businesses'
AND column_name IN ('address', 'city', 'state', 'zip_code', 'formatted_address', 'place_id', 'latitude', 'longitude')
ORDER BY ordinal_position;

-- Success! Now businesses table works with Google Maps integration:
-- • formatted_address stores the complete Google-verified address
-- • place_id stores Google's unique location identifier  
-- • latitude/longitude for distance calculations
-- • city/state/zip are optional (for backward compatibility)