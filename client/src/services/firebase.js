import { initializeApp, getApps } from 'firebase/app';
import { getMessaging } from 'firebase/messaging';
import { getAuth, GoogleAuthProvider, GithubAuthProvider, signInWithPopup, signOut, fetchSignInMethodsForEmail, linkWithCredential, EmailAuthProvider } from 'firebase/auth';

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

// Register with GitHub
const signInAndRegisterWithGithub = async () => {
  try {
    const result = await signInWithPopup(auth, githubProvider);

    if (!result || !result.user) {
      throw new Error("GitHub sign-in did not return a user.");
    }

    console.log('GitHub sign-in successful:', {
      email: result.user.email,
      displayName: result.user.displayName,
      photoURL: result.user.photoURL,
    });

    return result;
  } catch (error) {
    console.error('GitHub sign-in error:', error);

    if (error.code === 'auth/account-exists-with-different-credential') {
      const existingEmail = error.customData.email;
      console.log('Account exists with different credentials for:', existingEmail);

      // Check which sign-in methods are associated with the email
      const signInMethods = await fetchSignInMethodsForEmail(auth, existingEmail);
      console.log('Sign-in methods:', signInMethods);

      if (signInMethods.includes('password')) {
        const password = prompt('An account already exists with this email. Please enter your password to link GitHub to your existing account.');
        const emailCredential = EmailAuthProvider.credential(existingEmail, password);

        await linkWithCredential(auth.currentUser, emailCredential);
        console.log('GitHub account linked with email/password account.');
      } else if (signInMethods.length) {
        throw new Error(`This email is already registered with ${signInMethods[0]}. Please sign in using that method and link the GitHub account afterward.`);
      } else {
        throw new Error('This email is already registered with a different provider. Please sign in using that provider.');
      }
    }

    throw error;
  }
};

// Sign in with GitHub
const signInWithGithub = async () => {
  try {
    const result = await signInWithPopup(auth, githubProvider);

    console.log('GitHub sign-in successful:', {
      email: result.user.email,
      displayName: result.user.displayName,
      photoURL: result.user.photoURL,
    });

    return result;
  } catch (error) {
    console.error('GitHub sign-in error:', error.code, error.message);

    if (error.code === 'auth/account-exists-with-different-credential') {
      const existingEmail = error.customData.email;
      console.log('Account exists with different credentials for:', existingEmail);

      // Check which sign-in methods are associated with the email
      const signInMethods = await fetchSignInMethodsForEmail(auth, existingEmail);
      console.log('Sign-in methods:', signInMethods);

      if (signInMethods.includes('password')) {
        const password = prompt('An account already exists with this email. Please enter your password to link GitHub to your existing account.');
        const emailCredential = EmailAuthProvider.credential(existingEmail, password);

        await linkWithCredential(auth.currentUser, emailCredential);
        console.log('GitHub account linked with email/password account.');
      } else if (signInMethods.length) {
        throw new Error(`This email is already registered with ${signInMethods[0]}. Please sign in using that method.`);
      }
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

export { messaging, auth, signInAndRegisterWithGoogle, signInWithGoogle, signInAndRegisterWithGithub, signInWithGithub, logOut };