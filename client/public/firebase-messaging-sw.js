importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

let messaging;
let firebaseInitialized = false;
const deferredPushEvents = [];

// Set up Firebase configuration and initialize messaging
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SET_FIREBASE_CONFIG') {
    const firebaseConfig = event.data.config;

    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
      messaging = firebase.messaging();
      firebaseInitialized = true;
      console.log('Firebase initialized and messaging set up.');

      // Process any deferred push events after Firebase is initialized
      if (deferredPushEvents.length > 0) {
        console.log('Processing deferred push events:', deferredPushEvents.length);
        deferredPushEvents.forEach((deferredEvent) => handlePushEvent(deferredEvent));
        deferredPushEvents.length = 0;
      }
    }
  }
});

self.addEventListener('push', (event) => {
  if (firebaseInitialized) {
    handlePushEvent(event);
  } else {
    console.log('Push event received but Firebase is not yet initialized:', event);
    deferredPushEvents.push(event);
  }
});

self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('Push subscription change event triggered:', event);
});

// Notification click event listener to handle notification interactions
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

function handlePushEvent(event) {
  let data;
  try {
    data = event.data?.json();
  } catch (error) {
    console.warn('Data is not JSON, using fallback text:', event.data.text());
    data = { notification: { title: 'Notification', body: event.data.text() } };
  }

  const title = data.notification?.title || 'NextStream Notification';
  const options = {
    body: data.notification?.body || 'Hiya from NextStream!',
    icon: data.notification?.icon || './nextstream-brandmark-logo.svg',
  };

  event.waitUntil(self.registration.showNotification(title, options));
}

if (firebaseInitialized && messaging) {
  messaging.onBackgroundMessage((payload) => {
    const notificationTitle = payload.notification.title || 'Background Notification';
    const notificationOptions = {
      body: payload.notification.body,
      icon: './nextstream-brandmark-logo.svg',
    };
    self.registration.showNotification(notificationTitle, notificationOptions);
  });
}