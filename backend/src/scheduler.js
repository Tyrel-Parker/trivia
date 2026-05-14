const cron = require('node-cron');
const jwt = require('jsonwebtoken');
const pool = require('./db');
const { publish } = require('./ntfy');

async function pickNextFact(profileId, cyclingOrder) {
  if (cyclingOrder === 'random') {
    const { rows } = await pool.query(
      `SELECT pf.fact_id, f.short_description
       FROM profile_facts pf JOIN facts f ON pf.fact_id = f.id
       WHERE pf.profile_id = $1 AND pf.removed = FALSE
       ORDER BY RANDOM() LIMIT 1`,
      [profileId]
    );
    return rows[0] || null;
  }

  if (cyclingOrder === 'round-robin') {
    const { rows } = await pool.query(
      `SELECT pf.fact_id, f.short_description
       FROM profile_facts pf JOIN facts f ON pf.fact_id = f.id
       WHERE pf.profile_id = $1 AND pf.removed = FALSE
       ORDER BY pf.last_sent_at ASC NULLS FIRST LIMIT 1`,
      [profileId]
    );
    return rows[0] || null;
  }

  // shuffle: pick randomly from the facts with the lowest send_count (complete a pass before repeating)
  const { rows } = await pool.query(
    `SELECT pf.fact_id, f.short_description
     FROM profile_facts pf JOIN facts f ON pf.fact_id = f.id
     WHERE pf.profile_id = $1 AND pf.removed = FALSE
       AND pf.send_count = (
         SELECT MIN(send_count) FROM profile_facts
         WHERE profile_id = $1 AND removed = FALSE
       )
     ORDER BY RANDOM() LIMIT 1`,
    [profileId]
  );
  return rows[0] || null;
}

async function sendNotificationForProfile(profile) {
  const fact = await pickNextFact(profile.id, profile.cycling_order);
  if (!fact) return;

  const dismissToken = jwt.sign(
    { factId: fact.fact_id, profileId: profile.id },
    process.env.DISMISS_SECRET,
    { expiresIn: '48h' }
  );

  const viewUrl = `${process.env.FRONTEND_URL}/facts/${fact.fact_id}`;
  const dismissUrl = `${process.env.FRONTEND_URL}/api/dismiss/${dismissToken}`;

  await publish({
    topic: profile.ntfy_topic,
    message: fact.short_description,
    actions: [
      `view, View, ${viewUrl}`,
      `http, Remove from list, ${dismissUrl}, method=POST`,
    ],
  });

  await pool.query(
    `UPDATE profile_facts SET last_sent_at = NOW(), send_count = send_count + 1
     WHERE profile_id = $1 AND fact_id = $2`,
    [profile.id, fact.fact_id]
  );

  await pool.query('UPDATE profiles SET last_notified_at = NOW() WHERE id = $1', [profile.id]);
}

function getLocalHour(timezone) {
  if (!timezone) return new Date().getHours();
  try {
    const h = parseInt(
      new Intl.DateTimeFormat('en-US', { timeZone: timezone, hour: 'numeric', hour12: false }).format(new Date()),
      10
    );
    return h === 24 ? 0 : h; // some locales return 24 for midnight
  } catch {
    return new Date().getHours();
  }
}

function isInQuietHours(startHour, endHour, timezone) {
  if (startHour == null || endHour == null) return false;
  if (startHour === endHour) return false;
  const hour = getLocalHour(timezone);
  if (startHour < endHour) return hour >= startHour && hour < endHour;
  // wraps midnight
  return hour >= startHour || hour < endHour;
}

async function checkProfiles() {
  const { rows: profiles } = await pool.query('SELECT * FROM profiles');

  for (const profile of profiles) {
    if (isInQuietHours(profile.quiet_start_hour, profile.quiet_end_hour, profile.timezone)) continue;

    const frequencyMs = profile.send_frequency_minutes * 60 * 1000;
    const lastNotified = profile.last_notified_at ? new Date(profile.last_notified_at).getTime() : 0;
    const due = Date.now() - lastNotified >= frequencyMs;

    if (due) {
      sendNotificationForProfile(profile).catch(err =>
        console.error(`Failed to notify profile ${profile.id}:`, err)
      );
    }
  }
}

function startScheduler() {
  // Check every minute whether any profile is due for a notification
  cron.schedule('* * * * *', checkProfiles);
  console.log('Scheduler started');
}

module.exports = { startScheduler };
