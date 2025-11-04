import {
  signOut,
  onAuthStateChanged,
  User,
  signInWithCredential,
  GoogleAuthProvider,
} from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

export interface UserData {
  uid: string;
  name: string | null;
  email: string | null;
  photoURL: string | null;
  isAdmin: boolean;
  createdAt: string;
  lastSignIn: string;
}

// Check if Firebase is available
const isFirebaseAvailable = () => {
  return auth;
};

class AuthService {
  private currentUser: UserData | null = null;
  private listeners: Array<(user: UserData | null) => void> = [];

  constructor() {
    // Initialize
  }

  // Fetch admin status from Firestore
  private async fetchAdminStatus(uid: string) {
    if (!db) return;

    try {
      const userDocRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const isAdmin = userDoc.data()?.userInfo?.isAdmin || false;
        if (this.currentUser) {
          this.currentUser.isAdmin = isAdmin;
          this.notifyListeners();
        }
      }
    } catch (error) {
      console.warn('Could not fetch admin status:', error);
    }
  }

  // Sign in with Google ID token (for React Native)
  async signInWithGoogle(idToken: string) {
    if (!isFirebaseAvailable()) {
      throw new Error('Firebase is not configured. Please set up your Firebase project.');
    }

    try {
      console.log('signInWithGoogle called with token');
      // Create credential from Google ID token
      const credential = GoogleAuthProvider.credential(idToken);

      // Sign in with Firebase using the credential
      const result = await signInWithCredential(auth, credential);
      const user = result.user;

      // Create user data object
      const userData: UserData = {
        uid: user.uid,
        name: user.displayName || '',
        email: user.email || '',
        photoURL: user.photoURL || '',
        isAdmin: false, // Will be updated from Firestore
        createdAt: user.metadata.creationTime || '',
        lastSignIn: user.metadata.lastSignInTime || '',
      };

      this.currentUser = userData;
      this.notifyListeners();

      // Fetch admin status from Firestore
      await this.fetchAdminStatus(user.uid);

      return userData;
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  }

  // Sign in with Google using Firebase popup (for web)
  async signInWithGooglePopup() {
    if (!isFirebaseAvailable()) {
      throw new Error('Firebase is not configured. Please set up your Firebase project.');
    }

    try {
      const { signInWithPopup } = require('firebase/auth');
      console.log('signInWithGooglePopup called');

      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Create user data object
      const userData: UserData = {
        uid: user.uid,
        name: user.displayName || '',
        email: user.email || '',
        photoURL: user.photoURL || '',
        isAdmin: false,
        createdAt: user.metadata.creationTime || '',
        lastSignIn: user.metadata.lastSignInTime || '',
      };

      this.currentUser = userData;
      this.notifyListeners();

      // Fetch admin status from Firestore
      await this.fetchAdminStatus(user.uid);

      return userData;
    } catch (error: any) {
      console.error('Error signing in with Google popup:', error);
      throw error;
    }
  }

  // Sign out
  async signOut() {
    if (!isFirebaseAvailable()) {
      console.log('Firebase not available, clearing local user state');
      this.currentUser = null;
      this.notifyListeners();
      return;
    }

    try {
      console.log('Starting sign out...');
      await signOut(auth);
      console.log('Firebase sign out successful');
      this.currentUser = null;
      this.notifyListeners();
      console.log('Listeners notified of sign out');
    } catch (error) {
      console.error('Error signing out:', error);
      // Still clear the local user state even if Firebase call fails
      this.currentUser = null;
      this.notifyListeners();
      throw error;
    }
  }

  // Get current user
  getCurrentUser(): UserData | null {
    return this.currentUser;
  }

  // Listen to auth state changes
  onAuthStateChanged(callback: (user: UserData | null) => void) {
    this.listeners.push(callback);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter((listener) => listener !== callback);
    };
  }

  // Notify all listeners of auth state changes
  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.currentUser));
  }

  // Initialize auth state listener
  init() {
    if (!isFirebaseAvailable()) {
      console.warn('Firebase not available, skipping auth initialization');
      return;
    }

    // First time setup - validate cached session exists and is valid
    onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        // Validate auth is working by checking Firestore access
        let isAdmin = false;
        let isValidAuth = true;

        if (db) {
          try {
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
              isAdmin = userDoc.data()?.userInfo?.isAdmin || false;
            }
          } catch (error: any) {
            // If we get permission errors, the cached auth is invalid
            const errorCode = error?.code || '';
            const errorMsg = error?.message || '';
            const isPermissionError =
              errorCode === 'permission-denied' ||
              errorMsg.includes('permission') ||
              errorMsg.includes('Missing or insufficient permissions');

            if (isPermissionError) {
              console.warn('Cached auth is invalid (permission error), clearing session:', errorMsg);
              isValidAuth = false;
              // Sign out the invalid cached session
              try {
                await signOut(auth);
                console.log('Invalid cached session cleared');
              } catch (signOutError) {
                console.warn('Error signing out invalid session:', signOutError);
              }
            } else {
              console.warn('Could not fetch admin status:', errorMsg || error);
            }
          }
        }

        if (isValidAuth) {
          this.currentUser = {
            uid: user.uid,
            name: user.displayName || '',
            email: user.email || '',
            photoURL: user.photoURL || '',
            isAdmin: isAdmin,
            createdAt: user.metadata.creationTime || '',
            lastSignIn: user.metadata.lastSignInTime || '',
          };
        } else {
          this.currentUser = null;
        }
      } else {
        this.currentUser = null;
      }
      this.notifyListeners();
    });
  }
}

// Create and export singleton instance
const authService = new AuthService();
export default authService;
