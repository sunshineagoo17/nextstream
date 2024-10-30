importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

let messaging;
let firebaseInitialized = false;
const deferredPushEvents = [];

// Initialize Firebase upon receiving configuration
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SET_FIREBASE_CONFIG') {
    const firebaseConfig = event.data.config;

    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
      messaging = firebase.messaging();
      firebaseInitialized = true;
      console.log('Firebase initialized and messaging set up.');

      // Process any deferred push events
      deferredPushEvents.forEach(handlePushEvent);
      deferredPushEvents.length = 0; // Clear the deferred events array
    }
  }
});

// Push event listener with deferred handling
self.addEventListener('push', (event) => {
  if (firebaseInitialized) {
    handlePushEvent(event);
  } else {
    console.log('Push event received but Firebase is not yet initialized:', event);
    deferredPushEvents.push(event); // Defer push event if Firebase is not ready
  }
});

// Function to handle push events
function handlePushEvent(event) {
  let data;

  // Check if event.data is an object or needs to be parsed from a string
  try {
    data = event.data?.json(); // Attempt to parse as JSON if possible
  } catch (error) {
    // Fallback to parsing text data as JSON if json() fails
    try {
      data = JSON.parse(event.data.text());
    } catch (parseError) {
      console.error('Failed to parse push event data as JSON:', parseError);
      return; // Exit if data cannot be parsed
    }
  }

  const title = data?.title || 'NextStream Notification';
  const options = {
    body: data?.body || 'You have a new notification from NextStream!',
    icon: './nextstream-brandmark-logo.svg',
  };

  // Ensure notification shows with waitUntil
  event.waitUntil(self.registration.showNotification(title, options));
}


// Background message handler for Firebase messaging
self.addEventListener('activate', () => {
  if (messaging) {
    messaging.onBackgroundMessage((payload) => {
      const notificationTitle = payload.notification.title || 'Background Notification';
      const notificationOptions = {
        body: payload.notification.body,
        icon: './nextstream-brandmark-logo.svg',
      };
      self.registration.showNotification(notificationTitle, notificationOptions);
    });
  } else {
    console.log('Firebase messaging not initialized for background messages.');
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