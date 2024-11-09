import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './App.scss';

async function storeConfigInIndexedDB(config) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("firebaseConfigDB", 1);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      db.createObjectStore("configStore");
    };

    request.onerror = () => reject("Failed to open IndexedDB");
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction("configStore", "readwrite");
      transaction.objectStore("configStore").put(config, "firebaseConfig");
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject("Failed to store config in IndexedDB");
    };
  });
}

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

storeConfigInIndexedDB(firebaseConfig)
  .then(() => console.log("Firebase config stored in IndexedDB"))
  .catch(console.error);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/firebase-messaging-sw.js')
    .then((registration) => {
      console.log('Service Worker registered with scope:', registration.scope);

      const sendConfigToServiceWorker = () => {
        registration.active?.postMessage({
          type: 'SET_FIREBASE_CONFIG',
          config: firebaseConfig,
        });
        console.log('Firebase config sent to service worker.');
      };

      if (registration.active) {
        sendConfigToServiceWorker();
      } else {
        registration.addEventListener('statechange', (event) => {
          if (event.target.state === 'activated') {
            sendConfigToServiceWorker();
          }
        });
      }
    })
    .catch((error) => {
      console.error('Service Worker registration failed:', error);
    });
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);