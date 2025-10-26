import {
  signOut,
  onAuthStateChanged,
  User,
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

  // Sign out
  async signOut() {
    if (!isFirebaseAvailable()) {
      this.currentUser = null;
      this.notifyListeners();
      return;
    }

    try {
      await signOut(auth);
      this.currentUser = null;
      this.notifyListeners();
    } catch (error) {
      console.error('Error signing out:', error);
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

    onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        // Fetch admin status from Firestore
        let isAdmin = false;
        if (db) {
          try {
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
              isAdmin = userDoc.data()?.userInfo?.isAdmin || false;
            }
          } catch (error) {
            console.warn('Could not fetch admin status:', error);
          }
        }

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
      this.notifyListeners();
    });
  }
}

// Create and export singleton instance
const authService = new AuthService();
export default authService;
