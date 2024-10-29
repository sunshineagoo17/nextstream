importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

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
      const notificationTitle = payload.notification.title;
      const notificationOptions = {
        body: payload.notification.body,
        icon: './nextstream-brandmark-logo.svg', 
      };

      // Check if notification permission is granted
      if (Notification.permission === 'granted') {
        self.registration.showNotification(notificationTitle, notificationOptions);
      }
    });
  }
});

// Add `push` event listener immediately
self.addEventListener('push', (event) => {
  const data = event.data?.json();
  const title = data?.title || 'NextStream Notification';
  const options = {
    body: data?.body || 'You have a new notification from NextStream!',
    icon: './nextstream-brandmark-logo.svg',
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Add `pushsubscriptionchange` event listener immediately
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('Push subscription change event detected:');
});

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
});