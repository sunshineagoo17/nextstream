const admin = require('firebase-admin');
const moment = require('moment-timezone');

if (!admin.apps.length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
}

async function sendPushNotifications(user, events) {
    const fcmToken = user.fcmToken;

    if (!fcmToken) {
        console.error('No FCM token provided for user:', user.id);
        return;
    }

    for (const event of events) {
        const eventStartTime = moment.utc(event.start);
        const notificationTime = eventStartTime.clone().subtract(user.notificationTime || 0, 'minutes');

        console.log('Scheduled notification time (UTC):', notificationTime.format());
        console.log('Current time (UTC):', moment.utc().format());

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
                    notificationType: 'calendarEvent'
                },
            };

            try {
                const response = await admin.messaging().send(message);
                console.log('Push notification sent successfully:', response);
            } catch (error) {
                console.error(`Error sending push notification for event ID ${event.id} to user ${user.id}:`, error);

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