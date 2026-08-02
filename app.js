/**
 * Pathak Bhandar E-Commerce Platform - cPanel Entry Point
 * This file serves as the main entry point for cPanel hosting
 */

// Import the compiled TypeScript server
const path = require('path');
const fs = require('fs');

// Check if the compiled dist folder exists
const distPath = path.join(__dirname, 'dist');
const serverPath = path.join(distPath, 'server', 'index-cpanel.js');

if (fs.existsSync(serverPath)) {
  // Use compiled JavaScript version
  require(serverPath);
} else {
  // Fallback to TypeScript version with tsx
  console.log('Compiled version not found, using TypeScript with tsx...');
  require('tsx/cjs').register();
  require('./server/index-cpanel.ts');
}