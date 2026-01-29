-- =====================================================
-- LOVABLE CLOUD TO SUPABASE MIGRATION SCRIPT
-- Generated for: Family Travel Tracker
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CUSTOM TYPES
-- =====================================================
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'member');

-- =====================================================
-- TABLES
-- =====================================================

-- Profiles table (linked to auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    home_country TEXT,
    distance_unit TEXT DEFAULT 'miles',
    onboarding_completed BOOLEAN DEFAULT false,
    linked_family_member_id UUID,
    home_airports JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Family members
CREATE TABLE public.family_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    avatar TEXT NOT NULL,
    color TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Countries
CREATE TABLE public.countries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    name TEXT NOT NULL,
    flag TEXT NOT NULL,
    continent TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Country visits
CREATE TABLE public.country_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    country_id UUID REFERENCES public.countries(id) ON DELETE CASCADE,
    family_member_id UUID REFERENCES public.family_members(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Country visit details
CREATE TABLE public.country_visit_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    country_id UUID NOT NULL REFERENCES public.countries(id) ON DELETE CASCADE,
    visit_date DATE,
    end_date DATE,
    number_of_days INTEGER DEFAULT 1,
    is_approximate BOOLEAN DEFAULT false,
    approximate_month INTEGER,
    approximate_year INTEGER,
    trip_name TEXT,
    trip_group_id UUID,
    highlight TEXT,
    why_it_mattered TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Visit family members (junction table)
CREATE TABLE public.visit_family_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id UUID NOT NULL REFERENCES public.country_visit_details(id) ON DELETE CASCADE,
    family_member_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- State visits
CREATE TABLE public.state_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    country_id UUID REFERENCES public.countries(id) ON DELETE SET NULL,
    family_member_id UUID REFERENCES public.family_members(id) ON DELETE CASCADE,
    country_code TEXT NOT NULL,
    state_code TEXT NOT NULL,
    state_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Country wishlist
CREATE TABLE public.country_wishlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    country_id UUID REFERENCES public.countries(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(country_id)
);

-- Travel photos
CREATE TABLE public.travel_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    country_id UUID REFERENCES public.countries(id) ON DELETE SET NULL,
    trip_id UUID,
    photo_url TEXT NOT NULL,
    caption TEXT,
    taken_at DATE,
    is_shareable BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Travel preferences
CREATE TABLE public.travel_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    liked_countries TEXT[] DEFAULT '{}',
    disliked_countries TEXT[] DEFAULT '{}',
    travel_style TEXT[] DEFAULT '{}',
    budget_preference TEXT DEFAULT 'moderate',
    pace_preference TEXT DEFAULT 'moderate',
    accommodation_preference TEXT[] DEFAULT '{}',
    interests TEXT[] DEFAULT '{}',
    avoid_preferences TEXT[] DEFAULT '{}',
    travel_with TEXT DEFAULT 'family',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Travel profiles
CREATE TABLE public.travel_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT false,
    is_default BOOLEAN DEFAULT false,
    domestic_vs_international TEXT DEFAULT 'both',
    pace TEXT DEFAULT 'moderate',
    budget_level TEXT DEFAULT 'moderate',
    kid_friendly_priority TEXT DEFAULT 'moderate',
    trip_length_min INTEGER DEFAULT 1,
    trip_length_max INTEGER DEFAULT 14,
    prefer_nonstop BOOLEAN DEFAULT true,
    max_stops INTEGER DEFAULT 1,
    preferred_seat_types TEXT[] DEFAULT '{}',
    preferred_seat_features TEXT[] DEFAULT '{}',
    custom_preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Traveler profiles
CREATE TABLE public.traveler_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    traveler_type TEXT NOT NULL DEFAULT 'adult',
    date_of_birth DATE,
    passport_country TEXT,
    passport_expiry DATE,
    known_traveler_number TEXT,
    redress_number TEXT,
    seat_preference TEXT,
    meal_preference TEXT,
    special_assistance TEXT[],
    frequent_flyer_programs JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Share profiles
CREATE TABLE public.share_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    share_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
    dashboard_share_token TEXT DEFAULT encode(gen_random_bytes(16), 'hex'),
    is_public BOOLEAN DEFAULT false,
    show_stats BOOLEAN DEFAULT true,
    show_map BOOLEAN DEFAULT true,
    show_countries BOOLEAN DEFAULT true,
    show_cities BOOLEAN DEFAULT true,
    show_photos BOOLEAN DEFAULT true,
    show_wishlist BOOLEAN DEFAULT false,
    show_achievements BOOLEAN DEFAULT true,
    show_streaks BOOLEAN DEFAULT false,
    show_timeline BOOLEAN DEFAULT true,
    show_family_members BOOLEAN DEFAULT false,
    show_travel_dna BOOLEAN DEFAULT false,
    show_heatmap BOOLEAN DEFAULT false,
    allow_downloads BOOLEAN DEFAULT false,
    custom_headline TEXT,
    theme_color TEXT DEFAULT 'default',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Share links
CREATE TABLE public.share_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL,
    token TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    include_stats BOOLEAN NOT NULL DEFAULT true,
    include_countries BOOLEAN NOT NULL DEFAULT true,
    include_memories BOOLEAN NOT NULL DEFAULT true,
    last_accessed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Family groups
CREATE TABLE public.family_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    invite_code TEXT DEFAULT encode(gen_random_bytes(6), 'hex'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Family group members
CREATE TABLE public.family_group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_group_id UUID NOT NULL REFERENCES public.family_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role app_role NOT NULL DEFAULT 'member',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(family_group_id, user_id)
);

-- Trips
CREATE TABLE public.trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    family_group_id UUID REFERENCES public.family_groups(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    destination TEXT,
    start_date DATE,
    end_date DATE,
    status TEXT DEFAULT 'planning',
    trip_type TEXT,
    cover_image TEXT,
    budget_total NUMERIC,
    currency TEXT DEFAULT 'USD',
    kids_ages INTEGER[],
    pace_preference TEXT,
    interests TEXT[],
    notes TEXT,
    has_lodging_booked BOOLEAN DEFAULT false,
    lodging_address TEXT,
    needs_wheelchair_access BOOLEAN DEFAULT false,
    has_stroller BOOLEAN DEFAULT false,
    provider_preferences TEXT[] DEFAULT ARRAY['any'],
    archived BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trip countries
CREATE TABLE public.trip_countries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    country_code TEXT NOT NULL,
    country_name TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trip collaborators
CREATE TABLE public.trip_collaborators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    invited_email TEXT,
    invited_email_hash TEXT,
    permission TEXT NOT NULL DEFAULT 'view',
    status TEXT NOT NULL DEFAULT 'pending',
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trip emergency info
CREATE TABLE public.trip_emergency_info (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    emergency_number TEXT,
    police_number TEXT,
    hospital_name TEXT,
    hospital_address TEXT,
    hospital_phone TEXT,
    pharmacy_name TEXT,
    pharmacy_address TEXT,
    embassy_info TEXT,
    insurance_info TEXT,
    custom_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Itinerary days
CREATE TABLE public.itinerary_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL,
    date DATE,
    title TEXT,
    notes TEXT,
    weather_notes TEXT,
    plan_b TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Itinerary items
CREATE TABLE public.itinerary_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    itinerary_day_id UUID NOT NULL REFERENCES public.itinerary_days(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    location_name TEXT,
    location_address TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
    start_time TIME,
    end_time TIME,
    time_slot TEXT,
    duration_minutes INTEGER,
    category TEXT,
    cost_estimate NUMERIC,
    is_kid_friendly BOOLEAN DEFAULT true,
    is_stroller_friendly BOOLEAN,
    is_wheelchair_accessible BOOLEAN,
    requires_reservation BOOLEAN DEFAULT false,
    reservation_info TEXT,
    booking_url TEXT,
    provider_type TEXT,
    rating NUMERIC,
    review_count INTEGER,
    why_it_fits TEXT,
    best_time_to_visit TEXT,
    crowd_level TEXT,
    seasonal_notes TEXT,
    transport_mode TEXT,
    transport_booking_url TEXT,
    transport_station_notes TEXT,
    travel_time_minutes INTEGER,
    distance_from_previous NUMERIC,
    distance_unit TEXT DEFAULT 'km',
    recommended_transit_mode TEXT,
    transit_details TEXT,
    accessibility_notes TEXT,
    stroller_notes TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bookings
CREATE TABLE public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    booking_type TEXT NOT NULL,
    title TEXT NOT NULL,
    confirmation_number TEXT,
    provider TEXT,
    location_name TEXT,
    location_address TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
    check_in TIMESTAMPTZ,
    check_out TIMESTAMPTZ,
    cost NUMERIC,
    currency TEXT DEFAULT 'USD',
    notes TEXT,
    attachment_urls TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Expenses
CREATE TABLE public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'USD',
    expense_date DATE,
    paid_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    receipt_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Packing lists
CREATE TABLE public.packing_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'Main List',
    template_type TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Packing items
CREATE TABLE public.packing_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    packing_list_id UUID NOT NULL REFERENCES public.packing_lists(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    category TEXT,
    quantity INTEGER DEFAULT 1,
    is_packed BOOLEAN DEFAULT false,
    assigned_to TEXT,
    notes TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trip notes
CREATE TABLE public.trip_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    itinerary_day_id UUID REFERENCES public.itinerary_days(id) ON DELETE CASCADE,
    itinerary_item_id UUID REFERENCES public.itinerary_items(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Saved places
CREATE TABLE public.saved_places (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    location_address TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
    category TEXT,
    is_kid_friendly BOOLEAN DEFAULT true,
    rating INTEGER,
    notes TEXT,
    source TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Flight preferences
CREATE TABLE public.flight_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    home_airports JSONB DEFAULT '[]',
    cabin_class TEXT DEFAULT 'economy',
    seat_preference TEXT DEFAULT 'window',
    prefer_nonstop BOOLEAN DEFAULT true,
    max_stops INTEGER DEFAULT 0,
    max_layover_hours INTEGER DEFAULT 4,
    min_connection_minutes INTEGER DEFAULT 60,
    max_total_travel_hours INTEGER DEFAULT 24,
    red_eye_allowed BOOLEAN DEFAULT false,
    family_mode BOOLEAN DEFAULT false,
    family_min_connection_minutes INTEGER DEFAULT 90,
    willing_to_drive_further BOOLEAN DEFAULT true,
    max_extra_drive_minutes INTEGER DEFAULT 60,
    min_savings_for_further_airport INTEGER DEFAULT 200,
    carry_on_only BOOLEAN DEFAULT false,
    default_checked_bags INTEGER DEFAULT 0,
    needs_window_for_car_seat BOOLEAN DEFAULT false,
    legroom_preference TEXT DEFAULT 'nice_to_have',
    min_legroom_inches INTEGER,
    usb_charging TEXT DEFAULT 'nice_to_have',
    entertainment_seatback TEXT DEFAULT 'nice_to_have',
    entertainment_mobile TEXT DEFAULT 'nice_to_have',
    search_mode TEXT DEFAULT 'cash',
    preferred_airlines TEXT[] DEFAULT '{}',
    avoided_airlines TEXT[] DEFAULT '{}',
    preferred_alliances TEXT[] DEFAULT '{}',
    preferred_departure_times TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id)
);

-- Saved flights
CREATE TABLE public.saved_flights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    trip_type TEXT DEFAULT 'roundtrip',
    cabin_class TEXT DEFAULT 'economy',
    outbound_date DATE,
    return_date DATE,
    passengers INTEGER DEFAULT 1,
    target_price NUMERIC,
    last_price NUMERIC,
    price_alert_enabled BOOLEAN DEFAULT true,
    alert_email TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Travel goals
CREATE TABLE public.travel_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    goal_type TEXT NOT NULL DEFAULT 'countries',
    target_count INTEGER NOT NULL DEFAULT 1,
    deadline DATE,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User achievements
CREATE TABLE public.user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    achievement_key TEXT NOT NULL,
    earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, achievement_key)
);

-- City visits
CREATE TABLE public.city_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    country_id UUID NOT NULL REFERENCES public.countries(id) ON DELETE CASCADE,
    city_name TEXT NOT NULL,
    visit_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- API rate limits
CREATE TABLE public.api_rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    function_name TEXT NOT NULL,
    request_count INTEGER NOT NULL DEFAULT 1,
    window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, function_name, window_start)
);

-- Trip lodging suggestions
CREATE TABLE public.trip_lodging_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Add remaining columns based on your needs
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_countries_user_id ON public.countries(user_id);
CREATE INDEX idx_country_visits_user_id ON public.country_visits(user_id);
CREATE INDEX idx_country_visits_country_id ON public.country_visits(country_id);
CREATE INDEX idx_country_visit_details_user_id ON public.country_visit_details(user_id);
CREATE INDEX idx_country_visit_details_country_id ON public.country_visit_details(country_id);
CREATE INDEX idx_family_members_user_id ON public.family_members(user_id);
CREATE INDEX idx_trips_user_id ON public.trips(user_id);
CREATE INDEX idx_share_profiles_user_id ON public.share_profiles(user_id);
CREATE INDEX idx_share_profiles_dashboard_token ON public.share_profiles(dashboard_share_token);
CREATE INDEX idx_share_links_token ON public.share_links(token);
CREATE INDEX idx_share_links_owner ON public.share_links(owner_user_id);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

-- Check group membership
CREATE OR REPLACE FUNCTION public.is_group_member(_user_id uuid, _group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
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
SET search_path TO 'public'
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.family_group_members
        WHERE user_id = _user_id AND family_group_id = _group_id AND role = _role
    );
$$;

-- Check trip collaborator
CREATE OR REPLACE FUNCTION public.is_trip_collaborator(_user_id uuid, _trip_id uuid, _min_permission text DEFAULT 'view')
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
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

-- Hash email for privacy
CREATE OR REPLACE FUNCTION public.hash_email(email text)
RETURNS text
LANGUAGE sql
IMMUTABLE PARALLEL SAFE
SET search_path TO 'public'
AS $$
    SELECT encode(
        extensions.digest(
            lower(trim(email)) || 'trip_collab_salt_v1',
            'sha256'
        ),
        'hex'
    )
$$;

-- Rate limit check
CREATE OR REPLACE FUNCTION public.check_anonymous_rate_limit(lookup_key text, max_requests integer DEFAULT 100, window_seconds integer DEFAULT 60)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    current_window timestamp with time zone;
    current_count integer;
BEGIN
    current_window := date_trunc('minute', now());

    SELECT request_count INTO current_count
    FROM public.api_rate_limits
    WHERE function_name = lookup_key
        AND user_id = '00000000-0000-0000-0000-000000000000'::uuid
        AND window_start = current_window;

    IF current_count IS NULL THEN
        BEGIN
            INSERT INTO public.api_rate_limits (function_name, user_id, window_start, request_count)
            VALUES (lookup_key, '00000000-0000-0000-0000-000000000000'::uuid, current_window, 1)
            ON CONFLICT (user_id, function_name, window_start)
            DO UPDATE SET request_count = api_rate_limits.request_count + 1;
        EXCEPTION WHEN OTHERS THEN
            RETURN true;
        END;
        RETURN true;
    ELSIF current_count >= max_requests THEN
        RETURN false;
    ELSE
        BEGIN
            UPDATE public.api_rate_limits
            SET request_count = request_count + 1
            WHERE function_name = lookup_key
                AND user_id = '00000000-0000-0000-0000-000000000000'::uuid
                AND window_start = current_window;
        EXCEPTION WHEN OTHERS THEN
            RETURN true;
        END;
        RETURN true;
    END IF;
END;
$$;

-- Get shared dashboard data
CREATE OR REPLACE FUNCTION public.get_shared_dashboard(token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
declare
    v_link public.share_links%rowtype;
    v_profile public.profiles%rowtype;
    v_payload jsonb;
begin
    if token is null or length(token) != 32 or token !~ '^[a-f0-9]+$' then
        return null;
    end if;

    select * into v_link
    from public.share_links sl
    where sl.token = token and sl.is_active = true
    limit 1;

    if not found then
        return null;
    end if;

    update public.share_links set last_accessed_at = now() where id = v_link.id;

    select * into v_profile from public.profiles p where p.id = v_link.owner_user_id limit 1;

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
            select coalesce(jsonb_agg(to_jsonb(c) order by c.name), '[]'::jsonb)
            from (select id, name, flag, continent from public.countries where user_id = v_link.owner_user_id) c
        ),
        'visited_country_ids', (
            select coalesce(jsonb_agg(distinct cv.country_id), '[]'::jsonb)
            from public.country_visits cv
            where cv.user_id = v_link.owner_user_id and cv.country_id is not null
        ),
        'visit_details', (
            select coalesce(jsonb_agg(to_jsonb(vd) order by vd.visit_date desc nulls last, vd.created_at desc), '[]'::jsonb)
            from (
                select id, country_id, visit_date, end_date, is_approximate, approximate_month, approximate_year, trip_name, highlight
                from public.country_visit_details where user_id = v_link.owner_user_id
            ) vd
        ),
        'state_visits', (
            select coalesce(jsonb_agg(to_jsonb(sv)), '[]'::jsonb)
            from (select id, country_code, state_code, state_name from public.state_visits where user_id = v_link.owner_user_id) sv
        ),
        'photos', (
            select case when v_link.include_memories then
                (select coalesce(jsonb_agg(to_jsonb(tp) order by tp.taken_at desc nulls last, tp.created_at desc), '[]'::jsonb)
                from (select id, country_id, taken_at, photo_url, caption from public.travel_photos where user_id = v_link.owner_user_id and is_shareable = true) tp)
            else '[]'::jsonb end
        )
    );

    return v_payload;
end;
$$;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Create trigger for new user
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

-- Update timestamps triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON public.trips FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_share_profiles_updated_at BEFORE UPDATE ON public.share_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_travel_preferences_updated_at BEFORE UPDATE ON public.travel_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_country_visit_details_updated_at BEFORE UPDATE ON public.country_visit_details FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.country_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.country_visit_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visit_family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.state_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.country_wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.traveler_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_emergency_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itinerary_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itinerary_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packing_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flight_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_flights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.city_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Family members policies
CREATE POLICY "Users can view own family members" ON public.family_members FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own family members" ON public.family_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own family members" ON public.family_members FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own family members" ON public.family_members FOR DELETE USING (auth.uid() = user_id);

-- Countries policies
CREATE POLICY "Users can view own countries" ON public.countries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own countries" ON public.countries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own countries" ON public.countries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own countries" ON public.countries FOR DELETE USING (auth.uid() = user_id);

-- Country visits policies
CREATE POLICY "Users can view own country visits" ON public.country_visits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own country visits" ON public.country_visits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own country visits" ON public.country_visits FOR DELETE USING (auth.uid() = user_id);

-- Trips policies
CREATE POLICY "Users can create trips" ON public.trips FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view accessible trips" ON public.trips FOR SELECT USING ((auth.uid() = user_id) OR is_group_member(auth.uid(), family_group_id) OR is_trip_collaborator(auth.uid(), id, 'view'));
CREATE POLICY "Users can update own trips" ON public.trips FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own trips" ON public.trips FOR DELETE USING (auth.uid() = user_id);

-- Share links policies
CREATE POLICY "Users can view own share links" ON public.share_links FOR SELECT USING (auth.uid() = owner_user_id);
CREATE POLICY "Users can insert own share links" ON public.share_links FOR INSERT WITH CHECK (auth.uid() = owner_user_id);
CREATE POLICY "Users can update own share links" ON public.share_links FOR UPDATE USING (auth.uid() = owner_user_id) WITH CHECK (auth.uid() = owner_user_id);
CREATE POLICY "Users can delete own share links" ON public.share_links FOR DELETE USING (auth.uid() = owner_user_id);

-- Add remaining RLS policies following the same pattern for other tables...

-- =====================================================
-- STORAGE BUCKETS
-- =====================================================

-- Create travel-photos bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('travel-photos', 'travel-photos', true);

-- Storage policies
CREATE POLICY "Public can view travel photos" ON storage.objects FOR SELECT USING (bucket_id = 'travel-photos');
CREATE POLICY "Users can upload own photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'travel-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update own photos" ON storage.objects FOR UPDATE USING (bucket_id = 'travel-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own photos" ON storage.objects FOR DELETE USING (bucket_id = 'travel-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
