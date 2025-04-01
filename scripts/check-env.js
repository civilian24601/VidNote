#!/usr/bin/env node

/**
 * Environment Variable Check Script
 * 
 * This script performs a comprehensive check of all required
 * environment variables for both server and client sides of the application.
 * 
 * Run this script with: node scripts/check-env.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { dirname } from 'path';

// Load environment variables from .env file if present
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  console.log('📁 Found .env file, loading variables...');
  dotenv.config({ path: envPath });
} else {
  console.warn('⚠️ No .env file found in project root. Creating template file...');
  
  // Create a template .env file
  const templateContent = `# Supabase Configuration
# IMPORTANT: Replace these placeholder values with your actual credentials

# Server-side variables (not exposed to the browser)
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Client-side variables (accessible in browser)
# These must be prefixed with VITE_ to be exposed to the client
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# NOTE: For development, the URL and anon key values should be the same in both sections
# In production, you would never expose the service role key to the client
`;
  
  fs.writeFileSync(envPath, templateContent);
  console.log('✅ Created template .env file at project root');
  console.log('   Please edit this file and add your Supabase credentials');
}

// Required environment variables
const requiredVars = {
  server: ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'],
  client: ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY']
};

// Helper function to check environment variables
function checkEnvVars(type, varList) {
  console.log(`\n🔍 Checking ${type}-side environment variables:`);
  
  const missing = [];
  const present = [];
  
  varList.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
      console.log(`  ❌ ${varName}: Missing`);
    } else {
      present.push(varName);
      // For security, don't show actual values
      const truncatedValue = process.env[varName].length > 10 
        ? process.env[varName].substring(0, 5) + '...' + process.env[varName].substring(process.env[varName].length - 5) 
        : '[value too short to display safely]';
      
      console.log(`  ✅ ${varName}: Present (${truncatedValue})`);
    }
  });
  
  return { missing, present };
}

// Check server-side variables
const serverCheck = checkEnvVars('Server', requiredVars.server);

// Check client-side variables
const clientCheck = checkEnvVars('Client', requiredVars.client);

// Verify if server variables match client variables where they should
if (serverCheck.present.includes('SUPABASE_URL') && clientCheck.present.includes('VITE_SUPABASE_URL')) {
  if (process.env.SUPABASE_URL !== process.env.VITE_SUPABASE_URL) {
    console.log('\n⚠️ Warning: SUPABASE_URL and VITE_SUPABASE_URL have different values!');
    console.log('   For this application, they should be identical.');
  }
}

if (serverCheck.present.includes('SUPABASE_ANON_KEY') && clientCheck.present.includes('VITE_SUPABASE_ANON_KEY')) {
  if (process.env.SUPABASE_ANON_KEY !== process.env.VITE_SUPABASE_ANON_KEY) {
    console.log('\n⚠️ Warning: SUPABASE_ANON_KEY and VITE_SUPABASE_ANON_KEY have different values!');
    console.log('   For this application, they should be identical.');
  }
}

// Check URL format
if (process.env.SUPABASE_URL) {
  const url = process.env.SUPABASE_URL;
  const isValidFormat = url.startsWith('https://') && url.includes('.supabase.co');
  
  if (!isValidFormat) {
    console.log('\n⚠️ Warning: SUPABASE_URL format may be incorrect');
    console.log('   Expected format: https://your-project-id.supabase.co');
    console.log(`   Current value: ${url}`);
  }
}

// Summary and remediation steps
if (serverCheck.missing.length > 0 || clientCheck.missing.length > 0) {
  console.log('\n❌ Some required environment variables are missing!');
  console.log('\n📋 Remediation Steps:');
  console.log('  1. Edit your .env file at the project root');
  console.log('  2. Add values for the missing variables');
  console.log('  3. Restart your application');
  console.log('\n💡 Where to find these values:');
  console.log('  • Log in to your Supabase dashboard at https://app.supabase.com');
  console.log('  • Select your project');
  console.log('  • Go to Project Settings > API');
  console.log('  • Copy the "URL", "anon public" and "service_role" keys');
  
  process.exit(1);
} else {
  console.log('\n✅ All required environment variables are present!');
  
  // Supabase Storage Bucket Check
  console.log('\n📦 Supabase Storage Buckets:');
  console.log('  Make sure you have created the following storage buckets in your Supabase project:');
  console.log('  • videos');
  console.log('  • thumbnails');
  console.log('\n  You can set these up in the Supabase dashboard under Storage.');
  
  process.exit(0);
}