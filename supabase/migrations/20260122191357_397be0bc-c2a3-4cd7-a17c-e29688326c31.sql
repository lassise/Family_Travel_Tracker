-- Add a column for hashed email (SHA-256)
ALTER TABLE public.trip_collaborators 
ADD COLUMN IF NOT EXISTS invited_email_hash text;

-- Create an index on the hash column for efficient lookups
CREATE INDEX IF NOT EXISTS idx_trip_collaborators_email_hash 
ON public.trip_collaborators(invited_email_hash);

-- Create a function to generate consistent email hashes
-- Using SHA-256 with a fixed salt for consistent lookups
CREATE OR REPLACE FUNCTION public.hash_email(email text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT encode(
    extensions.digest(
      lower(trim(email)) || 'trip_collab_salt_v1',
      'sha256'
    ),
    'hex'
  )
$$;

-- Migrate existing invited_email values to hashes
UPDATE public.trip_collaborators 
SET invited_email_hash = public.hash_email(invited_email)
WHERE invited_email IS NOT NULL AND invited_email_hash IS NULL;

-- Drop the old policies that expose email matching
DROP POLICY IF EXISTS "Users can view own invites" ON public.trip_collaborators;
DROP POLICY IF EXISTS "Users can respond to invites" ON public.trip_collaborators;

-- Create new SELECT policy using hashed email comparison
-- Users can view invites where:
-- 1. They are the user_id (already linked), OR
-- 2. The hashed version of their profile email matches the stored hash
CREATE POLICY "Users can view own invites"
ON public.trip_collaborators
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR invited_email_hash = (
    SELECT public.hash_email(profiles.email)
    FROM profiles
    WHERE profiles.id = auth.uid()
  )
);

-- Create new UPDATE policy for responding to invites
CREATE POLICY "Users can respond to invites"
ON public.trip_collaborators
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  OR invited_email_hash = (
    SELECT public.hash_email(profiles.email)
    FROM profiles
    WHERE profiles.id = auth.uid()
  )
)
WITH CHECK (
  user_id = auth.uid()
  OR invited_email_hash = (
    SELECT public.hash_email(profiles.email)
    FROM profiles
    WHERE profiles.id = auth.uid()
  )
);

-- Note: We keep invited_email for display purposes to trip owners
-- Trip owners can still see who they invited via their ALL policy
-- The email is only hidden from enumeration attacks via the SELECT policy