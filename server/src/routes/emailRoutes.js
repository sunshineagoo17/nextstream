const express = require('express');
const router = express.Router();
const sgMail = require('@sendgrid/mail');
require('dotenv').config();

// Set SendGrid API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

router.post('/send', async (req, res) => {
  const { name, email, message } = req.body;

  // Validate required fields
  if (!name || !email || !message) {
    return res.status(400).json({ message: 'Missing required fields: name, email, message' });
  }

  const msg = {
    to: 'contact@nextstream.ca', // Recipient's email address
    from: 'contact@nextstream.ca', // Verified sender's email
    replyTo: email, // User's email
    subject: `Contact Form Submission from ${name}`,
    text: message,
  };

  try {
    // Send email using SendGrid
    const response = await sgMail.send(msg);
    res.status(200).json({ message: 'Email sent successfully!' });
  } catch (error) {
    res.status(500).json({ message: "Sorry, we couldn't send your message.", error: error.response ? error.response.body : error });
  }
});

module.exports = router;