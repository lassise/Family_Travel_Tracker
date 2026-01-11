-- Create trip collaborators table for sharing trips with friends
CREATE TABLE public.trip_collaborators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  invited_email text,
  permission text NOT NULL DEFAULT 'view' CHECK (permission IN ('view', 'comment', 'edit')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  invited_by uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  CONSTRAINT user_or_email CHECK (user_id IS NOT NULL OR invited_email IS NOT NULL)
);

-- Enable RLS
ALTER TABLE public.trip_collaborators ENABLE ROW LEVEL SECURITY;

-- Trip owner can manage all collaborators
CREATE POLICY "Trip owners can manage collaborators"
ON public.trip_collaborators FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM trips 
    WHERE trips.id = trip_collaborators.trip_id 
    AND trips.user_id = auth.uid()
  )
);

-- Users can view their own collaborator invites
CREATE POLICY "Users can view own invites"
ON public.trip_collaborators FOR SELECT
USING (user_id = auth.uid() OR invited_email = (SELECT email FROM profiles WHERE id = auth.uid()));

-- Users can update their own invite status (accept/decline)
CREATE POLICY "Users can respond to invites"
ON public.trip_collaborators FOR UPDATE
USING (user_id = auth.uid() OR invited_email = (SELECT email FROM profiles WHERE id = auth.uid()))
WITH CHECK (user_id = auth.uid() OR invited_email = (SELECT email FROM profiles WHERE id = auth.uid()));

-- Create function to check if user is a trip collaborator with specific permission
CREATE OR REPLACE FUNCTION public.is_trip_collaborator(
  _user_id uuid, 
  _trip_id uuid, 
  _min_permission text DEFAULT 'view'
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
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

-- Update trips policy to include collaborators for viewing
DROP POLICY IF EXISTS "Users can view own trips" ON public.trips;
CREATE POLICY "Users can view accessible trips"
ON public.trips FOR SELECT
USING (
  auth.uid() = user_id 
  OR is_group_member(auth.uid(), family_group_id)
  OR is_trip_collaborator(auth.uid(), id, 'view')
);

-- Update bookings policy to include collaborators
DROP POLICY IF EXISTS "Users can manage bookings via trip" ON public.bookings;

CREATE POLICY "Users can view bookings via trip"
ON public.bookings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM trips
    WHERE trips.id = bookings.trip_id
    AND (
      trips.user_id = auth.uid()
      OR is_group_member(auth.uid(), trips.family_group_id)
      OR is_trip_collaborator(auth.uid(), trips.id, 'view')
    )
  )
);

CREATE POLICY "Users can modify bookings via trip"
ON public.bookings FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM trips
    WHERE trips.id = bookings.trip_id
    AND (
      trips.user_id = auth.uid()
      OR is_group_member(auth.uid(), trips.family_group_id)
      OR is_trip_collaborator(auth.uid(), trips.id, 'edit')
    )
  )
);

CREATE POLICY "Users can update bookings via trip"
ON public.bookings FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM trips
    WHERE trips.id = bookings.trip_id
    AND (
      trips.user_id = auth.uid()
      OR is_group_member(auth.uid(), trips.family_group_id)
      OR is_trip_collaborator(auth.uid(), trips.id, 'edit')
    )
  )
);

CREATE POLICY "Users can delete bookings via trip"
ON public.bookings FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM trips
    WHERE trips.id = bookings.trip_id
    AND (
      trips.user_id = auth.uid()
      OR is_group_member(auth.uid(), trips.family_group_id)
      OR is_trip_collaborator(auth.uid(), trips.id, 'edit')
    )
  )
);

-- Update itinerary_days policy to include collaborators
DROP POLICY IF EXISTS "Users can manage itinerary days via trip" ON public.itinerary_days;

CREATE POLICY "Users can view itinerary days"
ON public.itinerary_days FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM trips
    WHERE trips.id = itinerary_days.trip_id
    AND (
      trips.user_id = auth.uid()
      OR is_group_member(auth.uid(), trips.family_group_id)
      OR is_trip_collaborator(auth.uid(), trips.id, 'view')
    )
  )
);

CREATE POLICY "Users can modify itinerary days"
ON public.itinerary_days FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM trips
    WHERE trips.id = itinerary_days.trip_id
    AND (
      trips.user_id = auth.uid()
      OR is_group_member(auth.uid(), trips.family_group_id)
      OR is_trip_collaborator(auth.uid(), trips.id, 'edit')
    )
  )
);

-- Update itinerary_items policy to include collaborators
DROP POLICY IF EXISTS "Users can manage itinerary items via trip" ON public.itinerary_items;

CREATE POLICY "Users can view itinerary items"
ON public.itinerary_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM itinerary_days d
    JOIN trips t ON t.id = d.trip_id
    WHERE d.id = itinerary_items.itinerary_day_id
    AND (
      t.user_id = auth.uid()
      OR is_group_member(auth.uid(), t.family_group_id)
      OR is_trip_collaborator(auth.uid(), t.id, 'view')
    )
  )
);

CREATE POLICY "Users can modify itinerary items"
ON public.itinerary_items FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM itinerary_days d
    JOIN trips t ON t.id = d.trip_id
    WHERE d.id = itinerary_items.itinerary_day_id
    AND (
      t.user_id = auth.uid()
      OR is_group_member(auth.uid(), t.family_group_id)
      OR is_trip_collaborator(auth.uid(), t.id, 'edit')
    )
  )
);