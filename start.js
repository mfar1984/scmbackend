#!/usr/bin/env node

/**
 * ATLINE Backend - Startup Script for cPanel
 * Handles both standalone and standard Next.js builds
 */

const fs = require('fs');
const path = require('path');

console.log('');
console.log('🚀 Starting ATLINE Backend...');
console.log('📍 Environment:', process.env.NODE_ENV || 'production');
console.log('🌐 Port:', process.env.PORT || '3000');
console.log('');

// Check for standalone build
const standaloneServer = path.join(__dirname, '.next', 'standalone', 'server.js');

if (fs.existsSync(standaloneServer)) {
  console.log('✅ Using standalone server...');
  console.log('📁 Path:', standaloneServer);
  console.log('');
  
  // Set environment variables
  process.env.HOSTNAME = process.env.HOSTNAME || '0.0.0.0';
  process.env.PORT = process.env.PORT || '3000';
  
  // Run standalone server
  try {
    require(standaloneServer);
  } catch (err) {
    console.error('❌ Failed to start standalone server:', err);
    console.log('');
    console.log('⚠️  Falling back to next start...');
    fallbackToNextStart();
  }
} else {
  console.log('⚠️  Standalone server not found at:', standaloneServer);
  console.log('📦 Using standard Next.js server...');
  console.log('');
  fallbackToNextStart();
}

function fallbackToNextStart() {
  const { spawn } = require('child_process');
  const nextBin = path.join(__dirname, 'node_modules', '.bin', 'next');
  
  const child = spawn('node', [nextBin, 'start', '-p', process.env.PORT || '3000'], {
    stdio: 'inherit',
    env: process.env
  });

  child.on('error', (err) => {
    console.error('❌ Failed to start:', err);
    process.exit(1);
  });

  child.on('exit', (code) => {
    if (code !== 0) {
      console.error('❌ Server exited with code:', code);
    }
    process.exit(code || 0);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('Shutting down...');
    child.kill('SIGTERM');
  });

  process.on('SIGINT', () => {
    console.log('Shutting down...');
    child.kill('SIGINT');
  });
}
