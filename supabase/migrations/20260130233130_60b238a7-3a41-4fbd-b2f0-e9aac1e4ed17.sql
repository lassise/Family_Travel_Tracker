-- Fix the overly permissive RLS policy on api_rate_limits
-- The "Service role can manage rate limits" policy uses USING (true) which is flagged as a security concern
-- This policy is intentional for service role access, but we should scope it properly

DROP POLICY IF EXISTS "Service role can manage rate limits" ON public.api_rate_limits;

-- The api_rate_limits table needs to allow inserts/updates from edge functions running with service role
-- Since edge functions use service role key, they bypass RLS anyway
-- For user access, we only allow viewing their own rate limits (already have that policy)
-- No additional policy needed - service role bypasses RLS by design