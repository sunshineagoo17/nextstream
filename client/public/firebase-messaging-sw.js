importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

let messaging;
let firebaseInitialized = false;
const deferredPushEvents = [];

// Initialize Firebase with config if available
function initializeFirebase(firebaseConfig) {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    messaging = firebase.messaging();
    firebaseInitialized = true;
    console.log('Firebase initialized with config.');

    // Process any deferred push events
    while (deferredPushEvents.length > 0) {
      const deferredEvent = deferredPushEvents.shift();
      handlePushEvent(deferredEvent);
    }

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

// Listen for Firebase configuration from the main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SET_FIREBASE_CONFIG') {
    initializeFirebase(event.data.config);
  }
});

// Handle push events
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);

  if (firebaseInitialized) {
    handlePushEvent(event);
  } else {
    console.warn('Firebase not yet initialized. Deferring push event:', event);
    deferredPushEvents.push(event);
  }
});

// Retry initialization if Firebase config is delayed
function initializeFirebaseFallback() {
  if (!firebaseInitialized && self.firebaseConfig) {
    initializeFirebase(self.firebaseConfig);
  } else if (!firebaseInitialized) {
    setTimeout(initializeFirebaseFallback, 1000);
  }
}

// Call the fallback in case config is delayed
initializeFirebaseFallback();

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

// Handle notification click events
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

// Handle push subscription change events
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('Push subscription change event triggered:', event);
});