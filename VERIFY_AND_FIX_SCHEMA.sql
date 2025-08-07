-- Verify and fix database schema
-- Run this to ensure all tables and columns exist

-- 1. Check webhook_events table
SELECT 'WEBHOOK_EVENTS TABLE CHECK' as info;
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'webhook_events'
) as webhook_table_exists;

-- 2. If webhook_events doesn't exist, create it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'webhook_events'
    ) THEN
        CREATE TABLE public.webhook_events (
            id VARCHAR(255) PRIMARY KEY,
            type VARCHAR(100) NOT NULL,
            data JSONB NOT NULL,
            attempts INTEGER DEFAULT 0,
            status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
            error_message TEXT,
            next_attempt_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- Create indexes
        CREATE INDEX idx_webhook_events_status ON public.webhook_events(status);
        CREATE INDEX idx_webhook_events_type ON public.webhook_events(type);
        CREATE INDEX idx_webhook_events_created_at ON public.webhook_events(created_at);
        
        -- Enable RLS
        ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
        
        -- Create admin policy
        CREATE POLICY "admins_manage_webhooks" ON public.webhook_events
            FOR ALL USING (public.is_admin_user());
            
        RAISE NOTICE 'Created webhook_events table';
    ELSE
        RAISE NOTICE 'webhook_events table already exists';
    END IF;
END $$;

-- 3. Check and fix businesses table columns
SELECT 'BUSINESSES TABLE COLUMNS CHECK' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'businesses' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Add missing columns to businesses table
DO $$
BEGIN
    -- Check if businesses table exists
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'businesses'
    ) THEN
        -- Add contact_name if missing
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'businesses' 
            AND column_name = 'contact_name'
        ) THEN
            ALTER TABLE public.businesses ADD COLUMN contact_name TEXT;
            RAISE NOTICE 'Added contact_name column to businesses';
        END IF;
        
        -- Add phone if missing
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'businesses' 
            AND column_name = 'phone'
        ) THEN
            ALTER TABLE public.businesses ADD COLUMN phone VARCHAR(20);
            RAISE NOTICE 'Added phone column to businesses';
        END IF;
        
        -- Add city if missing
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'businesses' 
            AND column_name = 'city'
        ) THEN
            ALTER TABLE public.businesses ADD COLUMN city VARCHAR(100);
            RAISE NOTICE 'Added city column to businesses';
        END IF;
        
        -- Add state if missing
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'businesses' 
            AND column_name = 'state'
        ) THEN
            ALTER TABLE public.businesses ADD COLUMN state VARCHAR(50);
            RAISE NOTICE 'Added state column to businesses';
        END IF;
        
        -- Add zip_code if missing
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'businesses' 
            AND column_name = 'zip_code'
        ) THEN
            ALTER TABLE public.businesses ADD COLUMN zip_code VARCHAR(20);
            RAISE NOTICE 'Added zip_code column to businesses';
        END IF;
        
        -- Add created_at if missing
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'businesses' 
            AND column_name = 'created_at'
        ) THEN
            ALTER TABLE public.businesses ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
            RAISE NOTICE 'Added created_at column to businesses';
        END IF;
        
        -- Add updated_at if missing
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'businesses' 
            AND column_name = 'updated_at'
        ) THEN
            ALTER TABLE public.businesses ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
            RAISE NOTICE 'Added updated_at column to businesses';
        END IF;
    ELSE
        -- Create businesses table if it doesn't exist
        CREATE TABLE public.businesses (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name TEXT NOT NULL,
            description TEXT,
            category TEXT NOT NULL,
            email TEXT NOT NULL,
            phone VARCHAR(20),
            contact_name TEXT,
            formatted_address TEXT,
            city VARCHAR(100),
            state VARCHAR(50),
            zip_code VARCHAR(20),
            latitude NUMERIC,
            longitude NUMERIC,
            place_id VARCHAR(255),
            owner_id UUID REFERENCES public.users(id),
            active BOOLEAN DEFAULT true,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        CREATE INDEX idx_businesses_name ON public.businesses(name);
        CREATE INDEX idx_businesses_category ON public.businesses(category);
        CREATE INDEX idx_businesses_active ON public.businesses(active);
        
        ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
        
        RAISE NOTICE 'Created businesses table';
    END IF;
END $$;

-- 5. Check if coupons table exists and has proper structure
SELECT 'COUPONS TABLE CHECK' as info;
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'coupons'
) as coupons_table_exists;

-- 6. Create coupons table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'coupons'
    ) THEN
        CREATE TABLE public.coupons (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            discount_type VARCHAR(50) NOT NULL,
            discount_value NUMERIC,
            discount_text TEXT NOT NULL,
            minimum_purchase NUMERIC,
            maximum_discount NUMERIC,
            start_date TIMESTAMPTZ NOT NULL,
            end_date TIMESTAMPTZ NOT NULL,
            usage_limit VARCHAR(50) NOT NULL,
            usage_limit_per_user INTEGER,
            total_usage_limit INTEGER,
            current_usage_count INTEGER DEFAULT 0,
            terms_conditions TEXT,
            active BOOLEAN DEFAULT true,
            featured BOOLEAN DEFAULT false,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        CREATE INDEX idx_coupons_business_id ON public.coupons(business_id);
        CREATE INDEX idx_coupons_active ON public.coupons(active);
        CREATE INDEX idx_coupons_dates ON public.coupons(start_date, end_date);
        
        ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
        
        RAISE NOTICE 'Created coupons table';
    END IF;
END $$;

-- 7. Create webhook stats function if it doesn't exist
CREATE OR REPLACE FUNCTION public.get_webhook_stats()
RETURNS JSON AS $$
DECLARE
    stats JSON;
BEGIN
    SELECT json_build_object(
        'pending', COUNT(*) FILTER (WHERE status = 'pending'),
        'processing', COUNT(*) FILTER (WHERE status = 'processing'),
        'failed', COUNT(*) FILTER (WHERE status = 'failed'),
        'completed', COUNT(*) FILTER (WHERE status = 'completed')
    ) INTO stats
    FROM public.webhook_events
    WHERE created_at > NOW() - INTERVAL '24 hours';
    
    RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.webhook_events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.businesses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coupons TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_webhook_stats() TO authenticated;

-- 9. Final verification
SELECT 'FINAL VERIFICATION' as info;

SELECT 
    'webhook_events' as table_name,
    COUNT(*) as column_count 
FROM information_schema.columns 
WHERE table_name = 'webhook_events' AND table_schema = 'public'
UNION ALL
SELECT 
    'businesses' as table_name,
    COUNT(*) as column_count 
FROM information_schema.columns 
WHERE table_name = 'businesses' AND table_schema = 'public'
UNION ALL
SELECT 
    'coupons' as table_name,
    COUNT(*) as column_count 
FROM information_schema.columns 
WHERE table_name = 'coupons' AND table_schema = 'public';

SELECT 'SCHEMA VERIFICATION COMPLETE' as status;