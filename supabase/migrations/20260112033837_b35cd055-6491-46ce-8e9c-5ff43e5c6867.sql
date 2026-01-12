-- Add linked_family_member_id to profiles to link authenticated user to their family member
ALTER TABLE public.profiles 
ADD COLUMN linked_family_member_id UUID REFERENCES public.family_members(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX idx_profiles_linked_family_member ON public.profiles(linked_family_member_id);

-- Add home_airports to profiles for flight planning preferences
ALTER TABLE public.profiles
ADD COLUMN home_airports JSONB DEFAULT '[]'::jsonb;

-- Create flight_preferences table for detailed flight search preferences
CREATE TABLE public.flight_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  preferred_airlines TEXT[] DEFAULT '{}',
  avoided_airlines TEXT[] DEFAULT '{}',
  preferred_departure_times TEXT[] DEFAULT '{}', -- 'early_morning', 'morning', 'afternoon', 'evening', 'red_eye'
  max_stops INTEGER DEFAULT 2,
  prefer_nonstop BOOLEAN DEFAULT false,
  seat_preference TEXT, -- 'window', 'aisle', 'middle'
  class_preference TEXT DEFAULT 'economy', -- 'economy', 'premium_economy', 'business', 'first'
  max_layover_hours INTEGER DEFAULT 4,
  willing_to_drive_further BOOLEAN DEFAULT true,
  max_extra_drive_minutes INTEGER DEFAULT 60,
  min_savings_for_further_airport INTEGER DEFAULT 200, -- minimum savings in dollars to justify further airport
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.flight_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies for flight_preferences
CREATE POLICY "Users can view their own flight preferences" 
ON public.flight_preferences 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own flight preferences" 
ON public.flight_preferences 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own flight preferences" 
ON public.flight_preferences 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own flight preferences" 
ON public.flight_preferences 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_flight_preferences_updated_at
BEFORE UPDATE ON public.flight_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();