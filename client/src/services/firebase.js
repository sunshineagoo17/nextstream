import { initializeApp, getApps } from 'firebase/app';
import { getMessaging } from 'firebase/messaging';
import { getAuth, GoogleAuthProvider, GithubAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

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

// Google and GitHub providers
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

// Register with Google
const signInAndRegisterWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    
    if (!result || !result.user) {
      throw new Error("Google sign-in did not return a user.");
    }

    console.log("Google sign-in successful:", {
      email: result.user.email,
      displayName: result.user.displayName,
      photoURL: result.user.photoURL,
    });

    return result; // Return result for further handling
  } catch (error) {
    console.error("Google sign-in error:", error);
    throw error; // Re-throw error for higher-level handling
  }
};

// Login with Google (separate for login)
const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    
    if (!result || !result.user) {
      throw new Error("Google sign-in did not return a user.");
    }

    console.log("Google login successful:", {
      email: result.user.email,
      displayName: result.user.displayName,
      photoURL: result.user.photoURL,
    });

    return result; // Return result for further handling
  } catch (error) {
    console.error("Google login error:", error);
    throw error; // Re-throw error for higher-level handling
  }
};

// Sign in with GitHub
const signInWithGithub = async () => {
  try {
    const result = await signInWithPopup(auth, githubProvider);
    const { email, displayName, photoURL } = result.user;

    console.log('GitHub sign-in successful:', { email, displayName, photoURL });

    return result;
  } catch (error) {
    console.error('GitHub sign-in error:', error.code, error.message);

    switch (error.code) {
      case 'auth/popup-closed-by-user':
        console.error('Popup closed by user before completing the sign-in.');
        break;
      case 'auth/cancelled-popup-request':
        console.error('Popup already open or request canceled.');
        break;
      default:
        console.error('GitHub sign-in failed:', error.message);
    }
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

export { messaging, auth, signInAndRegisterWithGoogle, signInWithGoogle, signInWithGithub, logOut };