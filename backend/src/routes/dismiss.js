const router = require('express').Router();
const jwt = require('jsonwebtoken');
const pool = require('../db');

// Called by the ntfy action button — no session auth, uses a short-lived signed token
router.post('/:token', async (req, res) => {
  let payload;
  try {
    payload = jwt.verify(req.params.token, process.env.DISMISS_SECRET);
  } catch {
    // Token expired or invalid — redirect to login
    return res.redirect(`${process.env.FRONTEND_URL}/login`);
  }

  const { factId, profileId } = payload;
  await pool.query(
    'UPDATE profile_facts SET removed = TRUE WHERE profile_id = $1 AND fact_id = $2',
    [profileId, factId]
  );

  res.redirect(`${process.env.FRONTEND_URL}/dismissed`);
});

module.exports = router;
