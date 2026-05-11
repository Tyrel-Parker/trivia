const router = require('express').Router();
const pool = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

function canAccessProfile(user, profile) {
  return user.role === 'admin' || profile.user_id === user.id;
}

// List all profiles (admin sees all, user sees own)
router.get('/', requireAuth, async (req, res) => {
  const query = req.user.role === 'admin'
    ? 'SELECT p.*, u.username FROM profiles p LEFT JOIN users u ON p.user_id = u.id ORDER BY p.id'
    : 'SELECT p.*, u.username FROM profiles p LEFT JOIN users u ON p.user_id = u.id WHERE p.user_id = $1 ORDER BY p.id';
  const params = req.user.role === 'admin' ? [] : [req.user.id];
  const { rows } = await pool.query(query, params);
  res.json(rows);
});

// Get a single profile
router.get('/:id', requireAuth, async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM profiles WHERE id = $1', [req.params.id]);
  const profile = rows[0];
  if (!profile) return res.status(404).json({ error: 'Not found' });
  if (!canAccessProfile(req.user, profile)) return res.status(403).json({ error: 'Forbidden' });
  res.json(profile);
});

// Admin: create a profile
router.post('/', requireAdmin, async (req, res) => {
  const { name, ntfy_topic, send_frequency_hours = 4, cycling_order = 'shuffle', user_id } = req.body;
  if (!name || !ntfy_topic || !user_id) return res.status(400).json({ error: 'name, ntfy_topic, user_id required' });
  const { rows } = await pool.query(
    'INSERT INTO profiles (name, ntfy_topic, send_frequency_hours, cycling_order, user_id) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [name, ntfy_topic, send_frequency_hours, cycling_order, user_id]
  );
  res.status(201).json(rows[0]);
});

// Admin or owner: update a profile
router.put('/:id', requireAuth, async (req, res) => {
  const { rows: existing } = await pool.query('SELECT * FROM profiles WHERE id = $1', [req.params.id]);
  if (!existing[0]) return res.status(404).json({ error: 'Not found' });
  if (!canAccessProfile(req.user, existing[0])) return res.status(403).json({ error: 'Forbidden' });

  const { name, ntfy_topic, send_frequency_hours, cycling_order } = req.body;
  const { rows } = await pool.query(
    `UPDATE profiles SET
      name = COALESCE($1, name),
      ntfy_topic = COALESCE($2, ntfy_topic),
      send_frequency_hours = COALESCE($3, send_frequency_hours),
      cycling_order = COALESCE($4, cycling_order)
     WHERE id = $5 RETURNING *`,
    [name || null, ntfy_topic || null, send_frequency_hours || null, cycling_order || null, req.params.id]
  );
  res.json(rows[0]);
});

// Admin: delete a profile
router.delete('/:id', requireAdmin, async (req, res) => {
  const { rowCount } = await pool.query('DELETE FROM profiles WHERE id = $1', [req.params.id]);
  if (!rowCount) return res.status(404).json({ error: 'Not found' });
  res.status(204).end();
});

// List facts in a profile (active only)
router.get('/:id/facts', requireAuth, async (req, res) => {
  const { rows: existing } = await pool.query('SELECT * FROM profiles WHERE id = $1', [req.params.id]);
  if (!existing[0]) return res.status(404).json({ error: 'Not found' });
  if (!canAccessProfile(req.user, existing[0])) return res.status(403).json({ error: 'Forbidden' });

  const { rows } = await pool.query(
    `SELECT f.*, pf.added_at, pf.last_sent_at, pf.send_count
     FROM profile_facts pf
     JOIN facts f ON pf.fact_id = f.id
     WHERE pf.profile_id = $1 AND pf.removed = FALSE
     ORDER BY pf.added_at DESC`,
    [req.params.id]
  );
  res.json(rows);
});

// Add a fact to a profile
router.post('/:id/facts', requireAuth, async (req, res) => {
  const { rows: existing } = await pool.query('SELECT * FROM profiles WHERE id = $1', [req.params.id]);
  if (!existing[0]) return res.status(404).json({ error: 'Not found' });
  if (!canAccessProfile(req.user, existing[0])) return res.status(403).json({ error: 'Forbidden' });

  const { fact_id } = req.body;
  if (!fact_id) return res.status(400).json({ error: 'fact_id required' });

  const { rows } = await pool.query(
    `INSERT INTO profile_facts (profile_id, fact_id)
     VALUES ($1, $2)
     ON CONFLICT (profile_id, fact_id) DO UPDATE SET removed = FALSE, added_at = NOW()
     RETURNING *`,
    [req.params.id, fact_id]
  );
  res.status(201).json(rows[0]);
});

// Remove a fact from a profile
router.delete('/:id/facts/:factId', requireAuth, async (req, res) => {
  const { rows: existing } = await pool.query('SELECT * FROM profiles WHERE id = $1', [req.params.id]);
  if (!existing[0]) return res.status(404).json({ error: 'Not found' });
  if (!canAccessProfile(req.user, existing[0])) return res.status(403).json({ error: 'Forbidden' });

  await pool.query(
    'UPDATE profile_facts SET removed = TRUE WHERE profile_id = $1 AND fact_id = $2',
    [req.params.id, req.params.factId]
  );
  res.status(204).end();
});

module.exports = router;
