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

      deferredPushEvents.forEach(handlePushEvent);
      deferredPushEvents.length = 0; 
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
    try {
      data = JSON.parse(event.data.text());
    } catch (parseError) {
      console.error('Failed to parse push event data as JSON:', parseError);
      return; 
    }
  }

  const title = data?.title || 'NextStream Notification';
  const options = {
    body: data?.body || 'You have a new notification from NextStream!',
    icon: './nextstream-brandmark-logo.svg',
  };

  event.waitUntil(self.registration.showNotification(title, options));
}

if (!firebaseInitialized && messaging) {
  messaging.onBackgroundMessage((payload) => {
    const notificationTitle = payload.notification.title || 'Background Notification';
    const notificationOptions = {
      body: payload.notification.body,
      icon: './nextstream-brandmark-logo.svg',
    };
    self.registration.showNotification(notificationTitle, notificationOptions);
  });
}