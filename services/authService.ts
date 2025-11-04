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

  // Validate session by attempting Firestore read with timeout
  private async validateSession(user: User): Promise<{ isValid: boolean; isAdmin: boolean }> {
    if (!db) {
      console.warn('Firestore not available, cannot validate session');
      return { isValid: false, isAdmin: false };
    }

    return new Promise((resolve) => {
      // Set timeout for validation - if it takes too long, assume invalid
      const timeout = setTimeout(() => {
        console.warn('Session validation timed out, clearing session');
        resolve({ isValid: false, isAdmin: false });
      }, 5000);

      (async () => {
        try {
          console.log('Validating cached session for user:', user.uid);
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);

          clearTimeout(timeout);

          if (userDoc.exists()) {
            const isAdmin = userDoc.data()?.userInfo?.isAdmin || false;
            console.log('Session validation successful, user is admin:', isAdmin);
            resolve({ isValid: true, isAdmin });
          } else {
            console.log('User document not found in Firestore');
            resolve({ isValid: true, isAdmin: false });
          }
        } catch (error: any) {
          clearTimeout(timeout);

          const errorCode = error?.code || '';
          const errorMsg = error?.message || '';

          console.error('Session validation error:', { errorCode, errorMsg });

          // Check for various permission/auth failure indicators
          const isPermissionError =
            errorCode === 'permission-denied' ||
            errorMsg.includes('permission') ||
            errorMsg.includes('Missing or insufficient permissions') ||
            errorMsg.includes('PERMISSION_DENIED') ||
            errorCode.includes('PERMISSION');

          const isAuthError =
            errorCode === 'unauthenticated' ||
            errorMsg.includes('unauthenticated') ||
            errorMsg.includes('401');

          if (isPermissionError || isAuthError) {
            console.warn('Session validation failed: authentication/permission error, clearing session');
            resolve({ isValid: false, isAdmin: false });
          } else {
            // For other errors (network, etc.), be lenient but log
            console.warn('Session validation failed with non-auth error:', errorMsg);
            resolve({ isValid: true, isAdmin: false });
          }
        }
      })();
    });
  }

  // Initialize auth state listener
  init() {
    if (!isFirebaseAvailable()) {
      console.warn('Firebase not available, skipping auth initialization');
      return;
    }

    // First time setup - validate cached session exists and is valid
    onAuthStateChanged(auth, async (user: User | null) => {
      console.log('Auth state changed, user:', user ? user.uid : 'null');

      if (user) {
        // Validate the cached session
        const { isValid, isAdmin } = await this.validateSession(user);

        if (isValid) {
          console.log('Setting currentUser with valid session');
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
          console.warn('Session validation failed, signing out invalid cached session');
          this.currentUser = null;

          // Clear the invalid cached session
          try {
            await signOut(auth);
            console.log('Invalid cached session cleared successfully');
          } catch (signOutError) {
            console.error('Error clearing invalid session:', signOutError);
            // Even if signOut fails, we've already cleared currentUser
          }
        }
      } else {
        console.log('No user in auth state');
        this.currentUser = null;
      }

      this.notifyListeners();
    });
  }
}

// Create and export singleton instance
const authService = new AuthService();
export default authService;
