/**
 * Database setup script that creates Supabase tables directly 
 * using pg client for more reliable execution
 * 
 * Usage: node scripts/setup-supabase-db.js
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Initialize .env
dotenv.config();

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

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

// Parse connection parameters from DATABASE_URL or direct configuration
function getConnectionConfig() {
  // Check if we have a direct connection URL
  let databaseUrl = process.env.DATABASE_URL;
  
  // If not, try to construct one from Supabase credentials
  if (!databaseUrl) {
    // Extract the database connection info from the Supabase URL
    // Format: https://<project-id>.supabase.co
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error(`${colors.red}${colors.bright}Error: Missing Supabase credentials in environment variables${colors.reset}`);
      console.error(`Make sure you have the following in your .env file:`);
      console.error(`- SUPABASE_URL`);
      console.error(`- SUPABASE_SERVICE_ROLE_KEY`);
      console.error(`Alternatively, provide a direct DATABASE_URL connection string.`);
      process.exit(1);
    }
    
    // Extract the project ID from the URL
    const match = supabaseUrl.match(/https:\/\/([a-z0-9-]+)\.supabase\.co/);
    if (!match) {
      console.error(`${colors.red}Invalid Supabase URL format: ${supabaseUrl}${colors.reset}`);
      process.exit(1);
    }
    
    const projectId = match[1];
    
    // Construct a direct database connection URL using the project ID
    // This is the format Supabase uses for direct database access
    databaseUrl = `postgres://postgres:${supabaseKey}@db.${projectId}.supabase.co:5432/postgres`;
  }

  // Parse the DATABASE_URL to get connection config
  try {
    const url = new URL(databaseUrl);
    
    return {
      user: url.username,
      password: url.password,
      host: url.hostname,
      port: url.port || 5432,
      database: url.pathname.substring(1), // Remove leading slash
      ssl: { rejectUnauthorized: false } // Required for Supabase
    };
  } catch (error) {
    console.error(`${colors.red}Invalid database URL: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Check if a table exists in the database
async function tableExists(pool, tableName) {
  try {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      )
    `, [tableName]);
    
    return result.rows[0].exists;
  } catch (error) {
    console.error(`${colors.red}Error checking if table ${tableName} exists:${colors.reset}`, error.message);
    return false;
  }
}

// Create database tables
async function createTables(pool) {
  console.log(`${colors.cyan}${colors.bright}
===============================================================
  CREATING TABLES IN SUPABASE DATABASE
===============================================================${colors.reset}`);

  console.log(`\n${colors.blue}Checking existing tables...${colors.reset}`);
  
  const existingTables = [];
  const missingTables = [];
  
  // Check which tables already exist
  for (const table of EXPECTED_TABLES) {
    const exists = await tableExists(pool, table);
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
  
  // Read SQL file
  const sqlFilePath = path.join(__dirname, 'create-supabase-tables.sql');
  console.log(`\n${colors.blue}Reading SQL script from: ${sqlFilePath}${colors.reset}`);
  
  if (!fs.existsSync(sqlFilePath)) {
    console.error(`${colors.red}Error: SQL file not found at ${sqlFilePath}${colors.reset}`);
    process.exit(1);
  }
  
  const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');
  console.log(`${colors.green}✓ SQL script read successfully (${sqlScript.length} bytes)${colors.reset}`);
  
  // Execute SQL
  console.log(`\n${colors.blue}Executing SQL script...${colors.reset}`);
  console.log(`${colors.yellow}This may take a few moments...${colors.reset}`);
  
  try {
    // Execute the entire script as one transaction
    await pool.query('BEGIN');
    await pool.query(sqlScript);
    await pool.query('COMMIT');
    
    console.log(`${colors.green}✓ SQL executed successfully${colors.reset}`);
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error(`${colors.red}${colors.bright}Error executing SQL:${colors.reset}`, error.message);
    
    if (error.message.includes('permission denied')) {
      console.error(`${colors.red}${colors.bright}
Permission denied error. This likely means you don't have sufficient 
privileges on the database. You may need to:
1. Use the Supabase Dashboard SQL Editor to run the script 
2. Check that your service role key has the necessary permissions
3. Contact Supabase support if you continue having issues${colors.reset}`);
    }
    
    process.exit(1);
  }
  
  // Verify table creation
  console.log(`\n${colors.blue}Verifying tables were created...${colors.reset}`);
  
  let allCreated = true;
  for (const table of missingTables) {
    const exists = await tableExists(pool, table);
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
    console.log(`\n${colors.yellow}${colors.bright}⚠️ Some tables were not created. Check the SQL script for errors.${colors.reset}`);
  }
}

// Main function
async function main() {
  const config = getConnectionConfig();
  console.log(`${colors.blue}Connecting to database at ${config.host}...${colors.reset}`);
  
  const pool = new Pool(config);
  
  try {
    // Test connection
    await pool.query('SELECT NOW()');
    console.log(`${colors.green}✓ Connected to database successfully${colors.reset}`);
    
    // Create tables
    await createTables(pool);
  } catch (error) {
    console.error(`${colors.red}${colors.bright}Database error:${colors.reset}`, error.message);
    
    if (error.message.includes('connect ECONNREFUSED')) {
      console.error(`${colors.red}${colors.bright}
Connection refused. Possible reasons:
1. The database host is incorrect or unreachable
2. The database port is closed or blocked by a firewall
3. The database server is not running${colors.reset}`);
    } else if (error.message.includes('password authentication failed')) {
      console.error(`${colors.red}${colors.bright}
Authentication failed. Possible reasons:
1. The username is incorrect
2. The password is incorrect
3. The service role key doesn't have database access rights${colors.reset}`);
    }
  } finally {
    await pool.end();
  }
}

// Run the script
main();