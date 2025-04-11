import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

// Helper to safely get environment variables
function getEnvVar(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing ${key} environment variable in Node.js. Make sure to import 'dotenv/config' before importing this module.`)
  }
  return value
}

// Create a function to initialize the client
export function createSupabaseClient(): SupabaseClient {
  try {
    return createClient(
      getEnvVar('SUPABASE_URL'),
      getEnvVar('SUPABASE_ANON_KEY'),
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  } catch (error) {
    console.error('Failed to create Supabase client:', error)
    throw error
  }
}

// Export a function to get the client instance
let clientInstance: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
  if (!clientInstance) {
    clientInstance = createSupabaseClient()
  }
  return clientInstance
}

// For backward compatibility
export const supabase = getSupabaseClient() 