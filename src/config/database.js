const { Pool } = require('pg');

/**
 * PostgreSQL connection pool
 */
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Handle connection errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client:', err);
});

// Test connection on startup
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection test failed:', err.message);
  } else {
    console.log('✓ Database connected successfully');
  }
});

module.exports = pool;
