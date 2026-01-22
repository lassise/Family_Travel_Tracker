-- Create share_links table for unified sharing across all content types
CREATE TABLE IF NOT EXISTS public.share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  share_type TEXT NOT NULL CHECK (share_type IN ('dashboard', 'memory', 'wishlist', 'trip', 'highlights')),
  item_id TEXT, -- Nullable, for specific item shares (memory ID, trip ID, etc.)
  included_fields JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of fields to include
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ, -- Nullable, for permanent links
  view_count INTEGER DEFAULT 0 NOT NULL
);

-- Enable RLS
ALTER TABLE public.share_links ENABLE ROW LEVEL SECURITY;

-- Policies for share_links
-- Users can manage their own share links
CREATE POLICY "Users can manage their own share links"
ON public.share_links FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Public can view share links by token (for accessing shared content)
CREATE POLICY "Public can view share links by token"
ON public.share_links FOR SELECT
USING (true); -- Token lookup is handled by application logic, not RLS

-- Add indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_share_links_token ON public.share_links(token);
CREATE INDEX IF NOT EXISTS idx_share_links_user_type ON public.share_links(user_id, share_type);
CREATE INDEX IF NOT EXISTS idx_share_links_item ON public.share_links(item_id) WHERE item_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_share_links_expires ON public.share_links(expires_at) WHERE expires_at IS NOT NULL;
