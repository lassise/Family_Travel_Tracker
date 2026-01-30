-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom enum type
DO $$ BEGIN
  CREATE TYPE app_role AS ENUM ('owner', 'admin', 'member');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =====================
-- PROFILES TABLE - Add missing columns if table exists
-- =====================
DO $$ BEGIN
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS home_country text;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS distance_unit text DEFAULT 'miles';
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS home_airports jsonb DEFAULT '[]'::jsonb;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS linked_family_member_id uuid;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;
EXCEPTION WHEN OTHERS THEN null;
END $$;

-- =====================
-- FAMILY MEMBERS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.family_members (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  name text NOT NULL,
  role text NOT NULL,
  avatar text NOT NULL,
  color text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own family members" ON public.family_members;
DROP POLICY IF EXISTS "Users can insert own family members" ON public.family_members;
DROP POLICY IF EXISTS "Users can update own family members" ON public.family_members;
DROP POLICY IF EXISTS "Users can delete own family members" ON public.family_members;

CREATE POLICY "Users can view own family members" ON public.family_members FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own family members" ON public.family_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own family members" ON public.family_members FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own family members" ON public.family_members FOR DELETE USING (auth.uid() = user_id);

-- Add FK for profiles.linked_family_member_id (ignore if exists)
DO $$ BEGIN
  ALTER TABLE public.profiles ADD CONSTRAINT profiles_linked_family_member_id_fkey 
    FOREIGN KEY (linked_family_member_id) REFERENCES public.family_members(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- =====================
-- COUNTRIES TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.countries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  name text NOT NULL,
  flag text NOT NULL,
  continent text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own countries" ON public.countries;
DROP POLICY IF EXISTS "Users can insert own countries" ON public.countries;
DROP POLICY IF EXISTS "Users can update own countries" ON public.countries;
DROP POLICY IF EXISTS "Users can delete own countries" ON public.countries;

CREATE POLICY "Users can view own countries" ON public.countries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own countries" ON public.countries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own countries" ON public.countries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own countries" ON public.countries FOR DELETE USING (auth.uid() = user_id);

-- =====================
-- COUNTRY VISITS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.country_visits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  country_id uuid REFERENCES public.countries(id) ON DELETE CASCADE,
  family_member_id uuid REFERENCES public.family_members(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.country_visits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own country visits" ON public.country_visits;
DROP POLICY IF EXISTS "Users can insert own country visits" ON public.country_visits;
DROP POLICY IF EXISTS "Users can delete own country visits" ON public.country_visits;

CREATE POLICY "Users can view own country visits" ON public.country_visits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own country visits" ON public.country_visits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own country visits" ON public.country_visits FOR DELETE USING (auth.uid() = user_id);

-- =====================
-- COUNTRY VISIT DETAILS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.country_visit_details (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  country_id uuid NOT NULL REFERENCES public.countries(id) ON DELETE CASCADE,
  visit_date date,
  end_date date,
  number_of_days integer DEFAULT 1,
  is_approximate boolean DEFAULT false,
  approximate_month integer,
  approximate_year integer,
  trip_name text,
  trip_group_id uuid,
  highlight text,
  why_it_mattered text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.country_visit_details ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own visit details" ON public.country_visit_details;
DROP POLICY IF EXISTS "Users can insert own visit details" ON public.country_visit_details;
DROP POLICY IF EXISTS "Users can update own visit details" ON public.country_visit_details;
DROP POLICY IF EXISTS "Users can delete own visit details" ON public.country_visit_details;

CREATE POLICY "Users can view own visit details" ON public.country_visit_details FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own visit details" ON public.country_visit_details FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own visit details" ON public.country_visit_details FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own visit details" ON public.country_visit_details FOR DELETE USING (auth.uid() = user_id);

-- =====================
-- VISIT FAMILY MEMBERS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.visit_family_members (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visit_id uuid NOT NULL REFERENCES public.country_visit_details(id) ON DELETE CASCADE,
  family_member_id uuid NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.visit_family_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own visit family members" ON public.visit_family_members;
DROP POLICY IF EXISTS "Users can insert own visit family members" ON public.visit_family_members;
DROP POLICY IF EXISTS "Users can delete own visit family members" ON public.visit_family_members;

CREATE POLICY "Users can view own visit family members" ON public.visit_family_members FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own visit family members" ON public.visit_family_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own visit family members" ON public.visit_family_members FOR DELETE USING (auth.uid() = user_id);

-- =====================
-- STATE VISITS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.state_visits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  country_id uuid REFERENCES public.countries(id) ON DELETE SET NULL,
  family_member_id uuid REFERENCES public.family_members(id) ON DELETE CASCADE,
  country_code text NOT NULL,
  state_code text NOT NULL,
  state_name text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.state_visits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own state visits" ON public.state_visits;
DROP POLICY IF EXISTS "Users can insert own state visits" ON public.state_visits;
DROP POLICY IF EXISTS "Users can delete own state visits" ON public.state_visits;

CREATE POLICY "Users can view own state visits" ON public.state_visits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own state visits" ON public.state_visits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own state visits" ON public.state_visits FOR DELETE USING (auth.uid() = user_id);

-- =====================
-- COUNTRY WISHLIST TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.country_wishlist (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  country_id uuid REFERENCES public.countries(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.country_wishlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own wishlist" ON public.country_wishlist;
DROP POLICY IF EXISTS "Users can insert own wishlist" ON public.country_wishlist;
DROP POLICY IF EXISTS "Users can delete own wishlist" ON public.country_wishlist;

CREATE POLICY "Users can view own wishlist" ON public.country_wishlist FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own wishlist" ON public.country_wishlist FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own wishlist" ON public.country_wishlist FOR DELETE USING (auth.uid() = user_id);

-- =====================
-- FAMILY GROUPS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.family_groups (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  invite_code text DEFAULT encode(gen_random_bytes(6), 'hex'),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.family_groups ENABLE ROW LEVEL SECURITY;

-- =====================
-- FAMILY GROUP MEMBERS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.family_group_members (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_group_id uuid NOT NULL REFERENCES public.family_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'member',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(family_group_id, user_id)
);

ALTER TABLE public.family_group_members ENABLE ROW LEVEL SECURITY;

-- =====================
-- TRIPS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.trips (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  family_group_id uuid REFERENCES public.family_groups(id) ON DELETE SET NULL,
  title text NOT NULL,
  destination text,
  start_date date,
  end_date date,
  status text DEFAULT 'planning',
  trip_type text,
  cover_image text,
  budget_total numeric,
  currency text DEFAULT 'USD',
  pace_preference text,
  interests text[],
  kids_ages integer[],
  has_lodging_booked boolean DEFAULT false,
  lodging_address text,
  needs_wheelchair_access boolean DEFAULT false,
  has_stroller boolean DEFAULT false,
  provider_preferences text[] DEFAULT ARRAY['any'],
  notes text,
  archived boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can create trips" ON public.trips;
DROP POLICY IF EXISTS "Users can update own trips" ON public.trips;
DROP POLICY IF EXISTS "Users can delete own trips" ON public.trips;
DROP POLICY IF EXISTS "Users can view accessible trips" ON public.trips;

CREATE POLICY "Users can create trips" ON public.trips FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own trips" ON public.trips FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own trips" ON public.trips FOR DELETE USING (auth.uid() = user_id);

-- =====================
-- TRIP COUNTRIES TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.trip_countries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  country_code text NOT NULL,
  country_name text NOT NULL,
  order_index integer DEFAULT 0,
  start_date date,
  end_date date,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.trip_countries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own trip countries" ON public.trip_countries;
DROP POLICY IF EXISTS "Users can insert trip countries for their trips" ON public.trip_countries;
DROP POLICY IF EXISTS "Users can update their own trip countries" ON public.trip_countries;
DROP POLICY IF EXISTS "Users can delete their own trip countries" ON public.trip_countries;

CREATE POLICY "Users can view their own trip countries" ON public.trip_countries FOR SELECT 
  USING (EXISTS (SELECT 1 FROM trips t WHERE t.id = trip_countries.trip_id AND t.user_id = auth.uid()));
CREATE POLICY "Users can insert trip countries for their trips" ON public.trip_countries FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM trips t WHERE t.id = trip_countries.trip_id AND t.user_id = auth.uid()));
CREATE POLICY "Users can update their own trip countries" ON public.trip_countries FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM trips t WHERE t.id = trip_countries.trip_id AND t.user_id = auth.uid()));
CREATE POLICY "Users can delete their own trip countries" ON public.trip_countries FOR DELETE 
  USING (EXISTS (SELECT 1 FROM trips t WHERE t.id = trip_countries.trip_id AND t.user_id = auth.uid()));

-- =====================
-- TRIP COLLABORATORS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.trip_collaborators (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  invited_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invited_email text,
  invited_email_hash text,
  permission text NOT NULL DEFAULT 'view',
  status text NOT NULL DEFAULT 'pending',
  accepted_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.trip_collaborators ENABLE ROW LEVEL SECURITY;

-- =====================
-- ITINERARY DAYS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.itinerary_days (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  day_number integer NOT NULL,
  date date,
  title text,
  notes text,
  plan_b text,
  weather_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.itinerary_days ENABLE ROW LEVEL SECURITY;

-- =====================
-- ITINERARY ITEMS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.itinerary_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  itinerary_day_id uuid NOT NULL REFERENCES public.itinerary_days(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  location_name text,
  location_address text,
  latitude numeric,
  longitude numeric,
  start_time time,
  end_time time,
  time_slot text,
  duration_minutes integer,
  category text,
  cost_estimate numeric,
  is_kid_friendly boolean DEFAULT true,
  is_stroller_friendly boolean,
  is_wheelchair_accessible boolean,
  requires_reservation boolean DEFAULT false,
  reservation_info text,
  booking_url text,
  provider_type text,
  why_it_fits text,
  best_time_to_visit text,
  crowd_level text,
  seasonal_notes text,
  rating numeric,
  review_count integer,
  distance_from_previous numeric,
  distance_unit text DEFAULT 'km',
  travel_time_minutes integer,
  transport_mode text,
  transport_booking_url text,
  transport_station_notes text,
  recommended_transit_mode text,
  transit_details text,
  accessibility_notes text,
  stroller_notes text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.itinerary_items ENABLE ROW LEVEL SECURITY;

-- =====================
-- BOOKINGS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  booking_type text NOT NULL,
  title text NOT NULL,
  confirmation_number text,
  provider text,
  location_name text,
  location_address text,
  latitude numeric,
  longitude numeric,
  check_in timestamp with time zone,
  check_out timestamp with time zone,
  cost numeric,
  currency text DEFAULT 'USD',
  notes text,
  attachment_urls text[],
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- =====================
-- EXPENSES TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  category text NOT NULL,
  description text NOT NULL,
  amount numeric NOT NULL,
  currency text DEFAULT 'USD',
  paid_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  expense_date date,
  receipt_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- =====================
-- PACKING LISTS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.packing_lists (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Main List',
  template_type text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.packing_lists ENABLE ROW LEVEL SECURITY;

-- =====================
-- PACKING ITEMS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.packing_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  packing_list_id uuid NOT NULL REFERENCES public.packing_lists(id) ON DELETE CASCADE,
  item_name text NOT NULL,
  category text,
  quantity integer DEFAULT 1,
  is_packed boolean DEFAULT false,
  assigned_to text,
  notes text,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.packing_items ENABLE ROW LEVEL SECURITY;

-- =====================
-- TRIP EMERGENCY INFO TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.trip_emergency_info (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  emergency_number text,
  police_number text,
  hospital_name text,
  hospital_address text,
  hospital_phone text,
  pharmacy_name text,
  pharmacy_address text,
  embassy_info text,
  insurance_info text,
  custom_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.trip_emergency_info ENABLE ROW LEVEL SECURITY;

-- =====================
-- TRIP NOTES TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.trip_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  itinerary_day_id uuid REFERENCES public.itinerary_days(id) ON DELETE CASCADE,
  itinerary_item_id uuid REFERENCES public.itinerary_items(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.trip_notes ENABLE ROW LEVEL SECURITY;

-- =====================
-- TRAVEL PHOTOS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.travel_photos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  country_id uuid REFERENCES public.countries(id) ON DELETE SET NULL,
  trip_id uuid REFERENCES public.trips(id) ON DELETE SET NULL,
  photo_url text NOT NULL,
  caption text,
  taken_at date,
  is_shareable boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.travel_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own photos" ON public.travel_photos;
DROP POLICY IF EXISTS "Users can insert their own photos" ON public.travel_photos;
DROP POLICY IF EXISTS "Users can update their own photos" ON public.travel_photos;
DROP POLICY IF EXISTS "Users can delete their own photos" ON public.travel_photos;

CREATE POLICY "Users can view their own photos" ON public.travel_photos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own photos" ON public.travel_photos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own photos" ON public.travel_photos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own photos" ON public.travel_photos FOR DELETE USING (auth.uid() = user_id);

-- =====================
-- TRAVEL PREFERENCES TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.travel_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  liked_countries text[] DEFAULT '{}',
  disliked_countries text[] DEFAULT '{}',
  travel_style text[] DEFAULT '{}',
  budget_preference text DEFAULT 'moderate',
  pace_preference text DEFAULT 'moderate',
  accommodation_preference text[] DEFAULT '{}',
  interests text[] DEFAULT '{}',
  avoid_preferences text[] DEFAULT '{}',
  travel_with text DEFAULT 'family',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.travel_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own preferences" ON public.travel_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON public.travel_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON public.travel_preferences;
DROP POLICY IF EXISTS "Users can delete own preferences" ON public.travel_preferences;

CREATE POLICY "Users can view own preferences" ON public.travel_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own preferences" ON public.travel_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences" ON public.travel_preferences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own preferences" ON public.travel_preferences FOR DELETE USING (auth.uid() = user_id);

-- =====================
-- TRAVEL PROFILES TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.travel_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_active boolean DEFAULT false,
  is_default boolean DEFAULT false,
  domestic_vs_international text DEFAULT 'both',
  trip_length_min integer DEFAULT 1,
  trip_length_max integer DEFAULT 14,
  prefer_nonstop boolean DEFAULT true,
  max_stops integer DEFAULT 1,
  preferred_seat_types text[] DEFAULT '{}',
  preferred_seat_features text[] DEFAULT '{}',
  pace text DEFAULT 'moderate',
  budget_level text DEFAULT 'moderate',
  kid_friendly_priority text DEFAULT 'moderate',
  custom_preferences jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.travel_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own travel profiles" ON public.travel_profiles;
DROP POLICY IF EXISTS "Users can create their own travel profiles" ON public.travel_profiles;
DROP POLICY IF EXISTS "Users can update their own travel profiles" ON public.travel_profiles;
DROP POLICY IF EXISTS "Users can delete their own travel profiles" ON public.travel_profiles;

CREATE POLICY "Users can view their own travel profiles" ON public.travel_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own travel profiles" ON public.travel_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own travel profiles" ON public.travel_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own travel profiles" ON public.travel_profiles FOR DELETE USING (auth.uid() = user_id);

-- =====================
-- TRAVELER PROFILES TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.traveler_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  traveler_type text NOT NULL DEFAULT 'adult',
  date_of_birth date,
  passport_country text,
  passport_expiry date,
  known_traveler_number text,
  redress_number text,
  seat_preference text,
  meal_preference text,
  special_assistance text[],
  frequent_flyer_programs jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.traveler_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own traveler profiles" ON public.traveler_profiles;
DROP POLICY IF EXISTS "Users can create their own traveler profiles" ON public.traveler_profiles;
DROP POLICY IF EXISTS "Users can update their own traveler profiles" ON public.traveler_profiles;
DROP POLICY IF EXISTS "Users can delete their own traveler profiles" ON public.traveler_profiles;

CREATE POLICY "Users can view their own traveler profiles" ON public.traveler_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own traveler profiles" ON public.traveler_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own traveler profiles" ON public.traveler_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own traveler profiles" ON public.traveler_profiles FOR DELETE USING (auth.uid() = user_id);

-- =====================
-- FLIGHT PREFERENCES TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.flight_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  home_airports jsonb DEFAULT '[]',
  cabin_class text DEFAULT 'economy',
  seat_preference text DEFAULT 'window',
  max_stops integer DEFAULT 0,
  prefer_nonstop boolean DEFAULT true,
  max_layover_hours integer DEFAULT 4,
  min_connection_minutes integer DEFAULT 60,
  max_total_travel_hours integer DEFAULT 24,
  red_eye_allowed boolean DEFAULT false,
  family_mode boolean DEFAULT false,
  family_min_connection_minutes integer DEFAULT 90,
  willing_to_drive_further boolean DEFAULT true,
  max_extra_drive_minutes integer DEFAULT 60,
  min_savings_for_further_airport integer DEFAULT 200,
  default_checked_bags integer DEFAULT 0,
  carry_on_only boolean DEFAULT false,
  needs_window_for_car_seat boolean DEFAULT false,
  legroom_preference text DEFAULT 'nice_to_have',
  min_legroom_inches integer,
  usb_charging text DEFAULT 'nice_to_have',
  entertainment_seatback text DEFAULT 'nice_to_have',
  entertainment_mobile text DEFAULT 'nice_to_have',
  search_mode text DEFAULT 'cash',
  preferred_departure_times text[] DEFAULT '{}',
  preferred_airlines text[] DEFAULT '{}',
  avoided_airlines text[] DEFAULT '{}',
  preferred_alliances text[] DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.flight_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own flight preferences" ON public.flight_preferences;
DROP POLICY IF EXISTS "Users can create their own flight preferences" ON public.flight_preferences;
DROP POLICY IF EXISTS "Users can update their own flight preferences" ON public.flight_preferences;
DROP POLICY IF EXISTS "Users can delete their own flight preferences" ON public.flight_preferences;

CREATE POLICY "Users can view their own flight preferences" ON public.flight_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own flight preferences" ON public.flight_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own flight preferences" ON public.flight_preferences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own flight preferences" ON public.flight_preferences FOR DELETE USING (auth.uid() = user_id);

-- =====================
-- SAVED FLIGHTS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.saved_flights (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  origin text NOT NULL,
  destination text NOT NULL,
  outbound_date date,
  return_date date,
  trip_type text DEFAULT 'roundtrip',
  cabin_class text DEFAULT 'economy',
  passengers integer DEFAULT 1,
  target_price numeric,
  last_price numeric,
  price_alert_enabled boolean DEFAULT true,
  alert_email text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_flights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own saved flights" ON public.saved_flights;
DROP POLICY IF EXISTS "Users can create their own saved flights" ON public.saved_flights;
DROP POLICY IF EXISTS "Users can update their own saved flights" ON public.saved_flights;
DROP POLICY IF EXISTS "Users can delete their own saved flights" ON public.saved_flights;

CREATE POLICY "Users can view their own saved flights" ON public.saved_flights FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own saved flights" ON public.saved_flights FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own saved flights" ON public.saved_flights FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own saved flights" ON public.saved_flights FOR DELETE USING (auth.uid() = user_id);

-- =====================
-- SAVED PLACES TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.saved_places (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  trip_id uuid REFERENCES public.trips(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  location_address text,
  latitude numeric,
  longitude numeric,
  category text,
  is_kid_friendly boolean DEFAULT true,
  rating integer,
  notes text,
  source text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_places ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own saved places" ON public.saved_places;

CREATE POLICY "Users can manage own saved places" ON public.saved_places FOR ALL USING (auth.uid() = user_id);

-- =====================
-- TRAVEL GOALS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.travel_goals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  title text NOT NULL,
  goal_type text NOT NULL DEFAULT 'countries',
  target_count integer NOT NULL DEFAULT 1,
  deadline date,
  is_completed boolean NOT NULL DEFAULT false,
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.travel_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own goals" ON public.travel_goals;
DROP POLICY IF EXISTS "Users can create their own goals" ON public.travel_goals;
DROP POLICY IF EXISTS "Users can update their own goals" ON public.travel_goals;
DROP POLICY IF EXISTS "Users can delete their own goals" ON public.travel_goals;

CREATE POLICY "Users can view their own goals" ON public.travel_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own goals" ON public.travel_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own goals" ON public.travel_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own goals" ON public.travel_goals FOR DELETE USING (auth.uid() = user_id);

-- =====================
-- USER ACHIEVEMENTS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  achievement_key text NOT NULL,
  earned_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_key)
);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own achievements" ON public.user_achievements;
DROP POLICY IF EXISTS "Users can insert their own achievements" ON public.user_achievements;

CREATE POLICY "Users can view their own achievements" ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own achievements" ON public.user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================
-- CITY VISITS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.city_visits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  country_id uuid NOT NULL REFERENCES public.countries(id) ON DELETE CASCADE,
  city_name text NOT NULL,
  visit_date date,
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.city_visits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own city visits" ON public.city_visits;
DROP POLICY IF EXISTS "Users can insert own city visits" ON public.city_visits;
DROP POLICY IF EXISTS "Users can delete own city visits" ON public.city_visits;

CREATE POLICY "Users can view own city visits" ON public.city_visits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own city visits" ON public.city_visits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own city visits" ON public.city_visits FOR DELETE USING (auth.uid() = user_id);

-- =====================
-- TRAVEL SETTINGS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.travel_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  home_country text NOT NULL DEFAULT '',
  home_country_code text NOT NULL DEFAULT '',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.travel_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own settings" ON public.travel_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON public.travel_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON public.travel_settings;

CREATE POLICY "Users can view own settings" ON public.travel_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON public.travel_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON public.travel_settings FOR UPDATE USING (auth.uid() = user_id);

-- =====================
-- SHARE PROFILES TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.share_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  share_token text NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  dashboard_share_token text DEFAULT encode(gen_random_bytes(16), 'hex'),
  is_public boolean DEFAULT false,
  show_stats boolean DEFAULT true,
  show_map boolean DEFAULT true,
  show_countries boolean DEFAULT true,
  show_cities boolean DEFAULT true,
  show_photos boolean DEFAULT true,
  show_wishlist boolean DEFAULT false,
  show_achievements boolean DEFAULT true,
  show_streaks boolean DEFAULT false,
  show_timeline boolean DEFAULT true,
  show_family_members boolean DEFAULT false,
  show_travel_dna boolean DEFAULT false,
  show_heatmap boolean DEFAULT false,
  allow_downloads boolean DEFAULT false,
  custom_headline text,
  theme_color text DEFAULT 'default',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.share_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own share profile" ON public.share_profiles;

CREATE POLICY "Users can manage their own share profile" ON public.share_profiles FOR ALL 
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =====================
-- SHARE LINKS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.share_links (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_user_id uuid NOT NULL,
  token text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  include_stats boolean NOT NULL DEFAULT true,
  include_countries boolean NOT NULL DEFAULT true,
  include_memories boolean NOT NULL DEFAULT true,
  last_accessed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(token)
);

ALTER TABLE public.share_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own share links" ON public.share_links;
DROP POLICY IF EXISTS "Users can insert own share links" ON public.share_links;
DROP POLICY IF EXISTS "Users can update own share links" ON public.share_links;
DROP POLICY IF EXISTS "Users can delete own share links" ON public.share_links;

CREATE POLICY "Users can view own share links" ON public.share_links FOR SELECT USING (auth.uid() = owner_user_id);
CREATE POLICY "Users can insert own share links" ON public.share_links FOR INSERT WITH CHECK (auth.uid() = owner_user_id);
CREATE POLICY "Users can update own share links" ON public.share_links FOR UPDATE USING (auth.uid() = owner_user_id) WITH CHECK (auth.uid() = owner_user_id);
CREATE POLICY "Users can delete own share links" ON public.share_links FOR DELETE USING (auth.uid() = owner_user_id);

-- =====================
-- API RATE LIMITS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  function_name text NOT NULL,
  request_count integer NOT NULL DEFAULT 1,
  window_start timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, function_name, window_start)
);

ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own rate limits" ON public.api_rate_limits;
DROP POLICY IF EXISTS "Service role can manage rate limits" ON public.api_rate_limits;

CREATE POLICY "Users can view own rate limits" ON public.api_rate_limits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage rate limits" ON public.api_rate_limits FOR ALL USING (true) WITH CHECK (true);

-- =====================
-- TRIP LODGING SUGGESTIONS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.trip_lodging_suggestions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  name text NOT NULL,
  lodging_type text,
  description text,
  address text,
  latitude numeric,
  longitude numeric,
  price_per_night numeric,
  currency text,
  rating numeric,
  review_count integer,
  amenities text[],
  is_kid_friendly boolean,
  distance_from_center text,
  why_recommended text,
  booking_url text,
  image_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.trip_lodging_suggestions ENABLE ROW LEVEL SECURITY;

-- =====================
-- DATABASE FUNCTIONS
-- =====================

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Check group membership
CREATE OR REPLACE FUNCTION public.is_group_member(_user_id uuid, _group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.family_group_members
    WHERE user_id = _user_id AND family_group_id = _group_id
  );
$$;

-- Check group role
CREATE OR REPLACE FUNCTION public.has_group_role(_user_id uuid, _group_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.family_group_members
    WHERE user_id = _user_id AND family_group_id = _group_id AND role = _role
  );
$$;

-- Trip collaborator check
CREATE OR REPLACE FUNCTION public.is_trip_collaborator(_user_id uuid, _trip_id uuid, _min_permission text DEFAULT 'view')
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.trip_collaborators tc
    LEFT JOIN public.profiles p ON p.id = _user_id
    WHERE tc.trip_id = _trip_id
    AND tc.status = 'accepted'
    AND (tc.user_id = _user_id OR tc.invited_email = p.email)
    AND (
      CASE _min_permission
        WHEN 'view' THEN tc.permission IN ('view', 'comment', 'edit')
        WHEN 'comment' THEN tc.permission IN ('comment', 'edit')
        WHEN 'edit' THEN tc.permission = 'edit'
        ELSE false
      END
    )
  );
$$;

-- Hash email function for trip collaboration
CREATE OR REPLACE FUNCTION public.hash_email(email text)
RETURNS text
LANGUAGE sql
IMMUTABLE PARALLEL SAFE
SET search_path = public
AS $$
  SELECT encode(
    sha256(
      (lower(trim(email)) || 'trip_collab_salt_v1')::bytea
    ),
    'hex'
  )
$$;

-- Handle new user profile
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, onboarding_completed)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
    NEW.raw_user_meta_data ->> 'avatar_url',
    false
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url);

  RETURN NEW;
END;
$$;

-- Cleanup old rate limits
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.api_rate_limits
  WHERE window_start < now() - INTERVAL '2 hours';
END;
$$;

-- Ensure single active profile
CREATE OR REPLACE FUNCTION public.ensure_single_active_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_active = true THEN
    UPDATE public.travel_profiles
    SET is_active = false
    WHERE user_id = NEW.user_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

-- Get shared dashboard data
CREATE OR REPLACE FUNCTION public.get_shared_dashboard(token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
declare
  v_link public.share_links%rowtype;
  v_profile public.profiles%rowtype;
  v_payload jsonb;
begin
  IF token IS NULL OR length(token) != 32 OR token !~ '^[a-f0-9]+$' THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_link
  FROM public.share_links sl
  WHERE sl.token = token AND sl.is_active = true
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  UPDATE public.share_links SET last_accessed_at = now() WHERE id = v_link.id;

  SELECT * INTO v_profile FROM public.profiles p WHERE p.id = v_link.owner_user_id LIMIT 1;

  v_payload := jsonb_build_object(
    'owner', jsonb_build_object(
      'user_id', v_link.owner_user_id,
      'full_name', v_profile.full_name,
      'home_country', v_profile.home_country
    ),
    'share', jsonb_build_object(
      'token', v_link.token,
      'include_stats', v_link.include_stats,
      'include_countries', v_link.include_countries,
      'include_memories', v_link.include_memories
    ),
    'countries', (
      SELECT COALESCE(jsonb_agg(to_jsonb(c) ORDER BY c.name), '[]'::jsonb)
      FROM (SELECT id, name, flag, continent FROM public.countries WHERE user_id = v_link.owner_user_id) c
    ),
    'visited_country_ids', (
      SELECT COALESCE(jsonb_agg(DISTINCT cv.country_id), '[]'::jsonb)
      FROM public.country_visits cv WHERE cv.user_id = v_link.owner_user_id AND cv.country_id IS NOT NULL
    ),
    'visit_details', (
      SELECT COALESCE(jsonb_agg(to_jsonb(vd) ORDER BY vd.visit_date DESC NULLS LAST), '[]'::jsonb)
      FROM (SELECT id, country_id, visit_date, end_date, is_approximate, approximate_month, approximate_year, trip_name, highlight FROM public.country_visit_details WHERE user_id = v_link.owner_user_id) vd
    ),
    'state_visits', (
      SELECT COALESCE(jsonb_agg(to_jsonb(sv)), '[]'::jsonb)
      FROM (SELECT id, country_code, state_code, state_name FROM public.state_visits WHERE user_id = v_link.owner_user_id) sv
    ),
    'photos', (
      SELECT CASE WHEN v_link.include_memories THEN
        (SELECT COALESCE(jsonb_agg(to_jsonb(tp) ORDER BY tp.taken_at DESC NULLS LAST), '[]'::jsonb) FROM (SELECT id, country_id, taken_at, photo_url, caption FROM public.travel_photos WHERE user_id = v_link.owner_user_id AND is_shareable = true) tp)
      ELSE '[]'::jsonb END
    )
  );

  RETURN v_payload;
END;
$$;

-- Create trigger for new user profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

-- Create storage bucket for travel photos
INSERT INTO storage.buckets (id, name, public) VALUES ('travel-photos', 'travel-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for travel photos
DROP POLICY IF EXISTS "Users can upload own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view travel photos" ON storage.objects;

CREATE POLICY "Users can upload own photos" ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'travel-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update own photos" ON storage.objects FOR UPDATE 
  USING (bucket_id = 'travel-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own photos" ON storage.objects FOR DELETE 
  USING (bucket_id = 'travel-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Public can view travel photos" ON storage.objects FOR SELECT 
  USING (bucket_id = 'travel-photos');

-- Add trips view policy with collaborators
DROP POLICY IF EXISTS "Users can view accessible trips" ON public.trips;
CREATE POLICY "Users can view accessible trips" ON public.trips FOR SELECT 
  USING ((auth.uid() = user_id) OR is_group_member(auth.uid(), family_group_id) OR is_trip_collaborator(auth.uid(), id, 'view'));