import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken } from 'firebase/messaging';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import api from './api';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// Initialize Firebase app if not already initialized
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// Firebase Messaging setup
const messaging = getMessaging(app);

// Firebase Authentication setup
const auth = getAuth(app);

// Google provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Check if notification permission is granted
export const hasNotificationPermission = () => Notification.permission === 'granted';

// Request notification permission if not already granted
export const requestMessagingPermission = async () => {
  if (Notification.permission === 'granted') return true;
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

// Register with Google
const signInAndRegisterWithGoogle = async () => {
  try {
    await logOut();

    const result = await signInWithPopup(auth, googleProvider);

    if (!result || !result.user) {
      throw new Error("Google sign-in did not return a user.");
    }

    // Send registration request to your server
    const response = await api.post('/api/auth/oauth-register', {
      email: result.user.email,
      displayName: result.user.displayName,
      provider: 'google',
    });

    if (!response.data.success) {
      throw new Error(response.data.message || 'OAuth registration failed.');
    }

    return result;
  } catch (error) {
    throw error;
  }
};

// Login with Google
const signInWithGoogle = async () => {
  try {
    await logOut();

    const result = await signInWithPopup(auth, googleProvider);

    if (!result || !result.user) {
      throw new Error("Google sign-in did not return a user.");
    }

    // Send login request to your server to check if the user is already registered
    const response = await api.post('/api/auth/oauth-login', {
      email: result.user.email,
      provider: 'google',
    });

    if (!response.data.success) {
      throw new Error(response.data.message || 'OAuth login failed.');
    }

    return result;
  } catch (error) {
    throw error;
  }
};

// Sign out function
const logOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw error;
  }
};

// Send FCM token to server
export const sendTokenToServer = async (token) => {
  try {
    await api.post('/api/profile/update-fcm-token', { fcmToken: token });
    console.log('FCM token sent to server successfully.');
  } catch (error) {
    console.error('Error sending FCM token to server:', error);
  }
};

// Obtain FCM token if permission is granted
export const requestFCMToken = async () => {
  try {
    const permissionGranted = await requestMessagingPermission();
    if (permissionGranted) {
      const registration = await navigator.serviceWorker.ready;
      const currentToken = await getToken(messaging, {
        vapidKey: process.env.REACT_APP_VAPID_KEY,
        serviceWorkerRegistration: registration,
      });
      if (currentToken) {
        await sendTokenToServer(currentToken);
      } else {
        console.warn('No FCM token available. Request permission to generate one.');
      }
    } else {
      console.warn('Notification permission denied by the user.');
    }
  } catch (error) {
    console.error('Error while retrieving FCM token:', error);
  }
};

export {
  messaging,
  auth,
  signInAndRegisterWithGoogle,
  signInWithGoogle,
  logOut,
};