const sgMail = require('@sendgrid/mail');
require('dotenv').config();

// Set SendGrid API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendScheduledEventReminders = async (email, events) => {
  const eventsList = events.map(event => `<li>${event.title} - ${new Date(event.start).toLocaleString()}</li>`).join('');

  const msg = {
    to: email,
    from: 'contact@nextstream.ca',
    subject: 'Upcoming NextStream Titles Reminder',
    text: `Here are your scheduled NextStream titles for today: ${events.map(event => `${event.title} on ${new Date(event.start).toLocaleString()}`).join(', ')}`,
    html: `
      <div style="font-family: Helvetica, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; padding: 20px; background-color: #001f3f;">
        <div style="box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2); border-radius: 10px; overflow: hidden;">
          <div style="padding: 20px; background-color: #007BFF; color: #fff;">
            <h2 style="margin: 0;">Upcoming NextStream Reminder</h2>
          </div>
          <div style="padding: 20px; background-color: #fff;">
            <p>Hi there,</p>
            <p>Here are your upcoming NextStream titles for today:</p>
            <ul>
              ${eventsList}
            </ul>
            <p>Enjoy watching and happy streaming!</p>
            <p>Your crew,<br/>The NextStream Team</p>
          </div>
        </div>
      </div>`,
  };

  try {
    console.log('Sending email to:', email);
    console.log('Email content:', msg);
    // Send email using SendGrid
    await sgMail.send(msg);
    console.log('Email sent successfully to:', email);
  } catch (error) {
    console.error('Error sending email:', error.response ? error.response.body : error);
    throw new Error("Sorry, we couldn't send your reminder notifications.");
  }
};

module.exports = { sendScheduledEventReminders };