/**
 * Helper functions for Supabase integration
 * These are used to verify the connection and diagnose issues
 */

import { createClient } from '@supabase/supabase-js';
import { createCustomLogger } from './logger';

const logger = createCustomLogger();

/**
 * Creates a Supabase client for testing purposes
 */
export function createTestClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    logger.supabase.error('Missing Supabase credentials for test client');
    return null;
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

/**
 * Verifies that all required Supabase tables exist and are accessible
 */
export async function verifySupabaseTables() {
  const supabase = createTestClient();
  if (!supabase) {
    logger.supabase.error('Could not create Supabase test client');
    return false;
  }
  
  const tables = [
    'users',
    'videos',
    'comments',
    'video_sharing',
    'student_teacher_relationships',
    'notifications',
    'guest_invitations'
  ];
  
  let allTablesExist = true;
  
  for (const table of tables) {
    try {
      logger.supabase.debug(`Verifying table: ${table}`);
      
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        logger.supabase.error(`Error verifying table ${table}:`, error);
        allTablesExist = false;
      } else {
        logger.supabase.info(`Table ${table} verified: ${count || 0} rows`);
      }
    } catch (error) {
      logger.supabase.error(`Exception verifying table ${table}:`, error);
      allTablesExist = false;
    }
  }
  
  return allTablesExist;
}

/**
 * Checks Supabase auth connection
 */
export async function testSupabaseAuth() {
  const supabase = createTestClient();
  if (!supabase) {
    logger.supabase.error('Could not create Supabase test client');
    return false;
  }
  
  try {
    logger.supabase.debug('Testing Supabase auth connection');
    
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      logger.supabase.error('Supabase auth connection error:', error);
      return false;
    }
    
    logger.supabase.info('Supabase auth connection successful');
    return true;
  } catch (error) {
    logger.supabase.error('Exception testing Supabase auth connection:', error);
    return false;
  }
}

/**
 * Tests a direct SQL query to the database
 */
export async function testDirectQuery() {
  const supabase = createTestClient();
  if (!supabase) {
    logger.supabase.error('Could not create Supabase test client');
    return false;
  }
  
  try {
    logger.supabase.debug('Testing direct SQL query');
    
    // Try direct approach first
    let data: any = null;
    let error: any = null;
    
    try {
      // Use RPC to run a simple SQL query
      const response = await supabase.rpc('pg_query', { 
        query_text: "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users');" 
      });
      
      data = response.data;
      error = response.error;
    } catch (err: any) {
      // Handle case where the function doesn't exist
      logger.supabase.error('pg_query function not available:', err);
      error = err;
    }
    
    if (error) {
      logger.supabase.error('Direct SQL query error:', error);
      
      // Try a different approach
      logger.supabase.debug('Trying direct table access');
      
      const { data: tableData, error: tableError } = await supabase
        .from('users')
        .select('count(*)', { count: 'exact', head: true });
      
      if (tableError) {
        logger.supabase.error('Direct table access error:', tableError);
        return false;
      }
      
      logger.supabase.info('Direct table access successful');
      return true;
    }
    
    logger.supabase.info('Direct SQL query successful:', data);
    return true;
  } catch (error) {
    logger.supabase.error('Exception testing direct SQL query:', error);
    return false;
  }
}

/**
 * Run all Supabase diagnostic tests
 */
export async function runSupabaseDiagnostics() {
  logger.supabase.info('Running Supabase diagnostics...');
  
  const authResult = await testSupabaseAuth();
  logger.supabase.info(`Auth test result: ${authResult ? 'PASSED' : 'FAILED'}`);
  
  const tablesResult = await verifySupabaseTables();
  logger.supabase.info(`Tables test result: ${tablesResult ? 'PASSED' : 'FAILED'}`);
  
  const queryResult = await testDirectQuery();
  logger.supabase.info(`Direct query test result: ${queryResult ? 'PASSED' : 'FAILED'}`);
  
  return authResult && tablesResult && queryResult;
}