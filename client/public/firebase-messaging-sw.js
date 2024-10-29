importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

let messaging;

// Placeholder push event handler
self.addEventListener('push', (event) => {
  console.log('Push event received but Firebase is not yet initialized:', event);
});

// Placeholder pushsubscriptionchange handler
self.addEventListener('pushsubscriptionchange', () => {
  console.log('Push subscription change event detected but Firebase is not yet initialized.');
});

// Placeholder notificationclick handler
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received but Firebase is not yet initialized:', event);
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});

// Set up Firebase-dependent event handlers
function setupFirebaseHandlers() {
  // Replace placeholder push event handler with Firebase messaging handler
  self.addEventListener('push', (event) => {
    const data = event.data?.json();
    const title = data?.title || 'NextStream Notification';
    const options = {
      body: data?.body || 'You have a new notification from NextStream!',
      icon: './nextstream-brandmark-logo.svg',
    };
    event.waitUntil(self.registration.showNotification(title, options));
  });

  // Handle background messages with Firebase Messaging
  messaging.onBackgroundMessage((payload) => {
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
      body: payload.notification.body,
      icon: './nextstream-brandmark-logo.svg',
    };
    self.registration.showNotification(notificationTitle, notificationOptions);
  });

  console.log('Firebase handlers set up for push and background messages');
}

// Initialize Firebase after receiving configuration from the main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SET_FIREBASE_CONFIG') {
    const firebaseConfig = event.data.config;

    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    messaging = firebase.messaging();

    // Set up Firebase-specific event handling
    setupFirebaseHandlers();
  }
});