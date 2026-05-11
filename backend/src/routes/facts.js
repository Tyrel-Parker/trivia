const router = require('express').Router();
const pool = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Public: get a single fact by id
router.get('/:id', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM facts WHERE id = $1', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

// Auth: list all facts
router.get('/', requireAuth, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT f.*, u.username as created_by_username FROM facts f LEFT JOIN users u ON f.created_by = u.id ORDER BY f.created_at DESC'
  );
  res.json(rows);
});

// Auth: create a fact
router.post('/', requireAuth, async (req, res) => {
  const { short_description, long_description } = req.body;
  if (!short_description) return res.status(400).json({ error: 'short_description required' });

  const { rows } = await pool.query(
    'INSERT INTO facts (short_description, long_description, created_by) VALUES ($1, $2, $3) RETURNING *',
    [short_description, long_description || null, req.user.id]
  );
  res.status(201).json(rows[0]);
});

// Auth: update a fact
router.put('/:id', requireAuth, async (req, res) => {
  const { short_description, long_description } = req.body;
  const { rows } = await pool.query(
    `UPDATE facts SET
      short_description = COALESCE($1, short_description),
      long_description = COALESCE($2, long_description),
      updated_at = NOW()
     WHERE id = $3 RETURNING *`,
    [short_description || null, long_description || null, req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

// Admin: delete a fact
router.delete('/:id', requireAdmin, async (req, res) => {
  const { rowCount } = await pool.query('DELETE FROM facts WHERE id = $1', [req.params.id]);
  if (!rowCount) return res.status(404).json({ error: 'Not found' });
  res.status(204).end();
});

module.exports = router;
