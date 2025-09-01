#!/usr/bin/env node

// Helper script to run drizzle-kit commands against production database
// This properly loads the PRODUCTION_DATABASE_URL from .env and sets it as DATABASE_URL

require('dotenv').config({ path: '.env' });

if (!process.env.PRODUCTION_DATABASE_URL) {
  console.error('❌ Error: PRODUCTION_DATABASE_URL not found in .env file');
  console.error('   Run ./scripts/setup-fly.sh to configure your production database');
  process.exit(1);
}

// Get the production database URL
const prodDbUrl = process.env.PRODUCTION_DATABASE_URL;

// Debug: Show which database we're connecting to (masked for security)
const maskedUrl = prodDbUrl.replace(/(?<=:\/\/)([^:]+):([^@]+)@/, '$1:****@');
console.log(`📊 Using database: ${maskedUrl}`);

// Verify it's actually a Neon URL (safety check)
if (!prodDbUrl.includes('neon.tech')) {
  console.error('⚠️  Warning: PRODUCTION_DATABASE_URL does not appear to be a Neon database');
  console.error('   URL:', maskedUrl);
  console.error('   Continue anyway? Press Ctrl+C to cancel, or wait 5 seconds...');
  const { execSync } = require('child_process');
  execSync('sleep 5', { stdio: 'inherit' });
}

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

// Execute the drizzle-kit command with DATABASE_URL passed directly
const { execSync } = require('child_process');
try {
  // Pass DATABASE_URL directly in the command to ensure it's used
  // Use shell: true to allow environment variable expansion
  execSync(`DATABASE_URL="${prodDbUrl}" drizzle-kit ${command}`, { 
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      DATABASE_URL: prodDbUrl // Also set in env for good measure
    }
  });
} catch (error) {
  process.exit(1);
}