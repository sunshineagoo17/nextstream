importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

let messaging;
let firebaseInitialized = false;
const deferredPushEvents = [];

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SET_FIREBASE_CONFIG') {
    const firebaseConfig = event.data.config;

    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
      messaging = firebase.messaging();
      firebaseInitialized = true;
      console.log('Firebase initialized and messaging set up.');

      // Handle deferred push events immediately after initializing
      if (deferredPushEvents.length > 0) {
        console.log('Processing deferred push events:', deferredPushEvents.length);
        deferredPushEvents.forEach((deferredEvent) => handlePushEvent(deferredEvent));
        deferredPushEvents.length = 0;
      }

      // Attach background message handler once initialized
      messaging.onBackgroundMessage((payload) => {
        console.log('Background message received:', payload);
        const notificationTitle = payload.notification?.title || 'NextStream Notification';
        const notificationOptions = {
          body: payload.notification?.body || 'You have a new message!',
          icon: './nextstream-brandmark-logo.svg',
        };
        self.registration.showNotification(notificationTitle, notificationOptions);
      });
    }
  }
});

self.addEventListener('push', (event) => {
  console.log('Push event received:', event);
  if (firebaseInitialized) {
    handlePushEvent(event);
  } else {
    console.log('Push event received but Firebase is not yet initialized. Deferring:', event);
    deferredPushEvents.push(event);
  }
});

function handlePushEvent(event) {
  let data;
  try {
    data = event.data?.json();
  } catch (error) {
    console.warn('Data is not JSON, using fallback text:', event.data.text());
    data = { notification: { title: 'NextStream Notification', body: event.data.text() } };
  }

  const title = data.notification?.title || 'NextStream Notification';
  const options = {
    body: data.notification?.body || 'Check your calendar. You have media scheduled!',
    icon: data.notification?.icon || './nextstream-brandmark-logo.svg',
  };

  event.waitUntil(self.registration.showNotification(title, options));
}

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

self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('Push subscription change event triggered:', event);
});