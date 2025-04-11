import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

// Type for environment variables
interface EnvVars {
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
  SUPABASE_SERVICE_ROLE_KEY?: string
}

/**
 * Creates a Supabase client for Node.js environments
 * @param env - Environment variables object
 * @param useServiceRole - Whether to use the service role key (default: false)
 * @returns Supabase client instance
 */
export function createSupabaseClient(
  env: EnvVars,
  useServiceRole = false
): SupabaseClient {
  const url = env.SUPABASE_URL
  const key = useServiceRole ? env.SUPABASE_SERVICE_ROLE_KEY : env.SUPABASE_ANON_KEY

  if (!url) {
    throw new Error('Missing SUPABASE_URL environment variable')
  }

  if (!key) {
    throw new Error(
      useServiceRole
        ? 'Missing SUPABASE_SERVICE_ROLE_KEY environment variable'
        : 'Missing SUPABASE_ANON_KEY environment variable'
    )
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
} 