import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './App.scss';

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/firebase-messaging-sw.js')
    .then((registration) => {
      console.log('Service Worker registered with scope:', registration.scope);
      
      if (
        process.env.REACT_APP_FIREBASE_API_KEY &&
        process.env.REACT_APP_FIREBASE_AUTH_DOMAIN &&
        process.env.REACT_APP_FIREBASE_PROJECT_ID &&
        process.env.REACT_APP_FIREBASE_STORAGE_BUCKET &&
        process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID &&
        process.env.REACT_APP_FIREBASE_APP_ID
      ) {
        registration.active?.postMessage({
          type: 'SET_FIREBASE_CONFIG',
          config: {
            apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
            authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
            projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
            storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
            messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
            appId: process.env.REACT_APP_FIREBASE_APP_ID,
          },
        });
        console.log('Firebase configuration message sent to service worker.');
      } else {
        console.error('Firebase configuration is incomplete. Check environment variables.');
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