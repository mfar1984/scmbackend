import db from '@/lib/db';

/**
 * Pure-JS MySQL dump — works on shared hosting without the `mysqldump` binary.
 * Produces a restorable .sql script (schema + data) for all tables in the DB.
 */

function esc(v: any): string {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number') return String(v);
  if (typeof v === 'boolean') return v ? '1' : '0';
  if (v instanceof Date) return `'${v.toISOString().slice(0, 19).replace('T', ' ')}'`;
  if (Buffer.isBuffer(v)) return `0x${v.toString('hex')}`;
  // string — escape for MySQL
  const s = String(v)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\0/g, '\\0')
    .replace(/\x1a/g, '\\Z');
  return `'${s}'`;
}

export async function generateSqlDump(): Promise<string> {
  const dbName = process.env.DB_NAME || 'atlinebackend';
  const out: string[] = [];

  out.push('-- ATLINE Backend SQL Backup');
  out.push(`-- Generated: ${new Date().toISOString()}`);
  out.push(`-- Database: ${dbName}`);
  out.push('SET FOREIGN_KEY_CHECKS=0;');
  out.push('SET NAMES utf8mb4;');
  out.push('');

  // List all base tables
  const tablesRes: any = await db.raw(
    'SELECT table_name AS t FROM information_schema.tables WHERE table_schema = ? AND table_type = ?',
    [dbName, 'BASE TABLE']
  );
  const tables: string[] = tablesRes[0].map((r: any) => r.t || r.table_name || r.TABLE_NAME);

  for (const table of tables) {
    // Schema
    const createRes: any = await db.raw(`SHOW CREATE TABLE \`${table}\``);
    const createSql = createRes[0][0]['Create Table'] || createRes[0][0]['Create View'];
    out.push(`-- ----------------------------\n-- Table: ${table}\n-- ----------------------------`);
    out.push(`DROP TABLE IF EXISTS \`${table}\`;`);
    out.push(`${createSql};`);
    out.push('');

    // Data — stream in chunks to keep memory low
    const rows: any[] = await db(table).select('*');
    if (rows.length) {
      const cols = Object.keys(rows[0]).map(c => `\`${c}\``).join(', ');
      const CHUNK = 200;
      for (let i = 0; i < rows.length; i += CHUNK) {
        const slice = rows.slice(i, i + CHUNK);
        const values = slice.map(row => `(${Object.values(row).map(esc).join(', ')})`).join(',\n');
        out.push(`INSERT INTO \`${table}\` (${cols}) VALUES\n${values};`);
      }
      out.push('');
    }
  }

  out.push('SET FOREIGN_KEY_CHECKS=1;');
  return out.join('\n');
}

/** Restore a .sql dump by executing it against the database. */
export async function restoreSqlDump(sql: string): Promise<void> {
  // Use a dedicated mysql2 connection with multipleStatements enabled,
  // so the whole dump script runs as one batch.
  const mysql = await import('mysql2/promise');
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT || '3306'),
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME     || 'atlinebackend',
    multipleStatements: true,
  });
  try {
    await conn.query(sql);
  } finally {
    await conn.end();
  }
}
