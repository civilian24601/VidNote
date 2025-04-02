/**
 * Environment Variable Check Script
 * 
 * This script performs a comprehensive check of all required
 * environment variables for both server and client sides of the application.
 * 
 * Run this script with: node scripts/check-env.js
 */
import 'dotenv/config';
import path from 'path';
import fs from 'fs';

// List of environment variables to check and their descriptions
const serverVars = [
  { name: 'SUPABASE_URL', desc: 'URL of your Supabase project (required for storage)' },
  { name: 'SUPABASE_ANON_KEY', desc: 'Public API key for Supabase' },
  { name: 'SUPABASE_SERVICE_ROLE_KEY', desc: 'Service role key for admin operations (required for storage setup)' },
  { name: 'SESSION_SECRET', desc: 'Secret for Express sessions' },
  { name: 'NODE_ENV', desc: 'Environment (development, production, etc.)' },
];

const clientVars = [
  { name: 'VITE_SUPABASE_URL', desc: 'URL of your Supabase project (frontend access)' },
  { name: 'VITE_SUPABASE_ANON_KEY', desc: 'Public API key for Supabase (frontend access)' },
];

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

// Function to check environment variables
function checkEnvVars(type, varList) {
  console.log(`\n${colors.cyan}Checking ${type} Environment Variables:${colors.reset}`);
  console.log(`${colors.magenta}==================================${colors.reset}`);
  
  let missingCount = 0;
  let presentCount = 0;
  
  varList.forEach(({ name, desc }) => {
    if (process.env[name]) {
      presentCount++;
      const valuePreview = process.env[name].startsWith('ey') ? 
        `${process.env[name].substring(0, 6)}...` : 
        '<value set>';
      
      console.log(`${colors.green}✓ ${name}${colors.reset}: ${valuePreview}`);
    } else {
      missingCount++;
      console.log(`${colors.red}✕ ${name}${colors.reset}: MISSING - ${desc}`);
    }
  });
  
  return { missingCount, presentCount };
}

// Try to read .env file for reference
const rootDir = path.resolve(__dirname, '..');
const envPath = path.join(rootDir, '.env');
let envFileExists = false;
let envContents = '';

try {
  if (fs.existsSync(envPath)) {
    envFileExists = true;
    envContents = fs.readFileSync(envPath, 'utf8');
  }
} catch (err) {
  console.error('Error reading .env file:', err);
}

// Main function
function main() {
  console.log(`
${colors.blue}========================================================
  ENVIRONMENT VARIABLE CHECKER
========================================================${colors.reset}
`);
  
  const serverVarResults = checkEnvVars('Server', serverVars);
  const clientVarResults = checkEnvVars('Client', clientVars);
  
  // Check for server-client variable sync
  console.log(`\n${colors.cyan}Checking Client-Server Variable Consistency:${colors.reset}`);
  console.log(`${colors.magenta}==================================${colors.reset}`);
  
  const checkPairs = [
    { server: 'SUPABASE_URL', client: 'VITE_SUPABASE_URL' },
    { server: 'SUPABASE_ANON_KEY', client: 'VITE_SUPABASE_ANON_KEY' },
  ];
  
  let pairMismatches = 0;
  
  checkPairs.forEach(pair => {
    const serverValue = process.env[pair.server];
    const clientValue = process.env[pair.client];
    
    if (serverValue && clientValue) {
      if (serverValue === clientValue) {
        console.log(`${colors.green}✓ ${pair.server} matches ${pair.client}${colors.reset}`);
      } else {
        pairMismatches++;
        console.log(`${colors.red}✕ MISMATCH: ${pair.server} !== ${pair.client}${colors.reset}`);
      }
    } else if (serverValue) {
      console.log(`${colors.yellow}⚠ ${pair.server} is set but ${pair.client} is missing${colors.reset}`);
    } else if (clientValue) {
      console.log(`${colors.yellow}⚠ ${pair.client} is set but ${pair.server} is missing${colors.reset}`);
    } else {
      console.log(`${colors.yellow}⚠ Both ${pair.server} and ${pair.client} are missing${colors.reset}`);
    }
  });
  
  // Summary and recommendations
  console.log(`\n${colors.blue}========================================================
  SUMMARY
========================================================${colors.reset}`);
  
  const totalMissing = serverVarResults.missingCount + clientVarResults.missingCount;
  const totalPresent = serverVarResults.presentCount + clientVarResults.presentCount;
  const totalVars = serverVars.length + clientVars.length;
  
  console.log(`${colors.cyan}Total variables checked:${colors.reset} ${totalVars}`);
  console.log(`${colors.green}Present:${colors.reset} ${totalPresent}`);
  console.log(`${colors.red}Missing:${colors.reset} ${totalMissing}`);
  
  if (pairMismatches > 0) {
    console.log(`${colors.red}Client-Server Mismatches:${colors.reset} ${pairMismatches}`);
  }
  
  // Recommendations
  if (totalMissing > 0 || pairMismatches > 0) {
    console.log(`\n${colors.yellow}RECOMMENDATIONS:${colors.reset}`);
    
    if (!envFileExists) {
      console.log(`${colors.yellow}1. Create a .env file in the root directory with the missing variables.${colors.reset}`);
    } else {
      console.log(`${colors.yellow}1. Update your .env file with the missing variables.${colors.reset}`);
    }
    
    if (pairMismatches > 0) {
      console.log(`${colors.yellow}2. Make sure client and server Supabase variables have matching values.${colors.reset}`);
    }
    
    console.log(`${colors.yellow}3. Remember to restart your application after updating environment variables.${colors.reset}`);
    
    // Provide .env template
    if (totalMissing > 0) {
      const missingServerVars = serverVars.filter(v => !process.env[v.name]);
      const missingClientVars = clientVars.filter(v => !process.env[v.name]);
      
      if (missingServerVars.length > 0 || missingClientVars.length > 0) {
        console.log(`\n${colors.magenta}Template for missing variables:${colors.reset}`);
        console.log(`${colors.cyan}# Add these to your .env file:${colors.reset}`);
        
        [...missingServerVars, ...missingClientVars].forEach(v => {
          console.log(`${v.name}=YOUR_${v.name}_HERE  # ${v.desc}`);
        });
      }
    }
  } else {
    console.log(`\n${colors.green}All environment variables are properly set! 🎉${colors.reset}`);
  }
}

// Run the main function
main();