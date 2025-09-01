#!/usr/bin/env node

// Helper script to run drizzle-kit commands against production database
// This properly loads the PRODUCTION_DATABASE_URL from .env and sets it as DATABASE_URL

require('dotenv').config({ path: '.env' });

if (!process.env.PRODUCTION_DATABASE_URL) {
  console.error('❌ Error: PRODUCTION_DATABASE_URL not found in .env file');
  console.error('   Run ./scripts/setup-fly.sh to configure your production database');
  process.exit(1);
}

// Set DATABASE_URL to the production URL
process.env.DATABASE_URL = process.env.PRODUCTION_DATABASE_URL;

// Debug: Show which database we're connecting to (masked for security)
const dbUrl = process.env.DATABASE_URL;
const maskedUrl = dbUrl.replace(/(?<=:\/\/)([^:]+):([^@]+)@/, '$1:****@');
console.log(`📊 Using database: ${maskedUrl}`);

// Get the drizzle-kit command from arguments
const command = process.argv.slice(2).join(' ');

if (!command) {
  console.error('❌ Error: No command specified');
  console.error('   Usage: bun scripts/db-prod.js <command>');
  console.error('   Example: bun scripts/db-prod.js migrate');
  process.exit(1);
}

// Show warning for destructive operations
if (command.includes('push')) {
  console.log('⚠️  WARNING: This will modify the PRODUCTION database!');
  console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...');
  
  // Give user time to cancel
  const { execSync } = require('child_process');
  execSync('sleep 5', { stdio: 'inherit' });
}

console.log(`🚀 Running drizzle-kit ${command} against production database...`);

// Execute the drizzle-kit command
const { execSync } = require('child_process');
try {
  execSync(`drizzle-kit ${command}`, { stdio: 'inherit' });
} catch (error) {
  process.exit(1);
}