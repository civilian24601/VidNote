/**
 * Enhanced logging utility for the application
 * Provides structured logging with different severity levels and contexts
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogOptions {
  context?: string;
  data?: any;
}

// Standardized timestamp format for logs
function getTimestamp(): string {
  return new Date().toISOString();
}

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

// Format log level with color
function formatLevel(level: LogLevel): string {
  switch(level) {
    case 'debug': return `${colors.cyan}${level}${colors.reset}`;
    case 'info': return `${colors.green}${level}${colors.reset}`;
    case 'warn': return `${colors.yellow}${level}${colors.reset}`;
    case 'error': return `${colors.red}${level}${colors.reset}`;
    default: return level;
  }
}

// Main logger function
export function log(message: string, level: LogLevel = 'info', options: LogOptions = {}): void {
  const { context = 'app', data } = options;
  const timestamp = getTimestamp();
  
  // Format log parts
  const formattedLevel = formatLevel(level);
  const formattedContext = `${colors.magenta}[${context}]${colors.reset}`;
  
  // Basic log output
  console.log(`${timestamp} ${formattedLevel} ${formattedContext}: ${message}`);
  
  // If additional data is provided, output it on the next line
  if (data) {
    try {
      if (typeof data === 'object') {
        console.log(`${colors.dim}${JSON.stringify(data, null, 2)}${colors.reset}`);
      } else {
        console.log(`${colors.dim}${data}${colors.reset}`);
      }
    } catch (e) {
      console.log(`${colors.dim}[Data logging failed]${colors.reset}`);
    }
  }
}

// Convenience methods for different log levels
export const logger = {
  debug: (message: string, options: LogOptions = {}) => log(message, 'debug', options),
  info: (message: string, options: LogOptions = {}) => log(message, 'info', options),
  warn: (message: string, options: LogOptions = {}) => log(message, 'warn', options),
  error: (message: string, options: LogOptions = {}) => log(message, 'error', options),
  
  // Specialized contexts
  supabase: {
    debug: (message: string, data?: any) => log(message, 'debug', { context: 'supabase', data }),
    info: (message: string, data?: any) => log(message, 'info', { context: 'supabase', data }),
    warn: (message: string, data?: any) => log(message, 'warn', { context: 'supabase', data }),
    error: (message: string, data?: any) => log(message, 'error', { context: 'supabase', data }),
  },
  storage: {
    debug: (message: string, data?: any) => log(message, 'debug', { context: 'storage', data }),
    info: (message: string, data?: any) => log(message, 'info', { context: 'storage', data }),
    warn: (message: string, data?: any) => log(message, 'warn', { context: 'storage', data }),
    error: (message: string, data?: any) => log(message, 'error', { context: 'storage', data }),
  },
  auth: {
    debug: (message: string, data?: any) => log(message, 'debug', { context: 'auth', data }),
    info: (message: string, data?: any) => log(message, 'info', { context: 'auth', data }),
    warn: (message: string, data?: any) => log(message, 'warn', { context: 'auth', data }),
    error: (message: string, data?: any) => log(message, 'error', { context: 'auth', data }),
  },
  video: {
    debug: (message: string, data?: any) => log(message, 'debug', { context: 'video', data }),
    info: (message: string, data?: any) => log(message, 'info', { context: 'video', data }),
    warn: (message: string, data?: any) => log(message, 'warn', { context: 'video', data }),
    error: (message: string, data?: any) => log(message, 'error', { context: 'video', data }),
  }
};

export default logger;