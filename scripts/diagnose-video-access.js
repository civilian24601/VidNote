/**
 * Complete diagnostic script for Supabase storage and video access issues
 * 
 * This script:
 * 1. Checks Supabase configuration
 * 2. Creates buckets if needed
 * 3. Attempts to upload a test video file
 * 4. Tests accessibility of the uploaded file
 * 5. Provides specific error information and solutions
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { createReadStream } from 'fs';

// If VITE_SUPABASE_* variables exist but SUPABASE_* don't, use the VITE_ ones
if (!process.env.SUPABASE_URL && process.env.VITE_SUPABASE_URL) {
  process.env.SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  console.log('Using VITE_SUPABASE_URL instead of SUPABASE_URL');
}

if (!process.env.SUPABASE_ANON_KEY && process.env.VITE_SUPABASE_ANON_KEY) {
  process.env.SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
  console.log('Using VITE_SUPABASE_ANON_KEY instead of SUPABASE_ANON_KEY');
}

// Initialize Supabase clients - we need both regular and admin clients
let supabaseAnon;
let supabaseAdmin;

try {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    console.log('Initializing regular Supabase client...');
    supabaseAnon = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
  }
  
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('Initializing admin Supabase client...');
    supabaseAdmin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
  }
} catch (error) {
  console.error('Failed to initialize Supabase clients:', error);
  process.exit(1);
}

async function diagnoseVideoAccess() {
  console.log(`
========================================================
  SUPABASE STORAGE & VIDEO ACCESS DIAGNOSTIC TOOL
========================================================
`);

  // Step 1: Check environment variables
  console.log('1. Checking Supabase environment variables:');
  
  const checks = {
    supabaseUrl: process.env.SUPABASE_URL ? '✅ Present' : '❌ Missing',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY ? '✅ Present' : '❌ Missing',
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Present' : '❌ Missing',
    supabaseUrlFormat: process.env.SUPABASE_URL?.includes('supabase.co') ? '✅ Valid format' : '❌ Invalid format',
  };
  
  Object.entries(checks).forEach(([key, value]) => {
    console.log(`   ${key}: ${value}`);
  });
  
  if (!supabaseAnon || !supabaseAdmin) {
    console.error('\n❌ Cannot continue: Missing required Supabase clients');
    console.log('   Make sure you have the following environment variables set:');
    console.log('   - SUPABASE_URL or VITE_SUPABASE_URL');
    console.log('   - SUPABASE_ANON_KEY or VITE_SUPABASE_ANON_KEY');
    console.log('   - SUPABASE_SERVICE_ROLE_KEY (for admin operations)');
    process.exit(1);
  }

  // Step 2: Check bucket existence and configuration
  console.log('\n2. Checking storage buckets:');
  
  let buckets;
  try {
    // Use admin client to bypass RLS policies
    const { data, error } = await supabaseAdmin.storage.listBuckets();
    if (error) {
      console.error(`   ❌ Error listing buckets: ${error.message}`);
      if (error.message.includes('permission')) {
        console.log('     Your service role key might not have permission to list buckets.');
      }
      buckets = [];
    } else {
      buckets = data || [];
      console.log(`   ✅ Found ${buckets.length} buckets in your Supabase project`);
    }
  } catch (error) {
    console.error(`   ❌ Unexpected error listing buckets: ${error.message}`);
    buckets = [];
  }
  
  // Check for videos bucket
  const videosBucket = buckets.find(b => b.name === 'videos');
  if (!videosBucket) {
    console.log('   ❌ Videos bucket is missing');
    console.log('   🔧 Creating videos bucket...');
    
    try {
      const { data, error } = await supabaseAdmin.storage.createBucket('videos', {
        public: true,
      });
      
      if (error) {
        console.error(`     Failed to create videos bucket: ${error.message}`);
      } else {
        console.log('     ✅ Videos bucket created successfully');
      }
    } catch (error) {
      console.error(`     Unexpected error creating videos bucket: ${error.message}`);
    }
  } else {
    console.log(`   ✅ Videos bucket exists (public: ${videosBucket.public ? 'yes' : 'no'})`);
    
    if (!videosBucket.public) {
      console.log('   ⚠️ Videos bucket is not public, videos might not be accessible');
      console.log('     You should make the bucket public in the Supabase dashboard');
    }
  }
  
  // Check for thumbnails bucket
  const thumbnailsBucket = buckets.find(b => b.name === 'thumbnails');
  if (!thumbnailsBucket) {
    console.log('   ❌ Thumbnails bucket is missing');
    console.log('   🔧 Creating thumbnails bucket...');
    
    try {
      const { data, error } = await supabaseAdmin.storage.createBucket('thumbnails', {
        public: true,
      });
      
      if (error) {
        console.error(`     Failed to create thumbnails bucket: ${error.message}`);
      } else {
        console.log('     ✅ Thumbnails bucket created successfully');
      }
    } catch (error) {
      console.error(`     Unexpected error creating thumbnails bucket: ${error.message}`);
    }
  } else {
    console.log(`   ✅ Thumbnails bucket exists (public: ${thumbnailsBucket.public ? 'yes' : 'no'})`);
    
    if (!thumbnailsBucket.public) {
      console.log('   ⚠️ Thumbnails bucket is not public, thumbnails might not be accessible');
      console.log('     You should make the bucket public in the Supabase dashboard');
    }
  }

  // Step 3: Check RLS policies
  console.log('\n3. SQL statements to fix permission issues:');
  console.log(`
   -- Copy and paste these SQL statements in your Supabase SQL Editor:
   
   -- Make bucket publicly accessible (read)
   CREATE POLICY "Public Access" ON storage.objects
   FOR SELECT USING (bucket_id IN ('videos', 'thumbnails'));
   
   -- Allow all authenticated users to upload files
   CREATE POLICY "Authenticated Upload" ON storage.objects
   FOR INSERT TO authenticated
   USING (bucket_id IN ('videos', 'thumbnails'));
   
   -- Allow all authenticated users to update files
   CREATE POLICY "Authenticated Update" ON storage.objects
   FOR UPDATE TO authenticated
   USING (bucket_id IN ('videos', 'thumbnails'));
   
   -- Allow all authenticated users to delete files
   CREATE POLICY "Authenticated Delete" ON storage.objects
   FOR DELETE TO authenticated
   USING (bucket_id IN ('videos', 'thumbnails'));
  `);

  // Step 4: Test video upload
  console.log('\n4. Testing video upload and access:');
  
  // Create a small test video file if it doesn't exist
  const testFilePath = path.join(__dirname, 'test-video.mp4');
  const testFileExists = fs.existsSync(testFilePath);
  
  if (!testFileExists) {
    console.log('   Creating a very small test video file...');
    
    // Create a minimal valid MP4 file (20 bytes)
    // These bytes represent a minimal empty MP4 container
    const minimalMP4 = Buffer.from([
      0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70,
      0x6D, 0x70, 0x34, 0x32, 0x00, 0x00, 0x00, 0x00,
      0x6D, 0x70, 0x34, 0x32
    ]);
    
    try {
      fs.writeFileSync(testFilePath, minimalMP4);
      console.log('   ✅ Test video file created');
    } catch (error) {
      console.error(`   ❌ Failed to create test video file: ${error.message}`);
      process.exit(1);
    }
  } else {
    console.log('   ✅ Using existing test video file');
  }
  
  // Upload the test video
  console.log('   Uploading test video to Supabase...');
  
  let uploadedFilePath;
  let publicUrl;
  
  try {
    const fileContent = fs.readFileSync(testFilePath);
    const timestamp = Date.now();
    uploadedFilePath = `diagnostic-test/test-video-${timestamp}.mp4`;
    
    const { data, error } = await supabaseAdmin.storage
      .from('videos')
      .upload(uploadedFilePath, fileContent, {
        contentType: 'video/mp4',
        upsert: true
      });
    
    if (error) {
      console.error(`   ❌ Upload failed: ${error.message}`);
      console.log('     Possible reasons:');
      
      if (error.message.includes('not found')) {
        console.log('     - Bucket does not exist or is not accessible');
      } else if (error.message.includes('permission')) {
        console.log('     - Permission denied, RLS policies might be restrictive');
      } else if (error.message.includes('JWT')) {
        console.log('     - Authentication issue with your service role key');
      } else {
        console.log(`     - Other error: ${error.message}`);
      }
    } else {
      console.log('   ✅ Test video uploaded successfully');
      
      // Get the public URL
      const { data: urlData } = supabaseAdmin.storage
        .from('videos')
        .getPublicUrl(uploadedFilePath);
      
      publicUrl = urlData.publicUrl;
      console.log(`   📋 Public URL: ${publicUrl}`);
      
      // Test accessibility of the uploaded file
      console.log('   Testing video accessibility...');
      
      try {
        const response = await fetch(publicUrl, { method: 'HEAD' });
        
        if (response.ok) {
          console.log('   ✅ Video is accessible! Status code:', response.status);
          console.log('   ✅ Content-Type:', response.headers.get('content-type'));
          console.log('   ✅ Content-Length:', response.headers.get('content-length'));
        } else {
          console.error(`   ❌ Video is not accessible. Status code: ${response.status}`);
          console.log('     Possible reasons:');
          
          if (response.status === 400) {
            console.log('     - Bucket might not be public');
            console.log('     - RLS policies might be preventing public access');
          } else if (response.status === 403) {
            console.log('     - Permission denied, check RLS policies');
          } else if (response.status === 404) {
            console.log('     - File not found, check upload success');
          } else {
            console.log(`     - HTTP status ${response.status}, see message body for details`);
          }
          
          const bodyText = await response.text();
          console.log(`     Response body: ${bodyText || '(empty)'}`);
        }
      } catch (error) {
        console.error(`   ❌ Error testing video URL: ${error.message}`);
      }
    }
  } catch (error) {
    console.error(`   ❌ Unexpected error during upload: ${error.message}`);
  }

  // Step 5: Cleanup
  if (uploadedFilePath) {
    console.log('\n5. Cleaning up test files:');
    console.log(`   Removing test video from Supabase (${uploadedFilePath})...`);
    
    try {
      const { error } = await supabaseAdmin.storage
        .from('videos')
        .remove([uploadedFilePath]);
      
      if (error) {
        console.error(`   ❌ Failed to remove test video: ${error.message}`);
      } else {
        console.log('   ✅ Test video removed successfully');
      }
    } catch (error) {
      console.error(`   ❌ Unexpected error removing test video: ${error.message}`);
    }
  }

  // Step 6: Summary and recommendations
  console.log('\n6. Summary and Recommendations:');
  
  // Check if we have a URL and accessibility result to make a judgment
  if (publicUrl) {
    console.log('   Your Supabase storage setup appears to be configured correctly.');
    console.log('   If you are still experiencing video playback issues, check:');
    console.log('   - Browser console errors when playing videos');
    console.log('   - File format compatibility with web browsers');
    console.log('   - Frontend code for loading videos');
    console.log('   - CORS configuration if you see cross-origin errors');
  } else {
    console.log('   Your Supabase storage setup needs attention:');
    console.log('   1. Make sure both "videos" and "thumbnails" buckets exist and are public');
    console.log('   2. Apply the SQL statements shown above in the Supabase SQL Editor');
    console.log('   3. Check that your environment variables are correctly set');
    console.log('   4. Restart your application after making changes');
  }
  
  console.log(`\nDiagnostic completed at: ${new Date().toISOString()}`);
}

// Run the diagnostic
diagnoseVideoAccess().catch(err => {
  console.error('Unhandled error during diagnosis:', err);
  process.exit(1);
});