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

    const credential = await signInWithEmailAndPassword(auth, email, pass);
    const fbUser = credential.user;

    // Fetch user profile from Firestore (authoritative role is stored here)
    let profile = await firebaseDataService.getUserProfileDoc(fbUser.uid);
    if (!profile) {
      profile = {
        id: fbUser.uid,
        email: fbUser.email || email,
        name: fbUser.displayName || email.split('@')[0],
        role: 'citizen'
      };
      await firebaseDataService.saveUserProfileDoc(profile);
    }

    return profile;
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

    const credential = await createUserWithEmailAndPassword(auth, email, pass);
    const fbUser = credential.user;

    // Update display name in Firebase Auth
    await updateProfile(fbUser, { displayName });

    // Strict security: All public sign-ups are created as 'citizen'
    const newProfile: UserProfile = {
      id: fbUser.uid,
      email: fbUser.email || email,
      name: displayName,
      role: 'citizen',
      ward: extra?.ward,
      department: extra?.department,
      phone: extra?.phone
    };

    // Save user profile in Firestore 'users' collection
    await firebaseDataService.saveUserProfileDoc(newProfile);

    return newProfile;
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
