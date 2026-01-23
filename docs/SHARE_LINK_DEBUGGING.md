# Share Link Debugging Guide

## Quick Diagnosis Queries

### 1. Check if share link exists in database

```sql
-- Check share_links table (new system)
SELECT 
  id,
  token,
  owner_user_id,
  user_id,  -- in case old schema
  is_active,
  include_stats,
  include_countries,
  include_memories,
  created_at
FROM public.share_links
WHERE token = 'c29341b2751eaa1fbd9752967214be46';  -- Replace with your token

-- Check share_profiles table (old system)
SELECT 
  id,
  user_id,
  dashboard_share_token,
  is_public,
  show_stats,
  show_map,
  show_countries
FROM public.share_profiles
WHERE dashboard_share_token = 'c29341b2751eaa1fbd9752967214be46';  -- Replace with your token
```

### 2. Check RLS policies

```sql
-- List all policies on share_links
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'share_links';
```

### 3. Test anonymous access

```sql
-- Test as anonymous user (this simulates what the edge function sees with SERVICE_ROLE)
-- The edge function uses SERVICE_ROLE_KEY which bypasses RLS, so this should work
SELECT * FROM public.share_links WHERE token = 'c29341b2751eaa1fbd9752967214be46';
```

### 4. Check table schema

```sql
-- Verify actual column names in share_links table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'share_links'
ORDER BY ordinal_position;
```

## Common Issues

### Issue 1: Schema Mismatch
**Symptom**: Token exists but edge function can't find it
**Cause**: Column names don't match (user_id vs owner_user_id, missing is_active)
**Fix**: Run migration `20260123000000_update_share_links_schema.sql`

### Issue 2: RLS Blocking Access
**Symptom**: "Share link not found or is private"
**Cause**: RLS policy too restrictive
**Fix**: Edge function uses SERVICE_ROLE_KEY which bypasses RLS, so this shouldn't be the issue. But verify the policy exists:
```sql
SELECT * FROM pg_policies WHERE tablename = 'share_links' AND policyname = 'Public can view share links by token';
```

### Issue 3: Token Format Mismatch
**Symptom**: Token exists but doesn't match
**Cause**: Case sensitivity or extra whitespace
**Fix**: Edge function normalizes tokens (lowercase, trimmed). Verify token format:
```sql
SELECT token, LOWER(TRIM(token)) as normalized FROM share_links WHERE id = 'your-id';
```

### Issue 4: is_active = false
**Symptom**: Token found but link inactive
**Cause**: Link was deactivated
**Fix**: Check is_active column:
```sql
UPDATE share_links SET is_active = true WHERE token = 'your-token';
```

## Testing Share Links

### Test in Browser Console

```javascript
// Test edge function directly
const response = await fetch('https://your-project.supabase.co/functions/v1/get-public-dashboard', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ token: 'c29341b2751eaa1fbd9752967214be46' })
});

const data = await response.json();
console.log('Edge function response:', data);
```

### Test with curl

```bash
curl -X POST https://your-project.supabase.co/functions/v1/get-public-dashboard \
  -H "Content-Type: application/json" \
  -d '{"token":"c29341b2751eaa1fbd9752967214be46"}' \
  -v
```

## Expected Database Schema

The `share_links` table should have:

```sql
CREATE TABLE public.share_links (
  id UUID PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  owner_user_id UUID NOT NULL REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true NOT NULL,
  include_stats BOOLEAN DEFAULT false NOT NULL,
  include_countries BOOLEAN DEFAULT false NOT NULL,
  include_memories BOOLEAN DEFAULT false NOT NULL,
  last_accessed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

## Deployment Checklist

1. ✅ Run migration: `supabase migration up`
2. ✅ Deploy edge function: `supabase functions deploy get-public-dashboard`
3. ✅ Verify RLS policies exist
4. ✅ Test share link generation
5. ✅ Test share link access in incognito mode
6. ✅ Check edge function logs for errors
