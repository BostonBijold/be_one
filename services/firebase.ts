import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

// Dynamically import React Native specific modules only on mobile
let getReactNativePersistence: any = null;
let ReactNativeAsyncStorage: any = null;

if (Platform.OS !== 'web') {
  try {
    // @ts-ignore - These imports are only available in React Native
    getReactNativePersistence = require('firebase/auth').getReactNativePersistence;
    ReactNativeAsyncStorage = require('@react-native-async-storage/async-storage').default;
  } catch (error) {
    console.warn('Could not load React Native specific Firebase modules:', error);
  }
}

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'demo-project.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'demo-project.appspot.com',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:123456789:web:abcdef',
};

// Check if Firebase is properly configured
const isFirebaseConfigured = () => {
  return (
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY &&
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID &&
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY !== 'your_api_key_here'
  );
};

// Initialize Firebase only if properly configured
let app, auth, db, googleProvider;

if (isFirebaseConfigured()) {
  try {
    app = initializeApp(firebaseConfig);

    // Initialize auth with appropriate persistence based on platform
    if (Platform.OS !== 'web' && getReactNativePersistence && ReactNativeAsyncStorage) {
      // React Native: use AsyncStorage persistence
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(ReactNativeAsyncStorage)
      });
      console.log('Firebase initialized successfully with AsyncStorage persistence (React Native)');
    } else {
      // Web: use default persistence (localStorage)
      auth = getAuth(app);
      console.log('Firebase initialized successfully with default web persistence');
    }

    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.addScope('profile');
    googleProvider.addScope('email');
  } catch (error) {
    console.error('Firebase initialization failed:', error);
  }
} else {
  console.warn('Firebase not configured. Please set up your Firebase project and environment variables.');
}

// Export Firebase services (will be undefined if not configured)
export { auth, db, googleProvider };
export default app;
