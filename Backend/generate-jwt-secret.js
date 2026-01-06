#!/usr/bin/env node

/**
 * Generate Secure JWT Secret
 * Run: node generate-jwt-secret.js
 */

import crypto from 'crypto';

// Generate 32-byte random string (256 bits)
const jwtSecret = crypto.randomBytes(32).toString('hex');

console.log('\n🔐 JWT Secret Generated!\n');
console.log('━'.repeat(80));
console.log('\nCopy this to your .env file:\n');
console.log(`JWT_SECRET=${jwtSecret}`);
console.log('\n━'.repeat(80));
console.log('\n✅ This is a cryptographically secure random string (64 characters, 256 bits)');
console.log('✅ Never share this secret with anyone');
console.log('✅ Use different secrets for development and production\n');

// Also generate a few more for other environments
console.log('💡 Additional secrets for different environments:\n');
for (let i = 1; i <= 3; i++) {
  console.log(`ENV_${i}_JWT_SECRET=${crypto.randomBytes(32).toString('hex')}`);
}
console.log('');
