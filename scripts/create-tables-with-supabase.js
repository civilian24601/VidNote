/**
 * Script to create tables in Supabase using the Supabase client
 * 
 * This script:
 * 1. Connects to Supabase using the service role key
 * 2. Reads the SQL script from create-supabase-tables.sql
 * 3. Executes the SQL against Supabase using the rpc method
 * 
 * Usage: node scripts/create-tables-with-supabase.js
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

// Initialize .env
dotenv.config();

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Tables we're expecting to create
const EXPECTED_TABLES = [
  'users',
  'videos',
  'comments',
  'video_sharing',
  'student_teacher_relationships',
  'notifications',
  'guest_invitations'
];

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(`${colors.red}${colors.bright}Error: Missing Supabase credentials${colors.reset}`);
  console.error(`Make sure you have SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file`);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Check if table exists
async function tableExists(tableName) {
  try {
    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      if (error.message && error.message.includes('does not exist')) {
        return false;
      }
      console.error(`${colors.red}Error checking table ${tableName}:${colors.reset}`, error);
      return false;
    }
    return true;
  } catch (error) {
    console.error(`${colors.red}Error checking table ${tableName}:${colors.reset}`, error.message);
    return false;
  }
}

// Function to execute a single SQL statement
async function executeSql(sql) {
  try {
    const { data, error } = await supabase
      .rpc('pg_query', { query_text: sql });
    
    if (error) {
      throw error;
    }
    return { success: true, data };
  } catch (error) {
    console.error(`${colors.red}Error executing SQL:${colors.reset}`, error.message);
    return { success: false, error };
  }
}

// Split SQL into individual statements
function splitSqlIntoStatements(sql) {
  // This is a simple implementation and might not handle all SQL edge cases
  return sql
    .replace(/\/\*[\s\S]*?\*\/|--.*$/gm, '') // Remove comments
    .split(';')
    .filter(statement => statement.trim().length > 0)
    .map(statement => statement.trim() + ';');
}

// Main execution function
async function createTables() {
  console.log(`${colors.cyan}${colors.bright}
===============================================================
  CREATING TABLES IN SUPABASE
===============================================================${colors.reset}`);
  
  // Check which tables already exist
  console.log(`\n${colors.blue}Checking for existing tables...${colors.reset}`);
  
  const existingTables = [];
  const missingTables = [];
  
  for (const table of EXPECTED_TABLES) {
    const exists = await tableExists(table);
    if (exists) {
      existingTables.push(table);
      console.log(`${colors.green}✓ Table '${table}' already exists${colors.reset}`);
    } else {
      missingTables.push(table);
      console.log(`${colors.yellow}✗ Table '${table}' does not exist${colors.reset}`);
    }
  }
  
  if (existingTables.length === EXPECTED_TABLES.length) {
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
  
  // Execute the SQL statements
  console.log(`\n${colors.blue}Executing SQL script...${colors.reset}`);
  console.log(`${colors.yellow}This may take a few moments...${colors.reset}`);
  
  // First try creating a stored procedure that we can use to run custom SQL
  const createProcedureSql = `
    CREATE OR REPLACE FUNCTION pg_query(query_text text)
    RETURNS json
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
      result json;
    BEGIN
      EXECUTE query_text;
      result := json_build_object('success', true);
      RETURN result;
    EXCEPTION WHEN OTHERS THEN
      RETURN json_build_object(
        'success', false,
        'error', SQLERRM,
        'code', SQLSTATE
      );
    END;
    $$;
  `;
  
  console.log(`${colors.blue}Creating pg_query helper function...${colors.reset}`);
  
  try {
    // Create a simple query function first
    const { data, error } = await supabase.rpc('pg_query', { 
      query_text: 'SELECT 1;' 
    }).catch(err => {
      // If the function doesn't exist, this will error
      return { error: err };
    });
    
    if (error && error.message && error.message.includes('does not exist')) {
      // Function doesn't exist, create it
      console.log(`${colors.yellow}Creating pg_query function...${colors.reset}`);
      
      const res = await supabase.rpc('pg_query', { 
        query_text: createProcedureSql 
      }).catch(async err => {
        // Try alternative approach
        console.log(`${colors.yellow}Direct approach failed, trying SQL direct API...${colors.reset}`);
        return await supabase.from('_sql').select('*').execute(createProcedureSql);
      });
      
      if (res.error) {
        console.log(`${colors.red}Failed to create helper function. This is a common limitation.${colors.reset}`);
        console.log(`${colors.yellow}We'll continue by executing the SQL in the Supabase dashboard manually.${colors.reset}`);
        
        console.log(`\n${colors.yellow}${colors.bright}
Please run the following SQL script in the Supabase SQL Editor:
1. Go to your Supabase dashboard
2. Click on "SQL Editor" from the left menu
3. Create a new query
4. Paste the contents of create-supabase-tables.sql
5. Run the query${colors.reset}`);
        
        console.log(`\n${colors.cyan}Here's the path to your SQL file:${colors.reset}`);
        console.log(sqlFilePath);
        
        process.exit(0);
      }
    } else {
      console.log(`${colors.green}✓ pg_query function already exists${colors.reset}`);
    }
    
    // Split SQL into individual statements and execute them
    const statements = splitSqlIntoStatements(sqlScript);
    
    console.log(`${colors.blue}Executing ${statements.length} SQL statements...${colors.reset}`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const truncatedStatement = statement.length > 50 
        ? statement.substring(0, 50) + '...' 
        : statement;
      
      console.log(`${colors.yellow}Executing statement ${i+1}/${statements.length}: ${truncatedStatement}${colors.reset}`);
      
      const result = await executeSql(statement);
      
      if (!result.success) {
        console.error(`${colors.red}Failed to execute statement:${colors.reset}`, result.error);
        
        // Check if it's a "relation already exists" error, which we can ignore
        if (result.error && result.error.message && 
            (result.error.message.includes('already exists') || 
             result.error.message.includes('duplicate key'))) {
          console.log(`${colors.yellow}Skipping redundant statement...${colors.reset}`);
          continue;
        }
        
        console.error(`${colors.red}${colors.bright}
Error executing SQL statement. This is a common limitation with Supabase.
Please run the SQL script manually in the Supabase dashboard.${colors.reset}`);
        
        console.log(`\n${colors.yellow}${colors.bright}
Please run the SQL script in the Supabase SQL Editor:
1. Go to your Supabase dashboard
2. Click on "SQL Editor" from the left menu
3. Create a new query
4. Paste the contents of create-supabase-tables.sql
5. Run the query${colors.reset}`);
        
        process.exit(1);
      }
    }
    
    console.log(`${colors.green}✓ All SQL statements executed successfully${colors.reset}`);
    
  } catch (error) {
    console.error(`${colors.red}${colors.bright}Error: ${error.message}${colors.reset}`);
    
    console.log(`\n${colors.yellow}${colors.bright}
Due to limitations in Supabase, you'll need to run this SQL script manually:
1. Go to your Supabase dashboard
2. Click on "SQL Editor" from the left menu
3. Create a new query
4. Paste the contents of create-supabase-tables.sql
5. Run the query${colors.reset}`);
    
    process.exit(1);
  }
  
  // Verify tables were created
  console.log(`\n${colors.blue}Verifying tables were created...${colors.reset}`);
  
  let allCreated = true;
  for (const table of missingTables) {
    const exists = await tableExists(table);
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
    console.log(`\n${colors.yellow}${colors.bright}⚠️ Some tables were not created.${colors.reset}`);
    
    console.log(`\n${colors.yellow}${colors.bright}
Please run the SQL script manually in the Supabase SQL Editor:
1. Go to your Supabase dashboard
2. Click on "SQL Editor" from the left menu
3. Create a new query
4. Paste the contents of create-supabase-tables.sql
5. Run the query${colors.reset}`);
  }
}

// Run the script
createTables();