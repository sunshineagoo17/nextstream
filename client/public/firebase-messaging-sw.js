importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

let messaging;
let firebaseInitialized = false;
const deferredPushEvents = [];

// Retrieve Firebase config from IndexedDB
async function getConfigFromIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("firebaseConfigDB");

    request.onerror = () => reject("Failed to open IndexedDB");
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction("configStore", "readonly");
      const store = transaction.objectStore("configStore");
      const getRequest = store.get("firebaseConfig");

      getRequest.onsuccess = () => resolve(getRequest.result);
      getRequest.onerror = () => reject("Failed to retrieve config from IndexedDB");
    };
  });
}

// Initialize Firebase with IndexedDB config
getConfigFromIndexedDB()
  .then((firebaseConfig) => {
    if (firebaseConfig && !firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
      messaging = firebase.messaging();
      firebaseInitialized = true;
      console.log("Firebase initialized from IndexedDB config.");

      // Process any deferred push events
      while (deferredPushEvents.length > 0) {
        const deferredEvent = deferredPushEvents.shift();
        handlePushEvent(deferredEvent);
      }

      // Background message handling
      messaging.onBackgroundMessage((payload) => {
        console.log('Background message received:', payload);
        const notificationTitle = payload.notification?.title || 'NextStream Notification';
        const notificationOptions = {
          body: payload.notification?.body || 'You have a new message!',
          icon: './nextstream-brandmark-logo.svg',
        };
        self.registration.showNotification(notificationTitle, notificationOptions);
      });
    } else {
      console.warn("Firebase config not found in IndexedDB.");
    }
  })
  .catch(console.error);

// Handle push events, deferring if Firebase isn't initialized
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);

  if (firebaseInitialized) {
    handlePushEvent(event);
  } else {
    console.warn('Firebase not yet initialized. Deferring push event:', event);
    deferredPushEvents.push(event);
  }
});

// Function to handle push events and display notifications
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

// Handle push subscription changes
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('Push subscription change event triggered:', event);
});