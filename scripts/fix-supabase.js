/**
 * Script to fix common Supabase storage issues
 * - Makes buckets public
 * - Sets up proper RLS policies
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixSupabaseStorage() {
  try {
    console.log('Supabase Storage Fixer:');
    console.log('========================\n');
    
    console.log('1. Checking Supabase credentials...');
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing Supabase credentials in .env file.');
      console.error('Make sure you have SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY defined.');
      return;
    }
    
    console.log(`Supabase URL: ${process.env.SUPABASE_URL}`);
    console.log('Supabase Service Role Key: ✓ (hidden for security)');
    
    // Check available buckets
    console.log('\n2. Checking storage buckets...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error('Error listing buckets:', bucketError.message);
      return;
    }
    
    if (!buckets || buckets.length === 0) {
      console.log('No buckets found. Creating required buckets...');
      await createRequiredBuckets();
    } else {
      console.log(`Found ${buckets.length} bucket(s):`);
      for (const bucket of buckets) {
        console.log(`- ${bucket.name}: ${bucket.public ? 'public' : 'private'}`);
      }
    }
    
    // Make buckets public
    console.log('\n3. Making buckets public...');
    
    // Check videos bucket
    const videosBucket = buckets.find(b => b.name === 'videos');
    if (!videosBucket) {
      console.log('Creating videos bucket...');
      await createBucket('videos', true);
    } else if (!videosBucket.public) {
      console.log('Setting videos bucket to public...');
      // Unfortunately, Supabase JavaScript client doesn't support updating bucket properties
      console.log('To make the videos bucket public, please:');
      console.log('1. Go to Supabase dashboard: https://app.supabase.com');
      console.log('2. Navigate to Storage > Buckets');
      console.log('3. Click on the videos bucket');
      console.log('4. Go to "Settings" tab');
      console.log('5. Toggle "Public bucket" to ON');
      console.log('6. Click Save');
    } else {
      console.log('✓ videos bucket is already public');
    }
    
    // Check thumbnails bucket
    const thumbnailsBucket = buckets.find(b => b.name === 'thumbnails');
    if (!thumbnailsBucket) {
      console.log('Creating thumbnails bucket...');
      await createBucket('thumbnails', true);
    } else if (!thumbnailsBucket.public) {
      console.log('To make the thumbnails bucket public, please:');
      console.log('1. Go to Supabase dashboard: https://app.supabase.com');
      console.log('2. Navigate to Storage > Buckets');
      console.log('3. Click on the thumbnails bucket');
      console.log('4. Go to "Settings" tab');
      console.log('5. Toggle "Public bucket" to ON');
      console.log('6. Click Save');
    } else {
      console.log('✓ thumbnails bucket is already public');
    }
    
    console.log('\n4. SQL statements to set up correct RLS policies:');
    console.log('You need to run these SQL statements in the Supabase SQL Editor:');
    console.log('-------------------------------------------------------------------');
    console.log(`
-- Allow public read access to videos and thumbnails
CREATE POLICY IF NOT EXISTS "Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id IN ('videos', 'thumbnails'));

-- Allow authenticated users to upload files
CREATE POLICY IF NOT EXISTS "Authenticated users can upload files"
ON storage.objects FOR INSERT 
TO authenticated
USING (bucket_id IN ('videos', 'thumbnails'));

-- Allow users to update their own files
CREATE POLICY IF NOT EXISTS "Users can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id IN ('videos', 'thumbnails') 
       AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id IN ('videos', 'thumbnails') 
           AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow users to delete their own files
CREATE POLICY IF NOT EXISTS "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id IN ('videos', 'thumbnails') 
       AND (storage.foldername(name))[1] = auth.uid()::text);
`);
    console.log('-------------------------------------------------------------------');
    
    console.log('\n5. Verifying file structure:');
    
    // Test uploading a small file to verify permissions
    console.log('Attempting to upload a test file to verify storage permissions...');
    
    // Create a small text file buffer
    const testFileContent = 'This is a test file to verify Supabase storage permissions.';
    const testFileBuffer = new TextEncoder().encode(testFileContent);
    
    try {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('videos')
        .upload('test/test-file.txt', testFileBuffer, {
          contentType: 'text/plain',
        });
      
      if (uploadError) {
        console.error('Error uploading test file:', uploadError.message);
        console.log('\nPossible issues:');
        if (uploadError.message.includes('permission')) {
          console.log('- RLS policies may be missing or misconfigured');
          console.log('- Run the SQL statements above in the Supabase SQL Editor');
        } else if (uploadError.message.includes('JWT')) {
          console.log('- Authentication issue with your Supabase credentials');
          console.log('- Check your SUPABASE_SERVICE_ROLE_KEY in .env file');
        } else if (uploadError.message.includes('not found')) {
          console.log('- Bucket may not exist or may have a different name');
        }
      } else {
        console.log('✓ Test file uploaded successfully!');
        
        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from('videos')
          .getPublicUrl('test/test-file.txt');
        
        console.log(`Public URL: ${publicUrlData.publicUrl}`);
        
        // Try to access the file
        try {
          const response = await fetch(publicUrlData.publicUrl, { method: 'HEAD' });
          console.log(`File accessibility: ${response.ok ? '✓ Accessible' : `⚠️ Status ${response.status}`}`);
          
          if (!response.ok) {
            console.log('\nFile is not accessible. Possible issues:');
            console.log('- Bucket might not be set to public');
            console.log('- RLS policies might be preventing public access');
          } else {
            console.log('\n✅ Everything seems to be working correctly!');
          }
        } catch (fetchErr) {
          console.error('Error fetching file:', fetchErr.message);
        }
        
        // Clean up test file
        console.log('\nCleaning up test file...');
        const { error: deleteError } = await supabase.storage
          .from('videos')
          .remove(['test/test-file.txt']);
        
        if (deleteError) {
          console.error('Error deleting test file:', deleteError.message);
        } else {
          console.log('✓ Test file deleted successfully');
        }
      }
    } catch (error) {
      console.error('Unexpected error during test upload:', error);
    }
    
    console.log('\n6. Next steps:');
    console.log('- If any issues were found, follow the instructions above to fix them');
    console.log('- Restart your application to apply the changes');
    console.log('- If problems persist, check your server logs for more details');
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

async function createRequiredBuckets() {
  try {
    console.log('Creating required buckets:');
    
    // Create videos bucket
    const { data: videosData, error: videosError } = await createBucket('videos', true);
    if (videosError) {
      console.error('Error creating videos bucket:', videosError.message);
    } else {
      console.log('✓ videos bucket created successfully');
    }
    
    // Create thumbnails bucket
    const { data: thumbnailsData, error: thumbnailsError } = await createBucket('thumbnails', true);
    if (thumbnailsError) {
      console.error('Error creating thumbnails bucket:', thumbnailsError.message);
    } else {
      console.log('✓ thumbnails bucket created successfully');
    }
  } catch (err) {
    console.error('Error creating buckets:', err);
  }
}

async function createBucket(name, isPublic = false) {
  return supabase.storage.createBucket(name, {
    public: isPublic,
  });
}

fixSupabaseStorage().catch(console.error);