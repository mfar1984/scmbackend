/**
 * Run all SQL migration files in order.
 * Usage: node scripts/migrate.js
 */

const mysql = require('mysql2/promise');
const fs    = require('fs');
const path  = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function run() {
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT || '3306'),
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME     || 'atlinebackend',
    multipleStatements: true,
  });

  const migrationsDir = path.join(__dirname, '..', 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`Found ${files.length} migration file(s).\n`);

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    console.log(`Running: ${file} ...`);
    try {
      await conn.query(sql);
      console.log(`  ✓ Done\n`);
    } catch (err) {
      console.error(`  ✗ Error in ${file}:`, err.message, '\n');
    }
  }

  await conn.end();
  console.log('Migration complete.');
}

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
