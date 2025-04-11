/**
 * Script to check the Supabase connection
 * Verifies: 
 * 1. Environment variables are set
 * 2. Connection to Supabase is successful
 * 3. Required tables exist
 */

import 'dotenv/config';
import { supabase } from '../supabase/node-client';

// Main function
async function checkConnection() {
  console.log('Checking Supabase connection...');
  
  // 1. Check environment variables
  console.log('\n1. Checking environment variables:');
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl) {
    console.error('❌ SUPABASE_URL is not set in .env file');
    return;
  }
  console.log('✅ SUPABASE_URL is set');
  
  if (!supabaseKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY is not set in .env file');
    return;
  }
  console.log('✅ SUPABASE_SERVICE_ROLE_KEY is set');
  
  // Check client-side variables
  console.log('\nChecking client-side variables:');
  const clientUrl = process.env.VITE_SUPABASE_URL;
  const clientKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!clientUrl) {
    console.error('❌ VITE_SUPABASE_URL is not set in .env file');
  } else {
    console.log('✅ VITE_SUPABASE_URL is set');
  }
  
  if (!clientKey) {
    console.error('❌ VITE_SUPABASE_ANON_KEY is not set in .env file');
  } else {
    console.log('✅ VITE_SUPABASE_ANON_KEY is set');
  }
  
  // 2. Check connection to Supabase
  console.log('\n2. Testing connection to Supabase:');
  try {
    const { data, error } = await supabase.from('users').select('count()', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Connection failed:', error.message);
      return;
    }
    
    console.log('✅ Successfully connected to Supabase');
  } catch (error) {
    console.error('❌ Connection error:', error.message);
    return;
  }
  
  // 3. Check if required tables exist
  console.log('\n3. Checking required tables:');
  const requiredTables = [
    'users',
    'videos',
    'comments',
    'video_shares',
    'relationships',
    'notifications'
  ];
  
  for (const table of requiredTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('count()', { count: 'exact', head: true });
      
      if (error && error.code === '42P01') { // Table does not exist
        console.error(`❌ Table '${table}' does not exist`);
      } else if (error) {
        console.error(`❌ Error checking table '${table}':`, error.message);
      } else {
        console.log(`✅ Table '${table}' exists`);
      }
    } catch (error) {
      console.error(`❌ Error checking table '${table}':`, error.message);
    }
  }
  
  console.log('\nCheck complete.');
}

// Run the checks
checkConnection().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});