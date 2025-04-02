/**
 * Script to check Supabase bucket permissions and contents
 * This will help diagnose issues with video playback
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkBuckets() {
  try {
    console.log('Supabase Bucket Information:');
    console.log('===========================\n');
    
    // Check if buckets exist
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error('Error listing buckets:', bucketError.message);
      return;
    }
    
    console.log(`Found ${buckets.length} bucket(s):`);
    for (const bucket of buckets) {
      console.log(`- ${bucket.name}: ${bucket.public ? 'public' : 'private'}`);
    }
    
    // Find the videos bucket
    const videosBucket = buckets.find(b => b.name === 'videos');
    if (!videosBucket) {
      console.error('\nVideos bucket not found! Please create it in Supabase.');
      return;
    }
    
    // Check videos bucket privacy setting
    if (!videosBucket.public) {
      console.warn('\n⚠️ WARNING: The videos bucket is set to private. Consider making it public for easier video access.');
      console.warn('You can change this in the Supabase dashboard under Storage > Buckets > videos > Settings > Public bucket');
    }
    
    // List contents at root level
    console.log('\nListing top-level content in videos bucket:');
    const { data: rootContents, error: rootError } = await supabase.storage
      .from('videos')
      .list();
      
    if (rootError) {
      console.error('Error listing root contents:', rootError.message);
    } else if (rootContents.length === 0) {
      console.log('  (empty)');
    } else {
      for (const item of rootContents) {
        if (item.id) {
          console.log(`- ${item.name} (${item.id})`);
          
          // If it's a folder, check its contents
          if (!item.name.includes('.')) {
            const { data: folderContents, error: folderError } = await supabase.storage
              .from('videos')
              .list(item.name);
              
            if (folderError) {
              console.error(`  Error listing contents of ${item.name}/: ${folderError.message}`);
            } else if (folderContents.length === 0) {
              console.log(`  ${item.name}/ (empty folder)`);
            } else {
              console.log(`  ${item.name}/ contains ${folderContents.length} file(s):`);
              for (const file of folderContents) {
                console.log(`    - ${file.name}`);
                
                // Try to get a signed URL for this file to check permissions
                const { data: signedUrlData, error: signedUrlError } = await supabase.storage
                  .from('videos')
                  .createSignedUrl(`${item.name}/${file.name}`, 60);
                  
                if (signedUrlError) {
                  console.error(`      ⚠️ Cannot create signed URL: ${signedUrlError.message}`);
                } else {
                  console.log(`      ✓ Signed URL created successfully (expires in 60s)`);
                  console.log(`      URL: ${signedUrlData.signedUrl}`);
                }
                
                // Also try to get a public URL
                const { data: publicUrlData } = supabase.storage
                  .from('videos')
                  .getPublicUrl(`${item.name}/${file.name}`);
                  
                console.log(`      Public URL: ${publicUrlData.publicUrl}`);
                
                // Test if URL is accessible
                try {
                  const response = await fetch(publicUrlData.publicUrl, { method: 'HEAD' });
                  console.log(`      Public URL access: ${response.ok ? '✓ Accessible' : `⚠️ Status ${response.status}`}`);
                } catch (fetchErr) {
                  console.error(`      ⚠️ Error fetching public URL: ${fetchErr.message}`);
                }
              }
            }
          }
        }
      }
    }
    
    // Check RLS policies
    console.log('\nChecking RLS policies for storage:');
    console.log('This can only be done manually in the Supabase dashboard.');
    console.log('Go to: Dashboard > Storage > Policies');
    console.log('Ensure you have policies that allow:');
    console.log('1. SELECT (read) access should be PUBLIC for public bucket');
    console.log('2. INSERT (upload) should be for authenticated users');
    
    console.log('\nFor reference, here are the recommended RLS policies:');
    console.log(`
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id IN ('videos', 'thumbnails'));

CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT 
TO authenticated
USING (bucket_id IN ('videos', 'thumbnails'));

CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id IN ('videos', 'thumbnails') 
       AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id IN ('videos', 'thumbnails') 
           AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id IN ('videos', 'thumbnails') 
       AND (storage.foldername(name))[1] = auth.uid()::text);
`);
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

checkBuckets().catch(console.error);