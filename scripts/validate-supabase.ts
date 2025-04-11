// scripts/validate-supabase.ts 
import 'dotenv/config'
import { createSupabaseClient } from '../supabase/create-client'

async function main() {
  try {
    // Create client with service role for admin operations
    const supabase = createSupabaseClient(process.env as any, true)

    // Test connection
    const { data, error } = await supabase.from('users').select('*').limit(1)

    if (error) {
      throw error
    }

    console.log('✅ Successfully connected to Supabase!')
    console.log('👤 Sample user:', data?.[0] || 'No users found')
  } catch (error) {
    console.error('❌ Failed to connect to Supabase:', error)
    process.exit(1)
  }
}

main()
