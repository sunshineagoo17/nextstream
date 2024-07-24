const sgMail = require('@sendgrid/mail');
require('dotenv').config();

// Set SendGrid API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendRecommendationNotifications = async (email, recommendations) => {
  const recommendationsList = recommendations.map(rec => `<li>${rec}</li>`).join('');

  const msg = {
    to: email,
    from: 'contact@nextstream.ca',
    subject: 'Your New Recommendations',
    text: `Here are your new recommendations: ${recommendations.join(', ')}`,
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
          </div>
        </div>
      </div>`,
  };

  try {
    console.log('Sending email with the following details:', msg);
    // Send email using SendGrid
    await sgMail.send(msg);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error.response ? error.response.body : error);
    throw new Error("Sorry, we couldn't send your recommendations.");
  }
};

module.exports = { sendRecommendationNotifications };