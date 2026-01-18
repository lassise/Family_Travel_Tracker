-- Add new columns to itinerary_items for booking, ratings, and seasonal advice
ALTER TABLE public.itinerary_items 
ADD COLUMN IF NOT EXISTS rating NUMERIC(2,1),
ADD COLUMN IF NOT EXISTS review_count INTEGER,
ADD COLUMN IF NOT EXISTS booking_url TEXT,
ADD COLUMN IF NOT EXISTS provider_type TEXT CHECK (provider_type IN ('local_tour', 'airbnb_experience', 'viator', 'getyourguide', 'restaurant', 'attraction', 'transport', 'hotel', 'other')),
ADD COLUMN IF NOT EXISTS why_it_fits TEXT,
ADD COLUMN IF NOT EXISTS best_time_to_visit TEXT,
ADD COLUMN IF NOT EXISTS crowd_level TEXT CHECK (crowd_level IN ('low', 'moderate', 'high', 'peak')),
ADD COLUMN IF NOT EXISTS seasonal_notes TEXT,
ADD COLUMN IF NOT EXISTS transport_mode TEXT CHECK (transport_mode IN ('walk', 'taxi', 'metro', 'bus', 'train', 'ferry', 'car', 'bike', 'other')),
ADD COLUMN IF NOT EXISTS transport_booking_url TEXT,
ADD COLUMN IF NOT EXISTS transport_station_notes TEXT,
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Add lodging suggestions table for hotel/rental recommendations
CREATE TABLE IF NOT EXISTS public.trip_lodging_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  lodging_type TEXT CHECK (lodging_type IN ('hotel', 'vacation_rental', 'hostel', 'apartment', 'other')),
  rating NUMERIC(2,1),
  review_count INTEGER,
  price_per_night NUMERIC(10,2),
  currency TEXT DEFAULT 'USD',
  booking_url TEXT,
  image_url TEXT,
  address TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  amenities TEXT[],
  is_kid_friendly BOOLEAN DEFAULT false,
  distance_from_center TEXT,
  why_recommended TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add train segments table for train travel planning
CREATE TABLE IF NOT EXISTS public.trip_train_segments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  itinerary_day_id UUID REFERENCES public.itinerary_days(id) ON DELETE SET NULL,
  origin_city TEXT NOT NULL,
  origin_station TEXT NOT NULL,
  origin_station_alternatives TEXT[],
  destination_city TEXT NOT NULL,
  destination_station TEXT NOT NULL,
  destination_station_alternatives TEXT[],
  departure_date DATE,
  departure_time TIME,
  arrival_time TIME,
  duration_minutes INTEGER,
  train_type TEXT,
  booking_url TEXT,
  price_estimate NUMERIC(10,2),
  currency TEXT DEFAULT 'EUR',
  station_guidance TEXT,
  station_warning TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trip_lodging_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_train_segments ENABLE ROW LEVEL SECURITY;

-- RLS policies for lodging suggestions (via trip ownership)
CREATE POLICY "Users can view lodging suggestions for their trips" 
ON public.trip_lodging_suggestions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.trips 
    WHERE trips.id = trip_lodging_suggestions.trip_id 
    AND trips.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert lodging suggestions for their trips" 
ON public.trip_lodging_suggestions 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.trips 
    WHERE trips.id = trip_lodging_suggestions.trip_id 
    AND trips.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete lodging suggestions for their trips" 
ON public.trip_lodging_suggestions 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.trips 
    WHERE trips.id = trip_lodging_suggestions.trip_id 
    AND trips.user_id = auth.uid()
  )
);

-- RLS policies for train segments
CREATE POLICY "Users can view train segments for their trips" 
ON public.trip_train_segments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.trips 
    WHERE trips.id = trip_train_segments.trip_id 
    AND trips.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert train segments for their trips" 
ON public.trip_train_segments 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.trips 
    WHERE trips.id = trip_train_segments.trip_id 
    AND trips.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete train segments for their trips" 
ON public.trip_train_segments 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.trips 
    WHERE trips.id = trip_train_segments.trip_id 
    AND trips.user_id = auth.uid()
  )
);

-- Add lodging preference to trips table
ALTER TABLE public.trips 
ADD COLUMN IF NOT EXISTS has_lodging_booked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS lodging_address TEXT,
ADD COLUMN IF NOT EXISTS provider_preferences TEXT[] DEFAULT ARRAY['any']::TEXT[];