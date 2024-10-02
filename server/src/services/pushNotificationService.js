const admin = require('firebase-admin');
const moment = require('moment-timezone');
const path = require('path');

if (!admin.apps.length) {
    const serviceAccount = require(path.join(__dirname, '../creds/nextstream-serviceAccountKey.json'));

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
}

async function sendPushNotifications(user, events) {
    const fcmToken = user.fcmToken;

    if (!fcmToken) {
        console.error('FCM token is missing for user:', user.id);
        return; 
    }

    for (const event of events) {
        // Log the event start time and notification offset
        const eventStartTime = moment(event.start).format('YYYY-MM-DD HH:mm:ss');
        const notificationOffset = user.notificationTime || 0; 
        console.log(`Event Start Time: ${eventStartTime}`);
        console.log(`Notification Time Offset: ${notificationOffset} minutes`);

        const message = {
            notification: {
                title: `Upcoming Stream: ${event.title}`,
                body: `Your viewing will start at ${moment(event.start).format('HH:mm')}`,
            },
            token: fcmToken, 
            data: {
                url: `/calendar/${user.id}/events/${event.id}`, 
                eventId: event.id.toString(),
            },
        };

        try {
            const response = await admin.messaging().send(message);
            console.log(`Push notification sent for upcoming title: ${event.title}, response: ${response}`);
        } catch (error) {
            console.error('Error sending push notification:', error);
        }
    }
}

module.exports = {
    sendPushNotifications,
};