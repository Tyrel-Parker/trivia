const router = require('express').Router();
const pool = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Public: get a single fact by id
router.get('/:id', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT f.*, c.name as category_name
     FROM facts f LEFT JOIN categories c ON f.category_id = c.id
     WHERE f.id = $1`,
    [req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

// Auth: list all facts, optional ?category_id filter
router.get('/', requireAuth, async (req, res) => {
  const { category_id } = req.query;
  const params = [];
  let where = '';
  if (category_id) {
    params.push(category_id);
    where = 'WHERE f.category_id = $1';
  }
  const { rows } = await pool.query(
    `SELECT f.*, u.username as created_by_username, c.name as category_name
     FROM facts f
     LEFT JOIN users u ON f.created_by = u.id
     LEFT JOIN categories c ON f.category_id = c.id
     ${where}
     ORDER BY lower(c.name) NULLS LAST, lower(f.short_description)`,
    params
  );
  res.json(rows);
});

// Auth: create a fact
router.post('/', requireAuth, async (req, res) => {
  const { short_description, long_description, category_id } = req.body;
  if (!short_description) return res.status(400).json({ error: 'short_description required' });

  const { rows } = await pool.query(
    'INSERT INTO facts (short_description, long_description, category_id, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
    [short_description, long_description || null, category_id || null, req.user.id]
  );
  res.status(201).json(rows[0]);
});

// Auth: update a fact
router.put('/:id', requireAuth, async (req, res) => {
  const { short_description, long_description, category_id } = req.body;
  const { rows } = await pool.query(
    `UPDATE facts SET
      short_description = COALESCE($1, short_description),
      long_description = COALESCE($2, long_description),
      category_id = CASE WHEN $3::boolean THEN $4::integer ELSE category_id END,
      updated_at = NOW()
     WHERE id = $5 RETURNING *`,
    [
      short_description || null,
      long_description || null,
      'category_id' in req.body,
      category_id !== undefined ? category_id : null,
      req.params.id,
    ]
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
