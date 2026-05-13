const bcrypt = require('bcrypt');
const pool = require('./db');

async function seedAdmin() {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin';

  const { rows } = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
  if (rows.length > 0) return;

  const hash = await bcrypt.hash(password, 10);
  await pool.query(
    'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)',
    [username, hash, 'admin']
  );
  console.log(`Created admin user: ${username}`);
}

module.exports = { seedAdmin };
