// Public Supabase client for unauthenticated access (share links, public pages)
// This client does NOT persist sessions and is safe for incognito/public access
// Uses a custom storage key to avoid conflicts with the main supabase client
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Custom storage implementation that does nothing (prevents GoTrueClient conflicts)
const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
  get length() { return 0; },
  key: () => null,
};

// Public client with NO session persistence - safe for incognito/public routes
// Uses a unique storage key to prevent conflicts with the main client
export const publicSupabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: typeof window !== 'undefined' ? noopStorage : undefined,
    persistSession: false, // Don't persist sessions
    autoRefreshToken: false, // Don't try to refresh tokens
    detectSessionInUrl: false, // Don't detect sessions in URL
    storageKey: 'public-supabase-auth-token', // Unique key to avoid conflicts
  },
  global: {
    headers: {
      // Explicitly use anon role
      'apikey': SUPABASE_PUBLISHABLE_KEY,
    }
  }
});
