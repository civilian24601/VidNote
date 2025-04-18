import 'dotenv/config'
import { supabase } from '../supabase/node-client'
import { setupStorageBuckets } from '../supabase/storage'

async function main() {
  console.log('🛠 Running Supabase setup...')
  await setupStorageBuckets()
  console.log('✅ Supabase setup complete.')
}

main().catch(console.error)