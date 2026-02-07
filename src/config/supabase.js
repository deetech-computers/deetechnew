// config/supabase.js - FIXED VERSION
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase configuration. Please check your .env file');
  throw new Error('Missing Supabase configuration');
}

console.log('Supabase URL configured:', supabaseUrl ? 'Yes' : 'No');

const globalScope = typeof window !== 'undefined' ? window : {};

// Main client (singleton) - persisted auth
if (!globalScope.__deetech_supabase) {
  globalScope.__deetech_supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true, // FIXED: Changed from false to true
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'deetech-auth'
    },
    // ADDED: Realtime configuration to reduce connection overhead
    realtime: {
      params: {
        eventsPerSecond: 2 // Limit event frequency to prevent token refresh spam
      }
    },
    // ADDED: Global headers
    global: {
      headers: {
        'X-Client-Info': 'deetech-web-app'
      }
    }
  });
}

// Public client: no session persistence or refresh (safe for public pages)
if (!globalScope.__deetech_supabase_public) {
  globalScope.__deetech_supabase_public = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storage: undefined,
      storageKey: 'deetech-public'
    },
    realtime: {
      params: {
        eventsPerSecond: 2
      }
    },
    global: {
      headers: {
        'X-Client-Info': 'deetech-web-app-public'
      }
    }
  });
}

export const supabase = globalScope.__deetech_supabase;
export const supabasePublic = globalScope.__deetech_supabase_public;
