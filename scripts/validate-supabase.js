#!/usr/bin/env node

/**
 * Supabase Validation Script
 * 
 * This script validates the Supabase connection and checks for required 
 * storage buckets. If they don't exist, it provides detailed instructions 
 * on how to create them.
 * 
 * Run this script with: node scripts/validate-supabase.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

// Required buckets
const REQUIRED_BUCKETS = ['videos', 'thumbnails'];

// ANSI color codes for better terminal output
const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m',
  brightWhite: '\x1b[97m',
};

async function main() {
  console.log(`${COLORS.blue}Supabase Connection Validation${COLORS.reset}`);
  console.log(`${COLORS.blue}============================${COLORS.reset}\n`);
  
  // Verify environment variables
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error(`${COLORS.red}❌ Missing required environment variables!${COLORS.reset}`);
    console.log(`${COLORS.yellow}Please run scripts/check-env.js first to set up your environment.${COLORS.reset}`);
    process.exit(1);
  }
  
  // Test URL format
  if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
    console.error(`${COLORS.red}❌ Invalid Supabase URL format: ${supabaseUrl}${COLORS.reset}`);
    console.log(`${COLORS.yellow}The URL should be in the format: https://your-project-id.supabase.co${COLORS.reset}`);
    process.exit(1);
  }
  
  console.log(`${COLORS.green}✓ URL format check passed${COLORS.reset}`);
  
  // Initialize Supabase client
  console.log(`\n${COLORS.blue}Initializing Supabase client...${COLORS.reset}`);
  let supabase;
  
  try {
    supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    console.log(`${COLORS.green}✓ Client initialized successfully${COLORS.reset}`);
  } catch (error) {
    console.error(`${COLORS.red}❌ Failed to initialize Supabase client:${COLORS.reset}`);
    console.error(`${COLORS.red}${error.message}${COLORS.reset}`);
    process.exit(1);
  }
  
  // Test connection by fetching buckets
  console.log(`\n${COLORS.blue}Testing connection by fetching storage buckets...${COLORS.reset}`);
  
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      throw error;
    }
    
    console.log(`${COLORS.green}✓ Connection successful${COLORS.reset}`);
    console.log(`${COLORS.cyan}Found ${buckets.length} buckets:${COLORS.reset}`);
    
    if (buckets.length === 0) {
      console.log(`${COLORS.yellow}No buckets exist yet.${COLORS.reset}`);
    } else {
      buckets.forEach(bucket => {
        console.log(`  - ${bucket.name}${bucket.public ? ' (public)' : ' (private)'}`);
      });
    }
    
    // Check if required buckets exist
    const existingBuckets = buckets.map(b => b.name);
    const missingBuckets = REQUIRED_BUCKETS.filter(b => !existingBuckets.includes(b));
    
    if (missingBuckets.length > 0) {
      console.log(`\n${COLORS.yellow}⚠️ Missing required buckets: ${missingBuckets.join(', ')}${COLORS.reset}`);
      
      // Ask if we should try to create the missing buckets
      console.log(`\n${COLORS.brightYellow}Would you like to create the missing buckets automatically? (Y/n)${COLORS.reset}`);
      process.stdout.write('> ');
      
      // Wait for user input (this is a synchronous approach)
      const response = await new Promise(resolve => {
        process.stdin.once('data', data => {
          resolve(data.toString().trim().toLowerCase());
        });
      });
      
      if (response === 'y' || response === 'yes' || response === '') {
        console.log(`\n${COLORS.blue}Creating missing buckets...${COLORS.reset}`);
        
        for (const bucketName of missingBuckets) {
          try {
            const { data, error } = await supabase.storage.createBucket(bucketName, {
              public: true // Making buckets public for this application
            });
            
            if (error) {
              throw error;
            }
            
            console.log(`${COLORS.green}✓ Created bucket: ${bucketName}${COLORS.reset}`);
          } catch (error) {
            console.error(`${COLORS.red}❌ Failed to create bucket ${bucketName}:${COLORS.reset}`);
            console.error(`${COLORS.red}${error.message}${COLORS.reset}`);
            
            // Show manual instructions
            showManualInstructions();
            process.exit(1);
          }
        }
        
        console.log(`\n${COLORS.brightGreen}✓ All required buckets have been created!${COLORS.reset}`);
        console.log(`${COLORS.cyan}Don't forget to configure RLS (Row Level Security) policies in the Supabase dashboard.${COLORS.reset}`);
      } else {
        // Show manual instructions for bucket creation
        showManualInstructions();
      }
    } else {
      console.log(`\n${COLORS.brightGreen}✓ All required buckets exist!${COLORS.reset}`);
    }
    
  } catch (error) {
    console.error(`${COLORS.red}❌ Connection test failed:${COLORS.reset}`);
    console.error(`${COLORS.red}${error.message}${COLORS.reset}`);
    
    // Check if error indicates authentication issues
    if (error.message.includes('JWT') || error.message.includes('token') || error.message.includes('auth') || error.message.includes('permission')) {
      console.log(`\n${COLORS.yellow}This appears to be an authentication issue. Please check:${COLORS.reset}`);
      console.log(`${COLORS.yellow}1. Your SUPABASE_SERVICE_ROLE_KEY is correct${COLORS.reset}`);
      console.log(`${COLORS.yellow}2. The key has not expired or been revoked${COLORS.reset}`);
      console.log(`${COLORS.yellow}3. Your Supabase project is active and not in maintenance mode${COLORS.reset}`);
    }
    
    process.exit(1);
  }
  
  // Everything is good!
  console.log(`\n${COLORS.brightGreen}✓ Supabase validation complete!${COLORS.reset}`);
  console.log(`${COLORS.brightGreen}Your application is ready to use Supabase storage.${COLORS.reset}`);
  
  process.exit(0);
}

function showManualInstructions() {
  console.log(`\n${COLORS.brightYellow}Manual Bucket Setup Instructions:${COLORS.reset}`);
  console.log(`${COLORS.cyan}1. Go to your Supabase dashboard: https://app.supabase.com${COLORS.reset}`);
  console.log(`${COLORS.cyan}2. Select your project${COLORS.reset}`);
  console.log(`${COLORS.cyan}3. Go to "Storage" in the left sidebar${COLORS.reset}`);
  console.log(`${COLORS.cyan}4. Click "New bucket" and create the following buckets:${COLORS.reset}`);
  
  REQUIRED_BUCKETS.forEach(bucket => {
    console.log(`${COLORS.cyan}   - ${bucket} (Make it public)${COLORS.reset}`);
  });
  
  console.log(`\n${COLORS.brightYellow}Recommended RLS (Row Level Security) Policies:${COLORS.reset}`);
  console.log(`${COLORS.white}Go to the SQL Editor in Supabase and run these queries:${COLORS.reset}`);
  
  console.log(`\n${COLORS.white}-- Allow public read access to all files in videos and thumbnails buckets${COLORS.reset}`);
  console.log(`${COLORS.white}CREATE POLICY "Public Access"${COLORS.reset}`);
  console.log(`${COLORS.white}ON storage.objects FOR SELECT${COLORS.reset}`);
  console.log(`${COLORS.white}USING (bucket_id IN ('videos', 'thumbnails'));${COLORS.reset}`);
  
  console.log(`\n${COLORS.white}-- Allow authenticated users to upload files${COLORS.reset}`);
  console.log(`${COLORS.white}CREATE POLICY "Authenticated users can upload files"${COLORS.reset}`);
  console.log(`${COLORS.white}ON storage.objects FOR INSERT${COLORS.reset}`);
  console.log(`${COLORS.white}TO authenticated${COLORS.reset}`);
  console.log(`${COLORS.white}USING (bucket_id IN ('videos', 'thumbnails'));${COLORS.reset}`);
  
  console.log(`\n${COLORS.white}-- Allow users to update their own files${COLORS.reset}`);
  console.log(`${COLORS.white}CREATE POLICY "Users can update own files"${COLORS.reset}`);
  console.log(`${COLORS.white}ON storage.objects FOR UPDATE${COLORS.reset}`);
  console.log(`${COLORS.white}TO authenticated${COLORS.reset}`);
  console.log(`${COLORS.white}USING (bucket_id IN ('videos', 'thumbnails')${COLORS.reset}`);
  console.log(`${COLORS.white}       AND (storage.foldername(name))[1] = auth.uid()::text)${COLORS.reset}`);
  console.log(`${COLORS.white}WITH CHECK (bucket_id IN ('videos', 'thumbnails')${COLORS.reset}`);
  console.log(`${COLORS.white}           AND (storage.foldername(name))[1] = auth.uid()::text);${COLORS.reset}`);
  
  console.log(`\n${COLORS.white}-- Allow users to delete their own files${COLORS.reset}`);
  console.log(`${COLORS.white}CREATE POLICY "Users can delete own files"${COLORS.reset}`);
  console.log(`${COLORS.white}ON storage.objects FOR DELETE${COLORS.reset}`);
  console.log(`${COLORS.white}TO authenticated${COLORS.reset}`);
  console.log(`${COLORS.white}USING (bucket_id IN ('videos', 'thumbnails')${COLORS.reset}`);
  console.log(`${COLORS.white}       AND (storage.foldername(name))[1] = auth.uid()::text);${COLORS.reset}`);
}

// Run the script
main().catch(err => {
  console.error(`${COLORS.brightRed}Unexpected error:${COLORS.reset}`, err);
  process.exit(1);
});