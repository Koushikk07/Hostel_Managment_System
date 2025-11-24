// routes/payments.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /api/payments/pay { user_id, amount, txn_id, method }
router.post('/pay', async (req, res) => {
  const { user_id, amount, txn_id, method } = req.body;
  try {
    const [ins] = await db.query('INSERT INTO payments (user_id, amount, currency, payment_method, txn_id, status, paid_at) VALUES (?, ?, "INR", ?, ?, "completed", NOW())', [user_id, amount, method, txn_id]);
    const paymentId = ins.insertId;
    // notify student
    await db.query('INSERT INTO notifications (user_id, type, title, message, data, created_by) VALUES (?, "payment_completed", ?, ?, ?, NULL)', [user_id, 'Payment received', `Payment of ₹${amount} received`, JSON.stringify({ paymentId, txn_id })]);
    // notify admins
    await db.query('INSERT INTO notifications (user_id, type, title, message, data, created_by) VALUES (NULL, "payment_completed", ?, ?, ?, NULL)', ['Payment received', `User ${user_id} paid ₹${amount}`, JSON.stringify({ paymentId, txn_id })]);
    res.json({ message: 'Payment recorded', paymentId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
