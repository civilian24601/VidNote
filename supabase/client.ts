// supabase/client.ts
import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

// Helper to safely get environment variables
function getEnvVar(key: string): string {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    const value = import.meta.env[key]
    if (!value) {
      throw new Error(`Missing ${key} environment variable in browser`)
    }
    return value
  }
  
  // Node.js environment
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing ${key} environment variable in Node.js`)
  }
  return value
}

// Create a single instance of the Supabase client
export const supabase: SupabaseClient = createClient(
  getEnvVar('VITE_SUPABASE_URL'),
  getEnvVar('VITE_SUPABASE_ANON_KEY'),
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true
    }
  }
)
