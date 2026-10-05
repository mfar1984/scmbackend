#!/usr/bin/env node

/**
 * ATLINE Backend — Production Server (cPanel Compatible)
 * Properly serves Next.js standalone build with static files
 */

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const path = require('path');
const fs = require('fs');

// Configuration
const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

// Initialize Next.js
const app = next({ 
  dev,
  hostname,
  port,
  dir: __dirname
});

const handle = app.getRequestHandler();

console.log('');
console.log('  ╔══════════════════════════════════════════════╗');
console.log('  ║       ATLINE BACKEND — Production Server    ║');
console.log('  ╠══════════════════════════════════════════════╣');
console.log(`  ║   Environment : ${process.env.NODE_ENV || 'production'}`.padEnd(50) + '║');
console.log(`  ║   Database    : ${process.env.DB_NAME || 'N/A'}@${process.env.DB_HOST || 'localhost'}`.padEnd(50) + '║');
console.log(`  ║   Hostname    : ${hostname}`.padEnd(50) + '║');
console.log(`  ║   Port        : ${port}`.padEnd(50) + '║');
console.log('  ╚══════════════════════════════════════════════╝');
console.log('');

// Prepare and start
app.prepare()
  .then(() => {
    createServer((req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        handle(req, res, parsedUrl);
      } catch (err) {
        console.error('Error handling request:', err);
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    })
    .listen(port, hostname, (err) => {
      if (err) {
        console.error('❌ Failed to start:', err);
        process.exit(1);
      }
      console.log(`✅ Server ready on http://${hostname}:${port}`);
      console.log(`📱 Public URL: ${process.env.APP_PUBLIC_URL || 'Not set'}`);
      console.log('');
    })
    .on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${port} already in use`);
      } else {
        console.error('❌ Server error:', err);
      }
      process.exit(1);
    });
  })
  .catch((err) => {
    console.error('❌ Failed to prepare Next.js:', err);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  process.exit(0);
});
