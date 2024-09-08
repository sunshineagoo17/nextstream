import { initializeApp, getApps } from 'firebase/app';
import { getMessaging } from 'firebase/messaging';
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
  prompt: 'select_account' 
});

// Register with Google
const signInAndRegisterWithGoogle = async () => {
  try {
    await logOut(); 

    const result = await signInWithPopup(auth, googleProvider);
    
    if (!result || !result.user) {
      throw new Error("Google sign-in did not return a user.");
    }

    console.log("Google sign-in successful:", {
      email: result.user.email,
      displayName: result.user.displayName,
      photoURL: result.user.photoURL,
    });

    // Send registration request to your server
    const response = await api.post('/api/auth/oauth-register', {
      email: result.user.email,
      displayName: result.user.displayName,
      provider: 'google',
    });

    if (response.data.success) {
      console.log('User registered successfully with Google:', response.data);
    } else {
      throw new Error(response.data.message || 'OAuth registration failed.');
    }

    return result;
  } catch (error) {
    console.error("Google sign-in error:", error);
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

    console.log("Google login successful:", {
      email: result.user.email,
      displayName: result.user.displayName,
      photoURL: result.user.photoURL,
    });

    // Send login request to your server to check if the user is already registered
    const response = await api.post('/api/auth/oauth-login', {
      email: result.user.email,
      provider: 'google',
    });

    if (response.data.success) {
      console.log('User logged in successfully with Google:', response.data);
    } else {
      throw new Error(response.data.message || 'OAuth login failed.');
    }

    return result;
  } catch (error) {
    console.error("Google login error:", error);
    throw error;
  }
};

// Sign out function
const logOut = async () => {
  try {
    await signOut(auth);
    console.log('Sign-out successful.');
  } catch (error) {
    console.error('Sign-out error:', error);
  }
};

export { messaging, auth, signInAndRegisterWithGoogle, signInWithGoogle, logOut };