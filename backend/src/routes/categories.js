const router = require('express').Router();
const pool = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Auth: list all categories
router.get('/', requireAuth, async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM categories ORDER BY name');
  res.json(rows);
});

// Admin: create a category
router.post('/', requireAdmin, async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const { rows } = await pool.query(
    'INSERT INTO categories (name) VALUES ($1) RETURNING *',
    [name.trim()]
  );
  res.status(201).json(rows[0]);
});

// Admin: rename a category
router.put('/:id', requireAdmin, async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const { rows } = await pool.query(
    'UPDATE categories SET name = $1 WHERE id = $2 RETURNING *',
    [name.trim(), req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

// Admin: delete a category (facts lose their category, not deleted)
router.delete('/:id', requireAdmin, async (req, res) => {
  const { rowCount } = await pool.query('DELETE FROM categories WHERE id = $1', [req.params.id]);
  if (!rowCount) return res.status(404).json({ error: 'Not found' });
  res.status(204).end();
});

module.exports = router;
