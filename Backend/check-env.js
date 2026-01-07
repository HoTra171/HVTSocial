#!/usr/bin/env node

/**
 * Environment Variables Checker
 * Run: node check-env.js
 * 
 * Checks if all required environment variables are set
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// In production (Render, Vercel, etc.), environment variables are set via platform
// Only require .env file in development
const isProduction = process.env.NODE_ENV === 'production';

// Load .env file
const envPath = join(__dirname, '.env');
if (existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log('✅ .env file found\n');
} else if (!isProduction) {
  console.log('❌ .env file not found. Copy .env.example to .env\n');
  console.log('For local development, you need a .env file.\n');
  console.log('For production deployment, set environment variables in your platform dashboard.\n');
  process.exit(1);
} else {
  // Production - environment variables should be set via platform
  console.log('ℹ️  Production mode: Using environment variables from platform\n');
}

console.log('🔍 Checking Environment Variables...\n');
console.log('━'.repeat(80));

// Required variables
const requiredVars = {
  // Server
  'NODE_ENV': {
    value: process.env.NODE_ENV,
    required: false,
    default: 'development',
    description: 'Node environment'
  },
  'PORT': {
    value: process.env.PORT,
    required: false,
    default: '5000',
    description: 'Server port'
  },

  // Database
  'DB_DRIVER': {
    value: process.env.DB_DRIVER,
    required: false,
    default: process.env.DATABASE_URL ? 'postgres' : 'mssql',
    description: 'Database driver (postgres OR mssql)'
  },

  // Database - SQL Server (cho local)
  'SQL_SERVER': {
    value: process.env.SQL_SERVER,
    required: !process.env.DATABASE_URL,
    description: 'SQL Server host (local)'
  },
  'SQL_DATABASE': {
    value: process.env.SQL_DATABASE,
    required: !process.env.DATABASE_URL,
    description: 'SQL Server database name'
  },
  'SQL_USER': {
    value: process.env.SQL_USER,
    required: !process.env.DATABASE_URL,
    description: 'SQL Server username'
  },
  'SQL_PASSWORD': {
    value: process.env.SQL_PASSWORD,
    required: !process.env.DATABASE_URL,
    description: 'SQL Server password',
    sensitive: true
  },

  // Database - PostgreSQL (cho production)
  'DATABASE_URL': {
    value: process.env.DATABASE_URL,
    required: !process.env.SQL_SERVER,
    description: 'PostgreSQL connection URL (production)',
    sensitive: true
  },

  // Redis
  'REDIS_HOST': {
    value: process.env.REDIS_HOST,
    required: !process.env.REDIS_URL,
    default: 'localhost',
    description: 'Redis host (local)'
  },
  'REDIS_URL': {
    value: process.env.REDIS_URL,
    required: !process.env.REDIS_HOST,
    description: 'Redis URL (cloud)',
    sensitive: true
  },

  // JWT
  'JWT_SECRET': {
    value: process.env.JWT_SECRET,
    required: true,
    description: 'JWT secret key (min 32 chars)',
    sensitive: true,
    validator: (val) => val && val.length >= 32
  },
  'JWT_EXPIRES_IN': {
    value: process.env.JWT_EXPIRES_IN,
    required: false,
    default: '7d',
    description: 'JWT expiration time'
  },

  // Cloudinary
  'CLOUDINARY_CLOUD_NAME': {
    value: process.env.CLOUDINARY_CLOUD_NAME,
    required: true,
    description: 'Cloudinary cloud name'
  },
  'CLOUDINARY_API_KEY': {
    value: process.env.CLOUDINARY_API_KEY,
    required: true,
    description: 'Cloudinary API key',
    sensitive: true
  },
  'CLOUDINARY_API_SECRET': {
    value: process.env.CLOUDINARY_API_SECRET,
    required: true,
    description: 'Cloudinary API secret',
    sensitive: true
  },

  // CORS
  'CORS_ORIGINS': {
    value: process.env.CORS_ORIGINS,
    required: false,
    default: 'http://localhost:3000',
    description: 'Allowed CORS origins'
  },
  'CLIENT_URL': {
    value: process.env.CLIENT_URL,
    required: false,
    default: 'http://localhost:3000',
    description: 'Frontend URL'
  },

  // Email (optional for testing)
  'EMAIL_HOST': {
    value: process.env.EMAIL_HOST,
    required: false,
    description: 'Email server host (optional)'
  },
  'EMAIL_USER': {
    value: process.env.EMAIL_USER,
    required: false,
    description: 'Email username (optional)'
  }
};

let hasErrors = false;
let hasWarnings = false;

// Check each variable
for (const [key, config] of Object.entries(requiredVars)) {
  const value = config.value || config.default;
  const status = value ? '✅' : (config.required ? '❌' : '⚠️');

  // Display value (mask sensitive data)
  let displayValue;
  if (!value) {
    displayValue = config.default ? `(default: ${config.default})` : '(not set)';
  } else if (config.sensitive) {
    displayValue = '***' + value.slice(-4);
  } else {
    displayValue = value.length > 50 ? value.slice(0, 47) + '...' : value;
  }

  console.log(`${status} ${key.padEnd(30)} ${displayValue}`);
  console.log(`   ${config.description}`);

  // Validate
  if (config.required && !value) {
    console.log(`   ⚠️  REQUIRED: This variable must be set!`);
    hasErrors = true;
  } else if (config.validator && value && !config.validator(value)) {
    console.log(`   ⚠️  INVALID: Value does not meet requirements!`);
    hasErrors = true;
  } else if (!config.required && !value) {
    hasWarnings = true;
  }

  console.log('');
}

console.log('━'.repeat(80));

// Summary
console.log('\n📊 SUMMARY:\n');

if (hasErrors) {
  console.log('❌ ERRORS FOUND! Fix required variables before starting the server.\n');
  console.log('💡 Tips:');
  console.log('   1. Copy .env.example to .env');
  console.log('   2. Fill in all required values');
  console.log('   3. Generate JWT secret: node generate-jwt-secret.js');
  console.log('   4. Get Cloudinary credentials from https://cloudinary.com');
  console.log('');
  process.exit(1);
} else if (hasWarnings) {
  console.log('⚠️  WARNINGS: Some optional variables are not set.\n');
  console.log('   The server will start, but some features may not work.\n');
  console.log('✅ All required variables are set. Server can start!\n');
  process.exit(0);
} else {
  console.log('✅ Perfect! All required and optional variables are set.\n');
  console.log('🚀 Ready to start the server: npm start\n');
  process.exit(0);
}
