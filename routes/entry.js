// routes/entry.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /api/entry/log  { user_id, entry_time (optional), reason, recorded_by }
router.post('/log', async (req, res) => {
  const { user_id, entry_time, reason, recorded_by } = req.body;
  try {
    const [ins] = await db.query('INSERT INTO entry_logs (user_id, entry_time, reason, recorded_by) VALUES (?, ?, ?, ?)', [user_id, entry_time || null, reason || null, recorded_by || null]);
    const entryId = ins.insertId;
    // notify admins
    await db.query('INSERT INTO notifications (user_id, type, title, message, data, created_by) VALUES (NULL, "late_entry", ?, ?, ?, ?)', ['Late entry recorded', `User ${user_id} logged late entry`, JSON.stringify({ entryId, user_id, reason }), recorded_by || null]);
    res.json({ message: 'Entry logged', entryId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
