-- Add memory capture fields to country_visit_details for emotional storytelling
ALTER TABLE public.country_visit_details 
ADD COLUMN IF NOT EXISTS highlight TEXT,
ADD COLUMN IF NOT EXISTS why_it_mattered TEXT;

-- Add trip_id to travel_photos to link photos to specific trips
ALTER TABLE public.travel_photos 
ADD COLUMN IF NOT EXISTS trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL;

-- Create index for better performance when querying photos by trip
CREATE INDEX IF NOT EXISTS idx_travel_photos_trip_id ON public.travel_photos(trip_id);