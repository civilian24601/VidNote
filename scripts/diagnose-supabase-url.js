/**
 * Supabase URL Diagnostic Script
 * 
 * This script helps diagnose Supabase URL access issues by:
 * 1. Checking environment variables
 * 2. Validating Supabase URL format
 * 3. Testing direct access to the URL
 * 4. Checking CORS headers
 * 5. Verifying public bucket permissions
 * 
 * To use: node scripts/diagnose-supabase-url.js
 */

require('dotenv').config();
const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');

// Logging utility
const logSection = (title) => {
  console.log('\n' + '='.repeat(80));
  console.log(`${title}`);
  console.log('='.repeat(80));
};

async function checkUrl(url, options = {}) {
  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      ...options
    });
    
    return {
      status: response.status,
      ok: response.ok,
      statusText: response.statusText,
      headers: Object.fromEntries([...response.headers.entries()])
    };
  } catch (error) {
    return {
      error: true,
      message: error.message
    };
  }
}

async function diagnoseSupabaseUrl() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
  
  logSection('Environment Variables Check');
  
  // Environment check
  if (!supabaseUrl) {
    console.error('❌ SUPABASE_URL is not defined in your environment');
    process.exit(1);
  }
  
  if (!supabaseKey) {
    console.error('❌ SUPABASE_ANON_KEY is not defined in your environment');
    process.exit(1);
  }
  
  console.log('✅ Supabase URL: ', supabaseUrl);
  console.log('✅ Supabase Keys present: ', Boolean(supabaseKey));
  
  // URL format validation
  logSection('URL Format Validation');
  
  if (!supabaseUrl.startsWith('https://')) {
    console.error('❌ Supabase URL must start with https://');
  } else {
    console.log('✅ URL uses HTTPS protocol');
  }
  
  if (supabaseUrl.includes('supabase.co') || supabaseUrl.includes('supabase.in')) {
    console.log('✅ URL contains valid Supabase domain');
  } else {
    console.warn('⚠️ URL does not contain standard Supabase domain (supabase.co or supabase.in)');
  }
  
  // Check direct access to Supabase URL
  logSection('Supabase Server Accessibility');
  
  console.log('Testing direct access to Supabase server...');
  const serverResult = await checkUrl(supabaseUrl);
  
  if (serverResult.error) {
    console.error(`❌ Cannot access Supabase server: ${serverResult.message}`);
  } else {
    console.log(`✅ Supabase server is accessible (Status: ${serverResult.status})`);
    console.log('Response headers:');
    console.log(JSON.stringify(serverResult.headers, null, 2));
  }
  
  // Initialize Supabase client
  logSection('Supabase Client Test');
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client initialized successfully');
    
    // Test admin client if service key is available
    if (supabaseServiceKey) {
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
      console.log('✅ Supabase admin client initialized successfully');
      
      // Test listing buckets
      try {
        const { data: buckets, error } = await supabaseAdmin.storage.listBuckets();
        
        if (error) {
          console.error('❌ Failed to list storage buckets:', error.message);
        } else {
          console.log(`✅ Successfully listed ${buckets.length} storage buckets`);
          
          const videosBucket = buckets.find(b => b.name === 'videos');
          if (videosBucket) {
            console.log(`✅ 'videos' bucket exists and is ${videosBucket.public ? 'public' : 'private'}`);
          } else {
            console.error(`❌ 'videos' bucket not found!`);
          }
        }
      } catch (bucketError) {
        console.error('❌ Error when accessing storage buckets:', bucketError.message);
      }
    } else {
      console.warn('⚠️ No service key available, skipping admin client tests');
    }
    
    // Test storage functionality
    logSection('Storage URL Generation Test');
    
    try {
      // Test URL generation with a mock path
      const testPath = 'public/test_file.mp4';
      const { data: urlData } = supabase.storage.from('videos').getPublicUrl(testPath);
      
      console.log('Generated public URL:', urlData.publicUrl);
      
      const urlParts = new URL(urlData.publicUrl);
      console.log('URL analysis:');
      console.log(`- Protocol: ${urlParts.protocol}`);
      console.log(`- Host: ${urlParts.host}`);
      console.log(`- Pathname: ${urlParts.pathname}`);
      console.log(`- Contains bucket name 'videos': ${urlData.publicUrl.includes('videos')}`);
      console.log(`- Contains file path '${testPath}': ${urlData.publicUrl.includes(testPath)}`);
      
      // Test URL accessibility
      console.log('\nTesting URL accessibility (this should fail for a non-existent file)...');
      const urlAccessResult = await checkUrl(urlData.publicUrl);
      
      if (urlAccessResult.error) {
        console.warn(`⚠️ URL access test result: ${urlAccessResult.message}`);
      } else {
        console.log(`URL access status: ${urlAccessResult.status} (${urlAccessResult.statusText})`);
        
        if (urlAccessResult.status === 404) {
          console.log('✅ Expected 404 for non-existent file, URL format appears correct');
        } else if (urlAccessResult.status === 403) {
          console.warn('⚠️ Received 403 Forbidden - bucket may have restricted permissions');
        }
      }
      
      // CORS check
      console.log('\nChecking CORS headers...');
      const corsResult = await checkUrl(urlData.publicUrl, {
        headers: {
          'Origin': 'http://localhost:3000'
        }
      });
      
      if (corsResult.error) {
        console.warn(`⚠️ CORS check error: ${corsResult.message}`);
      } else {
        const corsHeaders = {
          'access-control-allow-origin': corsResult.headers['access-control-allow-origin'],
          'access-control-allow-methods': corsResult.headers['access-control-allow-methods'],
          'access-control-allow-headers': corsResult.headers['access-control-allow-headers']
        };
        
        console.log('CORS Headers:', corsHeaders);
        
        if (corsHeaders['access-control-allow-origin']) {
          console.log('✅ CORS is properly configured');
        } else {
          console.warn('⚠️ CORS headers not detected, might cause browser access issues');
        }
      }
      
    } catch (urlError) {
      console.error('❌ Error generating public URL:', urlError.message);
    }
    
  } catch (clientError) {
    console.error('❌ Failed to initialize Supabase client:', clientError.message);
  }
  
  logSection('Diagnosis Summary');
  console.log(`
Possible Supabase URL issues:

1. If you can't access the Supabase server directly, check:
   - Network connectivity
   - Firewall settings
   - VPN issues (if applicable)

2. If URL generation works but accessing files fails:
   - Ensure 'videos' bucket exists and is set to public
   - Check RLS (Row Level Security) policies on storage
   - Verify the file path format matches what Supabase expects

3. If CORS issues are detected:
   - Configure CORS settings in Supabase Dashboard under "Storage" > "Policies"
   - Add your application domain to allowed origins
   - Enable preflight requests (OPTIONS method)

4. Common URL structure issues:
   - Bucket name should be included in URL path
   - File paths should include user-specific identifiers
   - URLs must be publicly accessible without authentication
  `);
}

// Run diagnosis
diagnoseSupabaseUrl().catch(error => {
  console.error('Diagnostic script failed:', error);
  process.exit(1);
});