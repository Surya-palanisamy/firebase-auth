import { initializeApp, type FirebaseApp } from "firebase/app";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";
import {
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAzrUJw-OUnbFmz5d1pdUtWDSaIqAND1MI",
  authDomain: "flood-sense-sm.firebaseapp.com",
  databaseURL: "https://flood-sense-sm-default-rtdb.firebaseio.com",
  projectId: "flood-sense-sm",
  storageBucket: "flood-sense-sm.firebasestorage.app",
  messagingSenderId: "632693125006",
  appId: "1:632693125006:web:19e04222fe3a230e103edf",
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

const initializeFirebase = () => {
  if (!app) {
    app = initializeApp(firebaseConfig);

    // Auth
    auth = getAuth(app);

    // 🆕 Firestore with modern offline persistence
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(), // works across multiple tabs
      }),
    });

    // Connect to emulators in dev mode
    // if (import.meta.env.DEV) {
    //   try {
    //     connectAuthEmulator(auth, "http://localhost:9099", {
    //       disableWarnings: true,
    //     });
    //   } catch {}

    //   try {
    //     connectFirestoreEmulator(db, "localhost", 8080);
    //   } catch {}
    // }
  }
};

export const getFirebaseAuth = (): Auth => {
  initializeFirebase();
  return auth;
};

export const getFirebaseDb = (): Firestore => {
  initializeFirebase();
  return db;
};
