-- Fix: Remove public access to email addresses
-- Drop the overly permissive policy that exposes all columns including email
DROP POLICY IF EXISTS "Public can view shared profiles" ON public.profiles;

-- Create a secure function that returns only non-sensitive profile data
CREATE OR REPLACE FUNCTION public.get_public_profile(profile_user_id uuid)
RETURNS TABLE (
  id uuid,
  full_name text,
  avatar_url text,
  home_country text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.full_name,
    p.avatar_url,
    p.home_country
  FROM public.profiles p
  INNER JOIN public.share_profiles sp ON sp.user_id = p.id
  WHERE p.id = profile_user_id
    AND sp.is_public = true;
$$;

-- Grant execute permission to anonymous users
GRANT EXECUTE ON FUNCTION public.get_public_profile(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_profile(uuid) TO authenticated;

-- Also fix the share_profiles token exposure - drop the problematic policy
DROP POLICY IF EXISTS "Public can view public share profiles" ON public.share_profiles;

-- Create a more restrictive policy that doesn't expose share_token to public
-- Only allow lookup by share_token (for accessing shared pages) not listing all tokens
CREATE OR REPLACE FUNCTION public.get_share_profile_by_token(token text)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  is_public boolean,
  show_stats boolean,
  show_map boolean,
  show_wishlist boolean,
  show_photos boolean,
  custom_headline text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    sp.id,
    sp.user_id,
    sp.is_public,
    sp.show_stats,
    sp.show_map,
    sp.show_wishlist,
    sp.show_photos,
    sp.custom_headline
  FROM public.share_profiles sp
  WHERE sp.share_token = token
    AND sp.is_public = true;
$$;

GRANT EXECUTE ON FUNCTION public.get_share_profile_by_token(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_share_profile_by_token(text) TO authenticated;