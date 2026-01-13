-- Add price_alert_email column to saved_flights for email notifications
ALTER TABLE public.saved_flights 
ADD COLUMN IF NOT EXISTS alert_email text;

-- Enable realtime for saved_flights for price monitoring
ALTER PUBLICATION supabase_realtime ADD TABLE public.saved_flights;