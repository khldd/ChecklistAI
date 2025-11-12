#!/usr/bin/env node

/**
 * Environment Check Script
 * Verifies that all required environment variables are set correctly
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking environment configuration...\n');

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env.local file not found!');
  console.log('   Please create it by copying .env.local.example');
  console.log('   Run: cp .env.local.example .env.local\n');
  process.exit(1);
}

// Load .env.local
require('dotenv').config({ path: envPath });

const requiredVars = [
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    description: 'Supabase Project URL',
    example: 'https://xxxxx.supabase.co',
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    description: 'Supabase Anon/Public Key',
    example: 'eyJhbG...',
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    description: 'Supabase Service Role Key (required for API routes)',
    example: 'eyJhbG...',
    critical: true,
  },
  {
    name: 'OPENAI_API_KEY',
    description: 'OpenAI API Key',
    example: 'sk-...',
  },
];

const optionalVars = [
  {
    name: 'UNSTRACT_API_KEY',
    description: 'Unstract API Key (falls back to local parsing)',
  },
];

let hasErrors = false;
let hasWarnings = false;

console.log('Required Environment Variables:\n');

requiredVars.forEach((variable) => {
  const value = process.env[variable.name];
  if (!value || value === `your-${variable.name.toLowerCase().replace(/_/g, '-')}`) {
    console.error(`❌ ${variable.name}`);
    console.error(`   ${variable.description}`);
    console.error(`   Example: ${variable.example}`);
    if (variable.critical) {
      console.error(`   ⚠️  CRITICAL: This is required to fix the permission error!`);
    }
    console.log('');
    hasErrors = true;
  } else {
    console.log(`✅ ${variable.name}`);
    // Show first/last few characters for verification
    if (value.startsWith('http')) {
      console.log(`   ${value}`);
    } else {
      const masked = value.substring(0, 8) + '...' + value.substring(value.length - 4);
      console.log(`   ${masked}`);
    }
    console.log('');
  }
});

console.log('\nOptional Environment Variables:\n');

optionalVars.forEach((variable) => {
  const value = process.env[variable.name];
  if (!value || value === `your-${variable.name.toLowerCase().replace(/_/g, '-')}`) {
    console.log(`⚠️  ${variable.name} (not set)`);
    console.log(`   ${variable.description}`);
    console.log('');
    hasWarnings = true;
  } else {
    console.log(`✅ ${variable.name}`);
    console.log('');
  }
});

// Validate Supabase URL format
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (supabaseUrl && !supabaseUrl.startsWith('https://') && !supabaseUrl.includes('.supabase.co')) {
  console.error('❌ Invalid Supabase URL format');
  console.error('   Should be: https://your-project.supabase.co');
  hasErrors = true;
}

// Validate OpenAI key format
const openaiKey = process.env.OPENAI_API_KEY;
if (openaiKey && !openaiKey.startsWith('sk-')) {
  console.error('❌ Invalid OpenAI API key format');
  console.error('   Should start with: sk-');
  hasErrors = true;
}

// Check if service role key is different from anon key
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (anonKey && serviceKey && anonKey === serviceKey) {
  console.error('❌ Service Role Key and Anon Key are the same!');
  console.error('   They should be different keys from your Supabase dashboard.');
  console.error('   Go to: Project Settings > API');
  hasErrors = true;
}

console.log('\n' + '='.repeat(60) + '\n');

if (hasErrors) {
  console.error('❌ Configuration has errors. Please fix them before running the app.\n');
  console.log('📖 See SUPABASE_SETUP.md for detailed setup instructions.\n');
  process.exit(1);
} else if (hasWarnings) {
  console.log('⚠️  Configuration is valid but some optional features are disabled.\n');
  console.log('✅ You can run the app with: npm run dev\n');
  process.exit(0);
} else {
  console.log('✅ All environment variables are configured correctly!\n');
  console.log('🚀 You can now run: npm run dev\n');
  process.exit(0);
}
