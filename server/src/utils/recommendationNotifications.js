const crypto = require('crypto');
const sgMail = require('@sendgrid/mail');
const knex = require('../config/db');
require('dotenv').config();

// Set SendGrid API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendRecommendationNotifications = async (email, recommendations) => {
  // Check if the user already has a valid unsubscribe token
  const user = await knex('users').where({ email }).first();
  let token = user.unsubscribeToken;
  let tokenExpiry = user.unsubscribeExpires;

  // If the token has expired or doesn't exist, generate a new one
  if (!token || Date.now() > tokenExpiry) {
    token = crypto.randomBytes(20).toString('hex');
    tokenExpiry = Date.now() + 3600000 * 24; // Token valid for 24 hours

    // Save the new token and expiry to the database
    await knex('users').where({ email }).update({
      unsubscribeToken: token,
      unsubscribeExpires: tokenExpiry,
    });
  }

  // Use encodeURIComponent to ensure the token is URL-safe
  const unsubscribeURL = `${process.env.CLIENT_URL}/unsubscribe?token=${encodeURIComponent(token)}`;

  const recommendationsList = recommendations.map(rec => `<li>${rec}</li>`).join('');

  const msg = {
    to: email,
    from: 'contact@nextstream.ca',
    subject: 'Your NextStream Recommendations',
    text: `Here are your new recommendations: ${recommendations.join(', ')}\n\nTo unsubscribe from these emails, click the following link: ${unsubscribeURL}`,
    html: `
      <div style="font-family: Helvetica, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; padding: 20px; background-color: #001f3f;">
        <div style="box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2); border-radius: 10px; overflow: hidden;">
          <div style="padding: 20px; background-color: #007BFF; color: #fff;">
            <h2 style="margin: 0;">Your New Recommendations</h2>
          </div>
          <div style="padding: 20px; background-color: #fff;">
            <p>Hi there,</p>
            <p>Here are your new recommendations from NextStream:</p>
            <ul>
              ${recommendationsList}
            </ul>
            <p>Enjoy watching!</p>
            <p>Thanks and happy streaming,<br/>The NextStream Team</p>
            <p>If you'd like to unsubscribe from these emails, please click the link below:</p>
            <p><a href="${unsubscribeURL}">Unsubscribe</a></p>
          </div>
        </div>
      </div>`,
  };

  try {
    // Send email using SendGrid
    await sgMail.send(msg);
  } catch (error) {
    throw new Error("Sorry, we couldn't send your recommendations.");
  }
};

module.exports = { sendRecommendationNotifications };