const express = require('express');
const sgMail = require('@sendgrid/mail');
const crypto = require('crypto');
const knex = require('../config/db');
const router = express.Router();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Send password reset email
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await knex('users').where({ email }).first();
    if (!user) {
      return res.status(404).json({ message: 'No user with that email address found.' });
    }

    const token = crypto.randomBytes(20).toString('hex');
    const tokenExpiry = Date.now() + 3600000; // 1 hour from now

    await knex('users')
      .where({ email })
      .update({ resetPasswordToken: token, resetPasswordExpires: tokenExpiry });

    const resetURL = `http://localhost:3000/reset-password?token=${token}`; 

    const msg = {
      to: email,
      from: 'contact@nextstream.ca',
      subject: 'NextStream Password Reset Request',
      text: `Hello from NextStream Support! You requested a password reset. Please use the following link to reset your password: ${resetURL}`,
      html: `<strong>You requested a password reset. Please use the following link to reset your password:</strong> <a href="${resetURL}">Reset Password</a>`,
    };

    await sgMail.send(msg);
    res.status(200).json({ message: 'Password reset email sent.' });
  } catch (error) {
    console.error('Error sending password reset email:', error);
    res.status(500).json({ message: 'Error sending password reset email.' });
  }
});

module.exports = router;