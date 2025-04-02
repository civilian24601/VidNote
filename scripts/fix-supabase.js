/**
 * Script to fix common Supabase storage issues
 * - Makes buckets public
 * - Sets up proper RLS policies
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// If VITE_SUPABASE_* variables exist but SUPABASE_* don't, use the VITE_ ones
if (!process.env.SUPABASE_URL && process.env.VITE_SUPABASE_URL) {
  process.env.SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  console.log('Using VITE_SUPABASE_URL instead of SUPABASE_URL');
}

if (!process.env.SUPABASE_ANON_KEY && process.env.VITE_SUPABASE_ANON_KEY) {
  process.env.SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
  console.log('Using VITE_SUPABASE_ANON_KEY instead of SUPABASE_ANON_KEY');
}

// Check if we have the necessary environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error(`
Error: Missing required environment variables.

Make sure you have the following variables in your .env file:
- SUPABASE_URL or VITE_SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY

These are required to perform administrative operations on your Supabase project.
You can find them in your Supabase project dashboard under Settings > API.
`);
  process.exit(1);
}

// Initialize Supabase admin client
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function fixSupabaseStorage() {
  console.log(`
========================================================
  SUPABASE STORAGE CONFIGURATION FIX TOOL
========================================================
`);

  // Step 1: Create required buckets if they don't exist
  console.log('1. Checking and creating required buckets:');
  await createRequiredBuckets();
  
  // Step 2: Provide SQL for RLS policies
  console.log('\n2. SQL statements to fix permission issues:');
  console.log(`
   To fix permission issues, you need to run the following SQL in your Supabase SQL editor:
   
   -- Make buckets publicly accessible (read)
   CREATE POLICY "Public Access" ON storage.objects
   FOR SELECT USING (bucket_id IN ('videos', 'thumbnails'));
   
   -- Allow authenticated users to upload files
   CREATE POLICY "Authenticated Upload" ON storage.objects
   FOR INSERT TO authenticated
   USING (bucket_id IN ('videos', 'thumbnails'));
   
   -- Allow authenticated users to update files
   CREATE POLICY "Authenticated Update" ON storage.objects
   FOR UPDATE TO authenticated
   USING (bucket_id IN ('videos', 'thumbnails'));
   
   -- Allow authenticated users to delete files
   CREATE POLICY "Authenticated Delete" ON storage.objects
   FOR DELETE TO authenticated
   USING (bucket_id IN ('videos', 'thumbnails'));
  `);
  
  // Step 3: Test accessibility of buckets
  console.log('\n3. Testing buckets accessibility:');
  await testBucketAccess('videos');
  await testBucketAccess('thumbnails');
  
  console.log('\nFix completed! Please restart your application for changes to take effect.');
}

async function createRequiredBuckets() {
  // Check if the 'videos' bucket exists
  await createBucket('videos', true);
  
  // Check if the 'thumbnails' bucket exists
  await createBucket('thumbnails', true);
}

async function createBucket(name, isPublic = false) {
  try {
    console.log(`   Checking if '${name}' bucket exists...`);
    
    // Try to get the bucket
    const { data: bucket, error: getBucketError } = await supabaseAdmin.storage.getBucket(name);
    
    if (getBucketError) {
      // If the bucket doesn't exist, create it
      if (getBucketError.message.includes('not found')) {
        console.log(`   Creating '${name}' bucket with public: ${isPublic}...`);
        
        const { data, error } = await supabaseAdmin.storage.createBucket(name, {
          public: isPublic
        });
        
        if (error) {
          console.error(`   ❌ Error creating '${name}' bucket: ${error.message}`);
          return false;
        }
        
        console.log(`   ✅ '${name}' bucket created successfully.`);
        return true;
      } else {
        console.error(`   ❌ Error checking '${name}' bucket: ${getBucketError.message}`);
        return false;
      }
    } else if (bucket) {
      // Bucket exists, check if it's public or needs to be updated
      console.log(`   ✅ '${name}' bucket already exists.`);
      
      // If we need to update bucket settings (not available in free tier)
      if (typeof bucket.public !== 'undefined' && bucket.public !== isPublic) {
        console.log(`   ⚠️ Bucket '${name}' has public=${bucket.public}, trying to update to public=${isPublic}...`);
        
        try {
          const { error: updateError } = await supabaseAdmin.storage.updateBucket(name, {
            public: isPublic
          });
          
          if (updateError) {
            console.error(`   ❌ Error updating '${name}' bucket: ${updateError.message}`);
            console.log(`   Please update it manually in the Supabase dashboard.`);
          } else {
            console.log(`   ✅ '${name}' bucket updated to public=${isPublic}.`);
          }
        } catch (error) {
          console.error(`   ❌ Error updating bucket (may not be available on free tier): ${error.message}`);
          console.log(`   Please update it manually in the Supabase dashboard.`);
        }
      }
      
      return true;
    }
  } catch (error) {
    console.error(`   ❌ Unexpected error with '${name}' bucket: ${error.message}`);
    return false;
  }
}

async function testBucketAccess(bucketName) {
  console.log(`   Testing '${bucketName}' bucket accessibility...`);
  
  try {
    // Try to list files in the bucket
    const { data, error } = await supabaseAdmin.storage.from(bucketName).list('', { limit: 1 });
    
    if (error) {
      console.error(`   ❌ Error accessing '${bucketName}' bucket: ${error.message}`);
      return false;
    }
    
    console.log(`   ✅ Successfully accessed '${bucketName}' bucket.`);
    console.log(`   Found ${data.length} file(s) in the root folder.`);
    return true;
  } catch (error) {
    console.error(`   ❌ Unexpected error accessing '${bucketName}' bucket: ${error.message}`);
    return false;
  }
}

// Run the script
fixSupabaseStorage().catch(err => {
  console.error('\nUnhandled error:', err);
  process.exit(1);
});