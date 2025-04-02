/**
 * Custom logger for the application with different namespaces for different subsystems
 */

export interface Logger {
  debug: (message: string, meta?: any) => void;
  info: (message: string, meta?: any) => void;
  warn: (message: string, meta?: any) => void;
  error: (message: string, meta?: any) => void;
}

export interface CustomLogger {
  express: Logger;
  supabase: Logger;
  auth: Logger;
  video: Logger;
  general: Logger;
  drizzle: Logger;
}

/**
 * Create a logger for a specific subsystem
 * 
 * @param namespace The namespace for the logger
 * @returns A logger instance
 */
function createLogger(namespace: string): Logger {
  return {
    debug: (message: string, meta?: any) => {
      if (process.env.NODE_ENV === 'development') {
        if (meta) {
          console.debug(`${new Date().toISOString()} debug [${namespace}]: ${message}`, meta);
        } else {
          console.debug(`${new Date().toISOString()} debug [${namespace}]: ${message}`);
        }
      }
    },
    info: (message: string, meta?: any) => {
      if (meta) {
        console.info(`${new Date().toISOString()} info [${namespace}]: ${message}`, meta);
      } else {
        console.info(`${new Date().toISOString()} info [${namespace}]: ${message}`);
      }
    },
    warn: (message: string, meta?: any) => {
      if (meta) {
        console.warn(`${new Date().toISOString()} warn [${namespace}]: ${message}`, meta);
      } else {
        console.warn(`${new Date().toISOString()} warn [${namespace}]: ${message}`);
      }
    },
    error: (message: string, meta?: any) => {
      if (meta) {
        console.error(`${new Date().toISOString()} error [${namespace}]: ${message}`, meta);
      } else {
        console.error(`${new Date().toISOString()} error [${namespace}]: ${message}`);
      }
    }
  };
}

/**
 * Create a custom logger with different namespaces
 * 
 * @returns A custom logger instance
 */
export function createCustomLogger(): CustomLogger {
  return {
    express: createLogger('express'),
    supabase: createLogger('supabase'),
    auth: createLogger('auth'),
    video: createLogger('video'),
    general: createLogger('general'),
    drizzle: createLogger('drizzle')
  };
}

// Export a default logger instance for use in the application
export const logger = createCustomLogger();