import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where,
  Timestamp 
} from 'firebase/firestore';
import configFile from '../../../firebase-applet-config.json';

const cfg = configFile || ({} as any);

const firebaseConfig = {
  apiKey: cfg.apiKey || '',
  authDomain: cfg.authDomain || '',
  projectId: cfg.projectId || '',
  storageBucket: cfg.storageBucket || '',
  messagingSenderId: cfg.messagingSenderId || '',
  appId: cfg.appId || '',
  databaseURL: cfg.projectId ? `https://${cfg.projectId}-default-rtdb.firebaseio.com` : undefined
};

// Initialize Firebase safely with full fail-safe fallbacks
let app: any = null;
try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
} catch (err) {
  console.warn('[Firebase] Error initializing app:', err);
}

let authInstance: any = null;
try {
  if (app) {
    authInstance = getAuth(app);
  }
} catch (err) {
  console.warn('[Firebase] Error initializing auth:', err);
}

let dbInstance: any = null;
try {
  if (app) {
    if (cfg.firestoreDatabaseId && cfg.firestoreDatabaseId !== '(default)') {
      try {
        dbInstance = getFirestore(app, cfg.firestoreDatabaseId);
      } catch (dbErr) {
        console.warn('[Firebase] Custom database ID failed, falling back to default:', dbErr);
        dbInstance = getFirestore(app);
      }
    } else {
      dbInstance = getFirestore(app);
    }
  }
} catch (err) {
  console.warn('[Firebase] Error initializing Firestore:', err);
}

export const auth = authInstance;
export const db = dbInstance;

export { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  GoogleAuthProvider, 
  signInWithPopup,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  Timestamp
};

export type { User };
