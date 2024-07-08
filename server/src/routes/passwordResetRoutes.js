const express = require('express');
const sgMail = require('@sendgrid/mail');
const crypto = require('crypto');
const knex = require('../config/db');
const { hashPassword } = require('../utils/hashPasswords'); 
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
      subject: 'Password Reset Request',
      text: `You requested a password reset. Please use the following link to reset your password: ${resetURL}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <p>Hi there,</p>
          <p>You requested a password reset. Please use the following link to reset your password:</p>
          <p><a href="${resetURL}" style="color: #007BFF; text-decoration: none;">Reset Password</a></p>
          <p>If you did not request this, please ignore this email.</p>
          <p>Thanks,<br/>The NextStream Team</p>
        </div>`,
    };

    await sgMail.send(msg);
    res.status(200).json({ message: 'Password reset email sent.' });
  } catch (error) {
    console.error('Error sending password reset email:', error);
    res.status(500).json({ message: 'Error sending password reset email.' });
  }
});

// Handle password reset
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    const user = await knex('users')
      .where({ resetPasswordToken: token })
      .andWhere('resetPasswordExpires', '>', Date.now())
      .first();

    if (!user) {
      return res.status(400).json({ message: 'Password reset token is invalid or has expired.' });
    }

    const hashedPassword = await hashPassword(newPassword);
    console.log('New hashed password:', hashedPassword);

    await knex('users')
      .where({ id: user.id })
      .update({
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      });

    console.log('Password updated in database:', hashedPassword);

    res.status(200).json({ message: 'Password has been reset.', success: true });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ message: 'Error resetting password.' });
  }
});

module.exports = router;
