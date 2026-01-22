-- Fix the search_path for hash_email function
CREATE OR REPLACE FUNCTION public.hash_email(email text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = public
AS $$
  SELECT encode(
    extensions.digest(
      lower(trim(email)) || 'trip_collab_salt_v1',
      'sha256'
    ),
    'hex'
  )
$$;