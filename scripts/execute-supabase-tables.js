/**
 * Script to execute the Supabase tables SQL script against a Supabase database
 * 
 * This script:
 * 1. Connects to Supabase using the service role key
 * 2. Reads the create-supabase-tables.sql file
 * 3. Executes the SQL script against the Supabase database
 * 4. Verifies that tables were created successfully
 * 
 * Usage: node scripts/execute-supabase-tables.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

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

// Initialize Supabase client with service role key for admin privileges
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(`${colors.red}${colors.bright}Error: Missing Supabase credentials in environment variables${colors.reset}`);
  console.error(`Make sure you have the following in your .env file:`);
  console.error(`- SUPABASE_URL`);
  console.error(`- SUPABASE_SERVICE_ROLE_KEY`);
  process.exit(1);
}

// Create the Supabase client with admin privileges
const supabase = createClient(supabaseUrl, supabaseKey);

// Function to check if a specific table exists in the database
async function checkTableExists(tableName) {
  try {
    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        return false;
      }
      throw error;
    }
    return true;
  } catch (error) {
    if (error.message.includes('relation') && error.message.includes('does not exist')) {
      return false;
    }
    throw error;
  }
}

// Main execution function
async function executeTablesScript() {
  console.log(`${colors.cyan}${colors.bright}
===============================================================
  CREATING TABLES IN SUPABASE
===============================================================${colors.reset}`);

  try {
    // Check if tables already exist
    const tables = [
      'users',
      'videos',
      'comments',
      'video_sharing',
      'student_teacher_relationships',
      'notifications',
      'guest_invitations'
    ];

    console.log(`\n${colors.blue}Checking for existing tables...${colors.reset}`);
    
    const existingTables = [];
    const missingTables = [];
    
    for (const table of tables) {
      const exists = await checkTableExists(table);
      if (exists) {
        existingTables.push(table);
        console.log(`${colors.green}✓ Table '${table}' already exists${colors.reset}`);
      } else {
        missingTables.push(table);
        console.log(`${colors.yellow}✗ Table '${table}' does not exist${colors.reset}`);
      }
    }

    if (existingTables.length === tables.length) {
      console.log(`\n${colors.green}${colors.bright}All tables already exist! No action needed.${colors.reset}`);
      return;
    }

    // Read the SQL script
    const sqlFilePath = path.join(__dirname, 'create-supabase-tables.sql');
    console.log(`\n${colors.blue}Reading SQL script from: ${sqlFilePath}${colors.reset}`);
    
    if (!fs.existsSync(sqlFilePath)) {
      console.error(`${colors.red}Error: SQL file not found at ${sqlFilePath}${colors.reset}`);
      process.exit(1);
    }
    
    const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');
    console.log(`${colors.green}✓ SQL script read successfully (${sqlScript.length} bytes)${colors.reset}`);

    // Execute the SQL script
    console.log(`\n${colors.blue}Executing SQL script against Supabase...${colors.reset}`);
    console.log(`${colors.yellow}This may take a few moments...${colors.reset}`);

    // Use the special SQL interface to execute raw SQL
    const { error } = await supabase.rpc('exec_sql', { query: sqlScript });
    
    if (error) {
      console.error(`${colors.red}${colors.bright}Failed to execute SQL script:${colors.reset}`, error);
      
      if (error.message.includes('function "exec_sql" does not exist')) {
        console.error(`${colors.red}${colors.bright}
The 'exec_sql' function doesn't exist in your Supabase instance.
You need to run this SQL on the Supabase dashboard instead:
  1. Go to your Supabase dashboard
  2. Go to the SQL Editor
  3. Create a new query
  4. Paste the contents of create-supabase-tables.sql
  5. Run the query${colors.reset}`);
      }
      
      process.exit(1);
    }

    // Verify tables were created
    console.log(`\n${colors.blue}Verifying tables were created...${colors.reset}`);
    
    let allCreated = true;
    for (const table of missingTables) {
      const exists = await checkTableExists(table);
      if (exists) {
        console.log(`${colors.green}✓ Table '${table}' created successfully${colors.reset}`);
      } else {
        console.log(`${colors.red}✗ Table '${table}' was not created${colors.reset}`);
        allCreated = false;
      }
    }

    if (allCreated) {
      console.log(`\n${colors.green}${colors.bright}✅ All tables created successfully!${colors.reset}`);
    } else {
      console.log(`\n${colors.yellow}${colors.bright}⚠️ Some tables were not created. You may need to run the SQL script manually in the Supabase dashboard.${colors.reset}`);
    }

  } catch (error) {
    console.error(`${colors.red}${colors.bright}❌ Error executing script:${colors.reset}`, error);
    
    if (error.message.includes('function "exec_sql" does not exist')) {
      console.error(`${colors.red}${colors.bright}
The 'exec_sql' function doesn't exist in your Supabase instance.
You need to run this SQL on the Supabase dashboard instead:
  1. Go to your Supabase dashboard
  2. Go to the SQL Editor
  3. Create a new query
  4. Paste the contents of create-supabase-tables.sql
  5. Run the query${colors.reset}`);
    }
    
    process.exit(1);
  }
}

// Execute the main function
executeTablesScript();