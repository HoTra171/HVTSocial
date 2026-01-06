// Test setup file
// Runs before each test suite

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.SQL_SERVER = 'localhost';
process.env.SQL_DATABASE = 'test_db';
process.env.SQL_USER = 'test_user';
process.env.SQL_PASSWORD = 'test_password';

// Global test timeout set in jest.config.js

// Suppress console logs during tests (optional)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };

console.log('🧪 Test environment initialized');
