// notifications/notifier.js
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.example.com',
  port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'user@example.com',
    pass: process.env.SMTP_PASS || 'password'
  }
});

async function sendEmail(to, subject, text, html) {
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"Hostel App" <no-reply@example.com>',
    to,
    subject,
    text,
    html
  });
  return info;
}

module.exports = { sendEmail };
