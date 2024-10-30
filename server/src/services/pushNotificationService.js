const admin = require('firebase-admin');
const moment = require('moment-timezone');
const path = require('path');

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
        console.error('No FCM token provided.');
        return;
    }

    for (const event of events) {
        const eventStartTime = moment(event.start).format('YYYY-MM-DD HH:mm:ss');
        const notificationOffset = user.notificationTime || 0; 

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
            console.log('Push notification sent successfully:', response);
        } catch (error) {
            console.error(`Error sending push notification for event ID ${event.id} to user ${user.id}:`, error);

            if (error.code === 'messaging/invalid-recipient') {
                console.error('Invalid FCM token, please verify that the token is correct.');
            } else if (error.code === 'messaging/invalid-argument') {
                console.error('Invalid notification payload structure. Double-check the message object.');
            } else {
                console.error('Unexpected error encountered:', error.message);
            }
        }
    }
}

module.exports = {
    sendPushNotifications,
};