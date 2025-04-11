/**
 * Script to check Supabase bucket permissions and contents
 * This will help diagnose issues with video playback
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

// If VITE_SUPABASE_* variables exist but SUPABASE_* don't, use the VITE_ ones
if (!process.env.SUPABASE_URL && process.env.VITE_SUPABASE_URL) {
  process.env.SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  console.log('Using VITE_SUPABASE_URL instead of SUPABASE_URL');
}

if (!process.env.SUPABASE_ANON_KEY && process.env.VITE_SUPABASE_ANON_KEY) {
  process.env.SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
  console.log('Using VITE_SUPABASE_ANON_KEY instead of SUPABASE_ANON_KEY');
}

// Initialize clients
let supabaseAnon;
let supabaseAdmin;

if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
  console.log('Initializing regular Supabase client...');
  supabaseAnon = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );
} else {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY');
  process.exit(1);
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
} else {
  console.log('No SUPABASE_SERVICE_ROLE_KEY found, some admin operations will be unavailable');
}

async function checkBuckets() {
  console.log(`
========================================================
  SUPABASE BUCKET PERMISSION CHECK
========================================================
`);

  // 1. Check if buckets exist
  console.log('1. Checking for storage buckets existence:');
  let buckets = [];
  
  try {
    // Use admin client if available, otherwise use anon client
    const client = supabaseAdmin || supabaseAnon;
    const { data, error } = await client.storage.listBuckets();
    
    if (error) {
      console.error(`   ❌ Error listing buckets: ${error.message}`);
      if (error.message.includes('permission')) {
        console.log('     You might need a service role key to list buckets');
      }
    } else {
      buckets = data || [];
      console.log(`   ✅ Found ${buckets.length} buckets in your Supabase project`);
      
      // Display bucket details
      buckets.forEach(bucket => {
        console.log(`     - ${bucket.name} (public: ${bucket.public ? 'yes' : 'no'})`);
      });
    }
  } catch (error) {
    console.error(`   ❌ Error getting buckets: ${error.message}`);
  }
  
  // 2. Check for the required buckets
  console.log('\n2. Checking required buckets:');
  const requiredBuckets = ['videos', 'thumbnails'];
  
  requiredBuckets.forEach(bucketName => {
    const bucket = buckets.find(b => b.name === bucketName);
    
    if (bucket) {
      console.log(`   ✅ '${bucketName}' bucket exists (public: ${bucket.public ? 'yes' : 'no'})`);
      
      if (!bucket.public) {
        console.log(`   ⚠️ Warning: '${bucketName}' bucket is not public, files may not be accessible`);
      }
    } else {
      console.log(`   ❌ '${bucketName}' bucket is missing`);
    }
  });
  
  // 3. List files in each bucket
  console.log('\n3. Checking bucket contents:');
  
  // Function to list files in a bucket
  async function listBucketFiles(bucketName) {
    try {
      // Use both clients to compare results (can help diagnose permission issues)
      const adminClient = supabaseAdmin?.storage.from(bucketName);
      const anonClient = supabaseAnon.storage.from(bucketName);
      
      // Admin client result (if available)
      let adminResult = null;
      if (adminClient) {
        const { data: adminData, error: adminError } = await adminClient.list('', { limit: 10 });
        
        if (adminError) {
          console.log(`   Admin client error for '${bucketName}': ${adminError.message}`);
        } else {
          adminResult = {
            count: adminData.length,
            files: adminData.map(file => file.name)
          };
        }
      }
      
      // Anon client result
      const { data: anonData, error: anonError } = await anonClient.list('', { limit: 10 });
      
      if (anonError) {
        console.log(`   ❌ Cannot list files in '${bucketName}' (anonymous client): ${anonError.message}`);
        
        if (adminResult) {
          console.log(`   ℹ️ Admin client found ${adminResult.count} files but anonymous client cannot access them`);
          console.log('     This suggests RLS policies may be blocking public access');
        }
      } else {
        console.log(`   ✅ '${bucketName}' contains ${anonData.length} files (showing max 10)`);
        
        if (anonData.length > 0) {
          console.log('     Files:');
          anonData.forEach((file, i) => {
            console.log(`       ${i + 1}. ${file.name} (${file.metadata?.mimetype || 'unknown type'})`);
          });
          
          // If we have files, test accessibility of the first one
          if (anonData.length > 0) {
            const firstFile = anonData[0].name;
            await testFileAccess(bucketName, firstFile);
          }
        } else {
          console.log('     No files found in this bucket');
        }
      }
    } catch (error) {
      console.error(`   ❌ Error checking '${bucketName}' contents: ${error.message}`);
    }
  }
  
  // Test file accessibility
  async function testFileAccess(bucketName, fileName) {
    try {
      // Get public URL for the file
      const { data } = supabaseAnon.storage.from(bucketName).getPublicUrl(fileName);
      const publicUrl = data.publicUrl;
      
      console.log(`     Testing accessibility of '${fileName}'...`);
      console.log(`     URL: ${publicUrl}`);
      
      // Try to access the file
      const response = await fetch(publicUrl, { method: 'HEAD' });
      
      if (response.ok) {
        console.log(`     ✅ File is accessible! (Status: ${response.status})`);
        console.log(`     Content-Type: ${response.headers.get('content-type')}`);
        console.log(`     Content-Length: ${response.headers.get('content-length')} bytes`);
      } else {
        console.log(`     ❌ File is not accessible (Status: ${response.status})`);
        
        if (response.status === 400) {
          console.log('     Likely cause: Bucket is not public or RLS policies are blocking access');
        } else if (response.status === 404) {
          console.log('     Likely cause: File not found or wrong path');
        } else {
          console.log(`     Error response: ${await response.text()}`);
        }
      }
    } catch (error) {
      console.error(`     ❌ Error testing file access: ${error.message}`);
    }
  }
  
  // Check contents of each required bucket
  for (const bucketName of requiredBuckets) {
    console.log(`\n   Checking contents of '${bucketName}' bucket:`);
    await listBucketFiles(bucketName);
  }
  
  // 4. Provide recommendations
  console.log(`\n4. Recommendations:`);
  
  // Check if we're missing buckets
  const missingBuckets = requiredBuckets.filter(
    name => !buckets.find(b => b.name === name)
  );
  
  if (missingBuckets.length > 0) {
    console.log('   ❌ You need to create the following buckets:');
    missingBuckets.forEach(name => {
      console.log(`     - ${name} (should be public)`);
    });
    console.log('   Run: node scripts/fix-supabase.js to fix this automatically');
  }
  
  // Check if we have non-public buckets
  const nonPublicBuckets = buckets
    .filter(b => requiredBuckets.includes(b.name) && !b.public);
  
  if (nonPublicBuckets.length > 0) {
    console.log('   ⚠️ The following buckets should be made public:');
    nonPublicBuckets.forEach(bucket => {
      console.log(`     - ${bucket.name}`);
    });
    console.log('   Run: node scripts/fix-supabase.js to fix this automatically');
  }
  
  // SQL statement for RLS policies
  console.log('\n   SQL Statements for RLS policies:');
  console.log(`
   -- Run these in your Supabase SQL Editor to fix permission issues:
   
   -- Make buckets publicly accessible (read)
   CREATE POLICY "Public Access" ON storage.objects
   FOR SELECT USING (bucket_id IN ('videos', 'thumbnails'));
   
   -- Allow authenticated users to upload files
   CREATE POLICY "Authenticated Upload" ON storage.objects
   FOR INSERT TO authenticated
   USING (bucket_id IN ('videos', 'thumbnails'));
  `);
}

// Run the script
checkBuckets().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});