#!/usr/bin/env node

/**
 * Environment Variables Fix Script
 * 
 * This script fixes common issues with environment variables,
 * particularly ensuring that server and client-side Supabase 
 * credentials match.
 * 
 * Run this script with: node scripts/fix-env.js
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env file if present
const envPath = path.resolve(process.cwd(), '.env');

if (!fs.existsSync(envPath)) {
  console.error('❌ No .env file found! Please run check-env.js first to create one.');
  process.exit(1);
}

console.log('📁 Found .env file, loading variables...');
dotenv.config({ path: envPath });

// Read the current .env file content
let envContent = fs.readFileSync(envPath, 'utf8');

// Fix URL mismatch
if (process.env.SUPABASE_URL && (!process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL !== process.env.VITE_SUPABASE_URL)) {
  console.log('🔄 Synchronizing VITE_SUPABASE_URL with SUPABASE_URL...');
  
  // Replace or add VITE_SUPABASE_URL with SUPABASE_URL value
  const supabaseUrl = process.env.SUPABASE_URL;
  
  // Check if VITE_SUPABASE_URL already exists in the file
  if (envContent.includes('VITE_SUPABASE_URL=')) {
    // Replace existing value
    envContent = envContent.replace(
      /VITE_SUPABASE_URL=.*/g,
      `VITE_SUPABASE_URL=${supabaseUrl}`
    );
  } else {
    // Add new entry
    envContent += `\nVITE_SUPABASE_URL=${supabaseUrl}`;
  }
  
  console.log(`✅ Updated VITE_SUPABASE_URL to match SUPABASE_URL`);
}

// Fix ANON KEY mismatch
if (process.env.SUPABASE_ANON_KEY && (!process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY !== process.env.VITE_SUPABASE_ANON_KEY)) {
  console.log('🔄 Synchronizing VITE_SUPABASE_ANON_KEY with SUPABASE_ANON_KEY...');
  
  // Replace or add VITE_SUPABASE_ANON_KEY with SUPABASE_ANON_KEY value
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  
  // Check if VITE_SUPABASE_ANON_KEY already exists in the file
  if (envContent.includes('VITE_SUPABASE_ANON_KEY=')) {
    // Replace existing value
    envContent = envContent.replace(
      /VITE_SUPABASE_ANON_KEY=.*/g,
      `VITE_SUPABASE_ANON_KEY=${supabaseAnonKey}`
    );
  } else {
    // Add new entry
    envContent += `\nVITE_SUPABASE_ANON_KEY=${supabaseAnonKey}`;
  }
  
  console.log(`✅ Updated VITE_SUPABASE_ANON_KEY to match SUPABASE_ANON_KEY`);
}

// Write updated content back to .env file
fs.writeFileSync(envPath, envContent);

console.log('✅ Environment variables updated successfully!');
console.log('ℹ️ Please restart your application for changes to take effect.');