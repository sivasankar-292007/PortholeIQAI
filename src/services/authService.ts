import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../firebase';
import { firebaseDataService } from './firebaseService';
import { UserProfile, UserRole } from '../types';

export class FirebaseAuthService {
  /**
   * Listen to Firebase Auth state changes and sync with Firestore 'users' collection
   */
  onAuthStateListener(callback: (user: UserProfile | null) => void): (() => void) | null {
    if (!isFirebaseConfigured || !auth) {
      return null;
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (!fbUser) {
        callback(null);
        return;
      }

      // Check for user doc in Firestore to get authoritative role
      const profile = await firebaseDataService.getUserProfileDoc(fbUser.uid);
      if (profile) {
        callback(profile);
      } else {
        // Fallback profile if doc not yet initialized
        const newProfile: UserProfile = {
          id: fbUser.uid,
          email: fbUser.email || '',
          name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Citizen',
          role: 'citizen' // default to citizen; privileged roles must be granted by admin
        };
        await firebaseDataService.saveUserProfileDoc(newProfile);
        callback(newProfile);
      }
    });

    return unsubscribe;
  }

  /**
   * Sign in with Email and Password
   */
  async signIn(email: string, pass: string): Promise<UserProfile> {
    if (!isFirebaseConfigured || !auth) {
      throw new Error(
        'Firebase credentials are not configured. Configure your Firebase keys in .env to enable authentication.'
      );
    }

    const cleanEmail = (email || '').trim();
    if (!cleanEmail) {
      const err = new Error('Please enter a valid email address.');
      (err as any).code = 'auth/invalid-email';
      throw err;
    }

    if (!pass || pass.length < 6) {
      const err = new Error('Password should be at least 6 characters.');
      (err as any).code = 'auth/weak-password';
      throw err;
    }

    try {
      const credential = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      const fbUser = credential.user;

      // Fetch user profile from Firestore (authoritative role is stored here)
      let profile = await firebaseDataService.getUserProfileDoc(fbUser.uid);
      if (!profile) {
        profile = {
          id: fbUser.uid,
          email: fbUser.email || cleanEmail,
          name: fbUser.displayName || cleanEmail.split('@')[0],
          role: 'citizen'
        };
        await firebaseDataService.saveUserProfileDoc(profile);
      }

      return profile;
    } catch (err: any) {
      const code = err?.code || '';
      if (
        code === 'auth/invalid-credential' ||
        code === 'auth/wrong-password' ||
        code === 'auth/user-not-found'
      ) {
        const error = new Error('Invalid email or password. Please check your credentials.');
        (error as any).code = code;
        throw error;
      }
      if (code === 'auth/weak-password') {
        const error = new Error('Password should be at least 6 characters.');
        (error as any).code = code;
        throw error;
      }
      throw err;
    }
  }

  /**
   * Sign up a new user with Email, Password, and Name.
   * SECURITY RULE: All public sign-ups are strictly registered as 'citizen'.
   * Municipal Officer and Engineer roles cannot be self-assigned.
   */
  async signUp(
    email: string,
    pass: string,
    displayName: string,
    _requestedRole: UserRole = 'citizen',
    extra?: { ward?: string; department?: string; specialization?: string; phone?: string; staffCode?: string }
  ): Promise<UserProfile> {
    if (!isFirebaseConfigured || !auth) {
      throw new Error(
        'Firebase credentials are not configured. Configure your Firebase keys in .env to enable user registration.'
      );
    }

    const cleanEmail = (email || '').trim();
    if (!cleanEmail) {
      const err = new Error('Please enter a valid email address.');
      (err as any).code = 'auth/invalid-email';
      throw err;
    }

    if (!pass || pass.length < 6) {
      const error = new Error('Password should be at least 6 characters.');
      (error as any).code = 'auth/weak-password';
      throw error;
    }

    try {
      const credential = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      const fbUser = credential.user;

      // Update display name in Firebase Auth
      await updateProfile(fbUser, { displayName: displayName.trim() || cleanEmail.split('@')[0] });

      // Strict security: All public sign-ups are created as 'citizen'
      const newProfile: UserProfile = {
        id: fbUser.uid,
        email: fbUser.email || cleanEmail,
        name: displayName.trim() || cleanEmail.split('@')[0],
        role: 'citizen',
        ward: extra?.ward,
        department: extra?.department,
        phone: extra?.phone
      };

      // Save user profile in Firestore 'users' collection
      await firebaseDataService.saveUserProfileDoc(newProfile);

      return newProfile;
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/weak-password') {
        const error = new Error('Password should be at least 6 characters.');
        (error as any).code = code;
        throw error;
      }
      if (code === 'auth/email-already-in-use') {
        const error = new Error('An account with this email already exists. Please sign in instead.');
        (error as any).code = code;
        throw error;
      }
      throw err;
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    if (!isFirebaseConfigured || !auth) return;
    await signOut(auth);
  }
}

export const authService = new FirebaseAuthService();
