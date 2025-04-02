/**
 * Script to check if Supabase tables exist
 * This helps debug issues with the database connection
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Initialize .env
dotenv.config();

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Get Supabase credentials from environment
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error(`${colors.red}${colors.bright}Error: Missing SUPABASE_URL in environment variables${colors.reset}`);
  process.exit(1);
}

if (!supabaseKey) {
  console.error(`${colors.red}${colors.bright}Error: Missing SUPABASE_SERVICE_ROLE_KEY in environment variables${colors.reset}`);
  process.exit(1);
}

// Create Supabase client
console.log(`${colors.blue}Creating Supabase client with URL: ${supabaseUrl.substring(0, 20)}...${colors.reset}`);
const supabase = createClient(supabaseUrl, supabaseKey);

// Check each table
async function checkTable(tableName) {
  try {
    console.log(`${colors.blue}Checking table: ${tableName}...${colors.reset}`);
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      if (error.message && error.message.includes('does not exist')) {
        console.log(`${colors.red}❌ Table '${tableName}' DOES NOT EXIST${colors.reset}`);
        return false;
      }
      console.error(`${colors.red}Error checking table ${tableName}: ${error.message}${colors.reset}`);
      return false;
    }
    
    console.log(`${colors.green}✅ Table '${tableName}' EXISTS with ${count} rows${colors.reset}`);
    return true;
  } catch (error) {
    console.error(`${colors.red}Exception checking table ${tableName}: ${error.message}${colors.reset}`);
    return false;
  }
}

// Check all tables
async function checkAllTables() {
  const tables = [
    'users',
    'videos',
    'comments',
    'video_sharing',
    'student_teacher_relationships',
    'notifications',
    'guest_invitations'
  ];
  
  console.log(`${colors.cyan}${colors.bright}
===============================================================
  CHECKING SUPABASE TABLES
===============================================================${colors.reset}`);
  
  let existingTables = 0;
  let missingTables = 0;
  
  for (const table of tables) {
    const exists = await checkTable(table);
    if (exists) {
      existingTables++;
    } else {
      missingTables++;
    }
  }
  
  console.log(`\n${colors.blue}Results:${colors.reset}`);
  console.log(`${colors.green}- ${existingTables} tables exist${colors.reset}`);
  console.log(`${colors.red}- ${missingTables} tables are missing${colors.reset}`);
  
  if (missingTables > 0) {
    console.log(`\n${colors.yellow}${colors.bright}
You need to create the missing tables by running:
node scripts/setup-supabase-db.js

Or running the SQL script directly in the Supabase Dashboard:
1. Go to your Supabase dashboard
2. Click on "SQL Editor" in the left menu
3. Create a new query
4. Paste the contents of scripts/create-supabase-tables.sql
5. Run the query${colors.reset}`);
  } else {
    console.log(`\n${colors.green}${colors.bright}✅ All tables are properly created!${colors.reset}`);
  }
}

// Run check and output detailed diagnostics
async function checkSupabaseConfiguration() {
  try {
    // Verify supabase connection
    console.log(`${colors.blue}Verifying Supabase connection...${colors.reset}`);
    
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error(`${colors.red}Authentication error: ${error.message}${colors.reset}`);
      } else {
        console.log(`${colors.green}✅ Supabase connection successful${colors.reset}`);
      }
    } catch (error) {
      console.error(`${colors.red}Failed to connect to Supabase: ${error.message}${colors.reset}`);
      process.exit(1);
    }
    
    // Run actual table checks
    await checkAllTables();
    
    // Check Supabase storage buckets
    console.log(`\n${colors.blue}Checking Supabase storage buckets...${colors.reset}`);
    
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets();
      
      if (error) {
        console.error(`${colors.red}Error listing buckets: ${error.message}${colors.reset}`);
      } else if (buckets && buckets.length > 0) {
        console.log(`${colors.green}✅ Storage buckets found: ${buckets.length}${colors.reset}`);
        
        for (const bucket of buckets) {
          console.log(`${colors.green}- ${bucket.name} (${bucket.public ? 'public' : 'private'})${colors.reset}`);
        }
      } else {
        console.log(`${colors.yellow}⚠️ No storage buckets found${colors.reset}`);
      }
    } catch (error) {
      console.error(`${colors.red}Exception checking storage buckets: ${error.message}${colors.reset}`);
    }
    
  } catch (error) {
    console.error(`${colors.red}${colors.bright}Error: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Execute the main function
checkSupabaseConfiguration();