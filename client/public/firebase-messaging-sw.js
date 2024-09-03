importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

console.log('Service worker script started.');

let messaging;

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SET_FIREBASE_CONFIG') {
    const firebaseConfig = event.data.config;

    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);

    // Retrieve Firebase Messaging object
    messaging = firebase.messaging();

    // Handle background messages
    messaging.onBackgroundMessage((payload) => {
      console.log('[firebase-messaging-sw.js] Received background message', payload);
      const notificationTitle = payload.notification.title;
      const notificationOptions = {
        body: payload.notification.body,
        icon: './nextstream-brandmark-logo.svg', 
      };

      // Check if notification permission is granted
      if (Notification.permission === 'granted') {
        self.registration.showNotification(notificationTitle, notificationOptions);
      } else {
        console.warn('Notification permission not granted.');
      }
    });

    console.log('Firebase initialized in service worker.');
  }
});

console.log('Service worker script finished.');