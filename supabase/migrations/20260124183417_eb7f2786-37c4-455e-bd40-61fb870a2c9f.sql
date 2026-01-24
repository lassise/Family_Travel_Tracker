-- Create trip_countries join table for multi-country trips
CREATE TABLE IF NOT EXISTS public.trip_countries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  country_code TEXT NOT NULL,
  country_name TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for efficient trip lookups
CREATE INDEX idx_trip_countries_trip_id ON public.trip_countries(trip_id);

-- Create unique constraint to prevent duplicate countries per trip
CREATE UNIQUE INDEX idx_trip_countries_unique ON public.trip_countries(trip_id, country_code);

-- Add archived column to trips table for combine functionality
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false;

-- Enable RLS
ALTER TABLE public.trip_countries ENABLE ROW LEVEL SECURITY;

-- RLS policies for trip_countries
-- Users can view trip_countries for trips they own
CREATE POLICY "Users can view their own trip countries"
  ON public.trip_countries
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trips t
      WHERE t.id = trip_countries.trip_id
      AND t.user_id = auth.uid()
    )
  );

-- Users can insert trip_countries for trips they own
CREATE POLICY "Users can insert trip countries for their trips"
  ON public.trip_countries
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trips t
      WHERE t.id = trip_countries.trip_id
      AND t.user_id = auth.uid()
    )
  );

-- Users can update trip_countries for trips they own
CREATE POLICY "Users can update their own trip countries"
  ON public.trip_countries
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.trips t
      WHERE t.id = trip_countries.trip_id
      AND t.user_id = auth.uid()
    )
  );

-- Users can delete trip_countries for trips they own
CREATE POLICY "Users can delete their own trip countries"
  ON public.trip_countries
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.trips t
      WHERE t.id = trip_countries.trip_id
      AND t.user_id = auth.uid()
    )
  );

-- Enable realtime for trip_countries
ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_countries;