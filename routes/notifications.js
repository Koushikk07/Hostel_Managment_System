// routes/notifications.js
const express = require('express');
const router = express.Router();
const db = require('../db');

try {
  const notifier = require('../notifications/notifier');
  module.exports.sendEmail = notifier.sendEmail;
} catch(e){}

// Fetch notifications for a user (includes broadcasts: user_id IS NULL)
router.get('/:userId', async (req, res) => {
  const userId = req.params.userId;
  try {
    const [rows] = await db.query('SELECT * FROM notifications WHERE user_id = ? OR user_id IS NULL ORDER BY created_at DESC LIMIT 100', [userId]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin broadcast: target === 'all' -> create single broadcast row; or pass array of user ids
router.post('/broadcast', async (req, res) => {
  const { title, message, created_by, target } = req.body;
  try {
    if (target === 'all') {
      await db.query('INSERT INTO notifications (user_id, type, title, message, data, created_by) VALUES (NULL, "admin_broadcast", ?, ?, ?, ?)', [title, message, JSON.stringify({ broadcast:true }), created_by || null]);
      return res.json({ message: 'Broadcast created' });
    } else if (Array.isArray(target) && target.length) {
      const inserts = target.map(uid => [uid, 'admin_broadcast', title, message, JSON.stringify({ broadcast:true }), created_by || null]);
      const sql = 'INSERT INTO notifications (user_id, type, title, message, data, created_by) VALUES ?';
      await db.query(sql, [inserts]);
      return res.json({ message: 'Notifications created for targets' });
    } else {
      return res.status(400).json({ error: 'Invalid target' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
