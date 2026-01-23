-- Update share_links table schema to match actual usage
-- This migration updates the table structure to support the new sharing system

-- Step 1: Rename user_id to owner_user_id if it exists and is different
DO $$
BEGIN
  -- Check if owner_user_id column exists, if not rename user_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'share_links' 
    AND column_name = 'owner_user_id'
  ) THEN
    -- Rename user_id to owner_user_id
    ALTER TABLE public.share_links 
    RENAME COLUMN user_id TO owner_user_id;
  END IF;
END $$;

-- Step 2: Add is_active column if it doesn't exist
ALTER TABLE public.share_links 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true NOT NULL;

-- Step 3: Add include_* columns if they don't exist
ALTER TABLE public.share_links 
ADD COLUMN IF NOT EXISTS include_stats BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS include_countries BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS include_memories BOOLEAN DEFAULT false NOT NULL;

-- Step 4: Add last_accessed_at if it doesn't exist
ALTER TABLE public.share_links 
ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMPTZ;

-- Step 5: Migrate data from included_fields JSONB to boolean columns if needed
-- This handles existing records that might have data in included_fields
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN 
    SELECT id, included_fields 
    FROM public.share_links 
    WHERE included_fields IS NOT NULL 
    AND included_fields != '[]'::jsonb
  LOOP
    UPDATE public.share_links
    SET 
      include_stats = COALESCE((rec.included_fields ? 'stats'), false),
      include_countries = COALESCE((rec.included_fields ? 'countries'), false),
      include_memories = COALESCE((rec.included_fields ? 'memories'), false)
    WHERE id = rec.id;
  END LOOP;
END $$;

-- Step 6: Update RLS policies to use owner_user_id
DROP POLICY IF EXISTS "Users can manage their own share links" ON public.share_links;

CREATE POLICY "Users can manage their own share links"
ON public.share_links FOR ALL
USING (auth.uid()::text = owner_user_id::text)
WITH CHECK (auth.uid()::text = owner_user_id::text);

-- Step 7: Ensure public can view share links (for edge function access)
DROP POLICY IF EXISTS "Public can view share links by token" ON public.share_links;

CREATE POLICY "Public can view share links by token"
ON public.share_links FOR SELECT
USING (is_active = true); -- Only active links are viewable

-- Step 8: Add unique constraint on owner_user_id if it doesn't exist (for one link per user)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'share_links_owner_unique'
  ) THEN
    ALTER TABLE public.share_links 
    ADD CONSTRAINT share_links_owner_unique UNIQUE (owner_user_id);
  END IF;
END $$;

-- Step 9: Update indexes
DROP INDEX IF EXISTS idx_share_links_user_type;
CREATE INDEX IF NOT EXISTS idx_share_links_owner_type 
ON public.share_links(owner_user_id, share_type);

CREATE INDEX IF NOT EXISTS idx_share_links_active 
ON public.share_links(is_active) WHERE is_active = true;
