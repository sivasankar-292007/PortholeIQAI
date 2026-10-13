import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

/**
 * Firebase Client Configuration
 * Uses environment variable names defined in .env.example
 */
const metaEnv = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {};
const nodeEnv = (typeof process !== 'undefined' && process.env) || {};

export const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || nodeEnv.VITE_FIREBASE_API_KEY || '',
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || nodeEnv.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || nodeEnv.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || nodeEnv.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || nodeEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: metaEnv.VITE_FIREBASE_APP_ID || nodeEnv.VITE_FIREBASE_APP_ID || ''
};

/**
 * Validates that all essential Firebase web app keys are provided.
 */
export const isFirebaseConfigured: boolean = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.apiKey.trim() !== '' &&
  firebaseConfig.projectId.trim() !== '' &&
  !firebaseConfig.apiKey.includes('YOUR_') &&
  !firebaseConfig.apiKey.includes('MY_')
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
// Firebase Storage and Analytics are intentionally NOT enabled yet per project requirements.
const storage: null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    console.info('[PotholeIQ] Firebase initialized and connected for project:', firebaseConfig.projectId);
  } catch (err) {
    console.warn('[PotholeIQ] Firebase initialization failed. Falling back to demo mode:', err);
  }
} else {
  console.info('[PotholeIQ] Running in local offline demonstration mode. To connect your live Firebase web app, configure .env with credentials from Firebase Console.');
}

export { app, auth, db, storage };
