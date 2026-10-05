import knex from 'knex';

const db = knex({
  client: 'mysql2',
  connection: {
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT || '3306'),
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME     || 'atlinebackend',
    timezone: '+08:00',
  },
  pool: {
    min: 0,
    max: 10,
    acquireTimeoutMillis: 30000,
    idleTimeoutMillis:    30000,
  },
});

export default db;
