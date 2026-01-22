import { supabase } from '@/integrations/supabase/client';

export type ShareType = 'dashboard' | 'memory' | 'wishlist' | 'trip' | 'highlights';

export interface ShareTokenOptions {
  userId: string;
  shareType: ShareType;
  itemId?: string; // Specific item ID (for memory, trip, etc.)
  includedFields: string[]; // What data to include (e.g., ['countries', 'memories', 'stats'])
  expiresAt?: string | null; // ISO date string or null for permanent
}

export interface ShareLinkData {
  id: string;
  token: string;
  user_id: string;
  share_type: ShareType;
  item_id: string | null;
  included_fields: string[];
  created_at: string;
  expires_at: string | null;
  view_count: number;
}

/**
 * Generate a secure random token (32 characters, URL-safe)
 */
function generateToken(): string {
  // Use crypto.randomUUID if available, otherwise fallback to random string
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    // Remove hyphens and take first 32 chars
    return crypto.randomUUID().replace(/-/g, '').substring(0, 32);
  }
  // Fallback: generate random string
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate a share token and store it in the database
 */
export async function generateShareToken(options: ShareTokenOptions): Promise<string> {
  const { userId, shareType, itemId, includedFields, expiresAt } = options;

  // Generate secure random token
  const token = generateToken().toLowerCase();

  // Store in database
  const { data, error } = await supabase
    .from('share_links')
    .insert({
      token: token,
      user_id: userId,
      share_type: shareType,
      item_id: itemId || null,
      included_fields: includedFields,
      created_at: new Date().toISOString(),
      expires_at: expiresAt || null,
      view_count: 0,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to generate share token:', error);
    throw new Error(`Failed to generate share token: ${error.message}`);
  }

  // Return full URL based on share type
  const baseUrl = window.location.origin;
  
  switch (shareType) {
    case 'dashboard':
      return `${baseUrl}/share/dashboard/${token}`;
    case 'memory':
      return `${baseUrl}/share/memory/${token}`;
    case 'wishlist':
      return `${baseUrl}/share/wishlist/${token}`;
    case 'trip':
      return `${baseUrl}/share/trip/${token}`;
    case 'highlights':
      return `${baseUrl}/highlights/${token}`;
    default:
      return `${baseUrl}/share/${token}`;
  }
}

/**
 * Retrieve share token data from the database
 */
export async function getShareTokenData(token: string): Promise<ShareLinkData | null> {
  const { data, error } = await supabase
    .from('share_links')
    .select('*')
    .eq('token', token.toLowerCase())
    .single();

  if (error) {
    console.error('Failed to get share token data:', error);
    return null;
  }

  // Check if expired
  if (data.expires_at) {
    const expiresAt = new Date(data.expires_at);
    if (expiresAt < new Date()) {
      return null; // Token expired
    }
  }

  // Increment view count
  await supabase
    .from('share_links')
    .update({ view_count: (data.view_count || 0) + 1 })
    .eq('id', data.id);

  return data as ShareLinkData;
}

/**
 * Revoke a share token (delete it)
 */
export async function revokeShareToken(token: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('share_links')
    .delete()
    .eq('token', token.toLowerCase())
    .eq('user_id', userId);

  if (error) {
    console.error('Failed to revoke share token:', error);
    throw new Error(`Failed to revoke share token: ${error.message}`);
  }
}

/**
 * Get all share links for a user
 */
export async function getUserShareLinks(userId: string, shareType?: ShareType): Promise<ShareLinkData[]> {
  let query = supabase
    .from('share_links')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (shareType) {
    query = query.eq('share_type', shareType);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to get user share links:', error);
    return [];
  }

  return (data || []) as ShareLinkData[];
}
