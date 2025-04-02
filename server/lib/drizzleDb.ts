import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../../shared/schema';
import dotenv from 'dotenv';
import { createCustomLogger } from './logger';

dotenv.config();

const logger = createCustomLogger();

// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create a Drizzle instance with the connection and schema
export const db = drizzle(pool, { schema });

// Helper function to test the database connection
export async function testDatabaseConnection() {
  try {
    // Simple query to test the connection
    const result = await pool.query('SELECT NOW() as current_time');
    logger.general.info(`Database connection successful, current time: ${result.rows[0].current_time}`);
    return true;
  } catch (error) {
    logger.general.error('Failed to connect to the database:', { error });
    return false;
  }
}

// Helper function to close the database connection pool
export async function closeDatabaseConnection() {
  try {
    await pool.end();
    logger.general.info('Database connection pool closed');
    return true;
  } catch (error) {
    logger.general.error('Error closing database connection pool:', { error });
    return false;
  }
}

export default db;