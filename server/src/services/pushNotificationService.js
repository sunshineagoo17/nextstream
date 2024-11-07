const admin = require('firebase-admin');
const moment = require('moment-timezone');
const path = require('path');

// Initialize Firebase Admin SDK only if not already initialized
if (!admin.apps.length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
}

/**
 * Sends push notifications for each event in a user's list of events if the notification time is reached.
 * @param {Object} user - The user object, including fcmToken and notification preferences.
 * @param {Array} events - The list of events, each containing start time, title, and ID.
 */
async function sendPushNotifications(user, events) {
    const fcmToken = user.fcmToken;

    if (!fcmToken) {
        console.error('No FCM token provided for user:', user.id);
        return;
    }

    for (const event of events) {
        const eventStartTime = moment.utc(event.start);
        const notificationTime = eventStartTime.clone().subtract(user.notificationTime || 0, 'minutes');
        
        // Check if the current time is at or past the user's notification time
        if (moment().isSameOrAfter(notificationTime)) {
            const message = {
                notification: {
                    title: `Upcoming Stream: ${event.title}`,
                    body: `Your viewing will start at ${eventStartTime.format('HH:mm')}`,
                },
                token: fcmToken,
                data: {
                    eventId: event.id.toString(),
                    click_action: `/calendar?eventId=${event.id}`,
                    url: `/calendar/${user.id}/events/${event.id}`,
                },
            };

            try {
                const response = await admin.messaging().send(message);
                console.log('Push notification sent successfully:', response);
            } catch (error) {
                console.error(`Error sending push notification for event ID ${event.id} to user ${user.id}:`, error);

                // Handle specific Firebase Messaging errors
                if (error.code === 'messaging/registration-token-not-registered') {
                    console.error('Invalid FCM token. The token might have expired or been revoked.');
                } else if (error.code === 'messaging/invalid-argument') {
                    console.error('Invalid notification payload structure. Double-check the message object.');
                } else {
                    console.error('Unexpected error encountered:', error.message);
                }
            }
        } else {
            console.log(`Skipping notification for event ID ${event.id} as the notification time has not been reached.`);
        }
    }
}

module.exports = {
    sendPushNotifications,
};