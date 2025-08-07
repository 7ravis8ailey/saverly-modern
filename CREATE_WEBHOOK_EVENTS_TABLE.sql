-- Create webhook_events table for tracking webhook resilience
-- This table stores webhook events and their retry status

CREATE TABLE IF NOT EXISTS public.webhook_events (
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON public.webhook_events(status);
CREATE INDEX IF NOT EXISTS idx_webhook_events_type ON public.webhook_events(type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_next_attempt ON public.webhook_events(next_attempt_at) WHERE next_attempt_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON public.webhook_events(created_at);

-- Create RLS policies
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Only admins can manage webhook events
CREATE POLICY "admins_manage_webhooks" ON public.webhook_events
    FOR ALL USING (public.is_admin_user());

-- Function to get webhook statistics
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

-- Function to cleanup old webhook events (optional)
CREATE OR REPLACE FUNCTION public.cleanup_old_webhook_events()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete completed webhooks older than 7 days
    DELETE FROM public.webhook_events 
    WHERE status = 'completed' 
    AND created_at < NOW() - INTERVAL '7 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Delete failed webhooks older than 30 days
    DELETE FROM public.webhook_events 
    WHERE status = 'failed' 
    AND created_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_webhook_events_updated_at
    BEFORE UPDATE ON public.webhook_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE public.webhook_events IS 'Stores webhook events for retry and resilience tracking';
COMMENT ON COLUMN public.webhook_events.id IS 'Unique webhook event ID (from Stripe or generated)';
COMMENT ON COLUMN public.webhook_events.type IS 'Webhook event type (e.g., customer.subscription.updated)';
COMMENT ON COLUMN public.webhook_events.data IS 'Complete webhook payload as JSON';
COMMENT ON COLUMN public.webhook_events.attempts IS 'Number of processing attempts made';
COMMENT ON COLUMN public.webhook_events.status IS 'Current processing status';
COMMENT ON COLUMN public.webhook_events.next_attempt_at IS 'When to retry next (if applicable)';

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.webhook_events TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_webhook_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_old_webhook_events() TO authenticated;