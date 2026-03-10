-- Add alert_type column to alerts table
ALTER TABLE public.alerts ADD COLUMN alert_type VARCHAR(50) DEFAULT 'critical';

-- Update existing alerts based on their level
UPDATE public.alerts SET alert_type = 'critical' WHERE level = 'critical';
UPDATE public.alerts SET alert_type = 'incident' WHERE level = 'high';

-- Add check constraint for valid alert types
ALTER TABLE public.alerts ADD CONSTRAINT valid_alert_type CHECK (alert_type IN ('critical', 'incident'));

-- Add comment for clarity
COMMENT ON COLUMN public.alerts.alert_type IS 'Type of alert: critical (SOS/emergency), incident (accident/other)';
