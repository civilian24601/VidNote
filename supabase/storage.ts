import { getSupabaseClient } from './node-client'

export async function setupStorageBuckets() {
  const supabase = getSupabaseClient()
  const buckets = ['videos', 'profile-images']

  for (const bucket of buckets) {
    const { error } = await supabase.storage.createBucket(bucket, { public: false })

    if (error && !error.message.includes('already exists')) {
      console.error(`❌ Failed to create bucket: ${bucket}`, error)
    } else {
      console.log(`✅ Bucket ready: ${bucket}`)
    }
  }
}