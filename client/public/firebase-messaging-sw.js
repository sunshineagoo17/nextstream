importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

let messaging;
let firebaseInitialized = false;

// Initialize Firebase and messaging upon receiving configuration
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SET_FIREBASE_CONFIG') {
    const firebaseConfig = event.data.config;

    // Initialize Firebase and Firebase Messaging
    firebase.initializeApp(firebaseConfig);
    messaging = firebase.messaging();
    firebaseInitialized = true;

    console.log('Firebase handlers set up for push and background messages');
  }
});

// Push event listener with conditional logic for Firebase messaging
self.addEventListener('push', (event) => {
  if (firebaseInitialized) {
    const data = event.data?.json();
    const title = data?.title || 'NextStream Notification';
    const options = {
      body: data?.body || 'You have a new notification from NextStream!',
      icon: './nextstream-brandmark-logo.svg',
    };
    event.waitUntil(self.registration.showNotification(title, options));
  } else {
    console.log('Push event received but Firebase is not yet initialized:', event);
  }
});

// Push subscription change listener
self.addEventListener('pushsubscriptionchange', (event) => {
  if (firebaseInitialized) {
    console.log('Handling pushsubscriptionchange with Firebase initialized');
    // Handle subscription renewal logic here
  } else {
    console.log('Push subscription change detected but Firebase is not yet initialized.');
  }
});

// Notification click listener
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
  console.log('Notification click received');
});

// Background message handler for Firebase messaging
if (messaging) {
  messaging.onBackgroundMessage((payload) => {
    if (firebaseInitialized) {
      const notificationTitle = payload.notification.title;
      const notificationOptions = {
        body: payload.notification.body,
        icon: './nextstream-brandmark-logo.svg',
      };
      self.registration.showNotification(notificationTitle, notificationOptions);
    } else {
      console.log('Background message received but Firebase is not yet initialized:', payload);
    }
  });
}