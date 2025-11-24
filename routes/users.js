// routes/users.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { userRegisterValidation, validate } = require('../middleware/validators');
const { sendEmail } = require('../notifications/notifier');

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const MAX_FAILED = parseInt(process.env.MAX_FAILED || '4', 10);

// Register
router.post('/register', userRegisterValidation, validate, async (req, res) => {
  const { username, email, full_name, password, role } = req.body;
  if (!PASSWORD_REGEX.test(password)) {
    return res.status(422).json({ error: 'Password must be min 8 chars, include upper, lower, number and symbol' });
  }
  try {
    const [exists] = await db.query('SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1', [username, email]);
    if (exists.length) return res.status(409).json({ error: 'Username or email already exists' });

    const hash = await bcrypt.hash(password, 12);
    const [result] = await db.query('INSERT INTO users (username, email, full_name, password_hash, role) VALUES (?, ?, ?, ?, ?)', [username, email, full_name || null, hash, role || 'student']);
    const userId = result.insertId;

    // create admin broadcast (new registration)
    await db.query('INSERT INTO notifications (user_id, type, title, message, data, created_by) VALUES (NULL, ?, ?, ?, ?, ?)', 
      ['new_registration', 'New Student Registered', `${full_name || username} registered`, JSON.stringify({ userId, username }), null]);

    // send emails to admins if configured
    const admins = (process.env.ADMIN_EMAILS || '').split(',').map(s => s.trim()).filter(Boolean);
    for (const a of admins) {
      try { await sendEmail(a, 'New registration', `${full_name || username} (${username}) registered`); } catch(e){ /* ignore email errors */ }
    }

    res.json({ message: 'Registered', userId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { identifier, password } = req.body; // identifier = username or email
  const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || null;
  try {
    const [rows] = await db.query('SELECT id, password_hash, role, username FROM users WHERE username = ? OR email = ? LIMIT 1', [identifier, identifier]);
    if (!rows.length) {
      await db.query('INSERT INTO login_attempts (user_id, ip_address, successful, reason) VALUES (NULL, ?, 0, ?)', [ip, 'user_not_found']);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      await db.query('INSERT INTO login_attempts (user_id, ip_address, successful, reason) VALUES (?, ?, 0, ?)', [user.id, ip, 'wrong_password']);
      const [cntRows] = await db.query('SELECT COUNT(*) AS cnt FROM login_attempts WHERE user_id = ? AND successful = 0 AND attempt_time > (NOW() - INTERVAL 15 MINUTE)', [user.id]);
      const cnt = cntRows[0].cnt || 0;
      if (cnt >= MAX_FAILED) {
        await db.query('INSERT INTO notifications (user_id, type, title, message, data, created_by) VALUES (NULL, ?, ?, ?, ?, ?)', 
          ['security_alert', 'Multiple failed logins', `User ${user.username} had ${cnt} failed logins`, JSON.stringify({ userId: user.id, ip }), null]);
        const admins = (process.env.ADMIN_EMAILS || '').split(',').map(s => s.trim()).filter(Boolean);
        for (const a of admins) {
          try { await sendEmail(a, 'Security alert', `User ${user.username} had ${cnt} failed logins from IP ${ip}`); } catch(e){ /* ignore */ }
        }
      }
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    await db.query('INSERT INTO login_attempts (user_id, ip_address, successful, reason) VALUES (?, ?, 1, ?)', [user.id, ip, 'login_success']);
    const token = jwt.sign({ id: user.id, role: user.role, username: user.username }, process.env.JWT_SECRET || 'change_this_secret', { expiresIn: '8h' });
    res.json({ token, role: user.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
