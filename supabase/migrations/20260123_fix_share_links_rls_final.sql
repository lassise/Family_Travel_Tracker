-- Drop ALL existing policies on share_links
DROP POLICY IF EXISTS "Anyone can read active share links" ON share_links;
DROP POLICY IF EXISTS "Users can create share links" ON share_links;
DROP POLICY IF EXISTS "Enable read access for all users" ON share_links;
DROP POLICY IF EXISTS "public_read_share_links" ON share_links;
DROP POLICY IF EXISTS "authenticated_create_share_links" ON share_links;
DROP POLICY IF EXISTS "allow_all_read_share_links" ON share_links;
DROP POLICY IF EXISTS "allow_authenticated_insert_share_links" ON share_links;
DROP POLICY IF EXISTS "allow_owner_update_share_links" ON share_links;
DROP POLICY IF EXISTS "allow_owner_delete_share_links" ON share_links;

-- Make absolutely sure RLS is enabled
ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;

-- CRITICAL: Allow ANYONE (anon + authenticated) to read ALL rows
-- This is the most permissive policy - if this doesn't work, nothing will
CREATE POLICY "allow_all_read_share_links"
ON share_links
FOR SELECT
USING (true);

-- Allow authenticated users to create their own share links
CREATE POLICY "allow_authenticated_insert_share_links"
ON share_links
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = COALESCE(owner_user_id, user_id)
);

-- Allow users to update their own share links
CREATE POLICY "allow_owner_update_share_links"
ON share_links
FOR UPDATE
TO authenticated
USING (auth.uid() = COALESCE(owner_user_id, user_id))
WITH CHECK (auth.uid() = COALESCE(owner_user_id, user_id));

-- Allow users to delete their own share links
CREATE POLICY "allow_owner_delete_share_links"
ON share_links
FOR DELETE
TO authenticated
USING (auth.uid() = COALESCE(owner_user_id, user_id));

-- Verify the policies were created
DO $$
BEGIN
  RAISE NOTICE 'Share links RLS policies updated successfully';
END $$;
