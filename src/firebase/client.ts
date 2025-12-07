import { initializeApp, type FirebaseApp } from "firebase/app"
import { getAuth, connectAuthEmulator, type Auth } from "firebase/auth"
import { getFirestore, connectFirestoreEmulator, enableIndexedDbPersistence, type Firestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyAzrUJw-OUnbFmz5d1pdUtWDSaIqAND1MI",
  authDomain: "flood-sense-sm.firebaseapp.com",
  databaseURL: "https://flood-sense-sm-default-rtdb.firebaseio.com",
  projectId: "flood-sense-sm",
  storageBucket: "flood-sense-sm.firebasestorage.app",
  messagingSenderId: "632693125006",
  appId: "1:632693125006:web:19e04222fe3a230e103edf",
};

let app: FirebaseApp
let auth: Auth
let db: Firestore

const initializeFirebase = () => {
  if (!app) {
    app = initializeApp(firebaseConfig)
    auth = getAuth(app)
    db = getFirestore(app)

    // Enable persistence for offline support
    enableIndexedDbPersistence(db).catch((err: any) => {
      if (err.code === "failed-precondition") {
        console.warn("Multiple tabs open, persistence can only be enabled in one tab at a time.")
      } else if (err.code === "unimplemented") {
        console.warn("The current browser does not support offline persistence")
      }
    })

    // Connect to emulator if in development
    if (import.meta.env.DEV) {
      try {
        connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true })
      } catch (e) {
        // Already connected
      }
      try {
        connectFirestoreEmulator(db, "localhost", 8080)
      } catch (e) {
        // Already connected
      }
    }
  }
}

export const getFirebaseAuth = (): Auth => {
  initializeFirebase()
  return auth
}

export const getFirebaseDb = (): Firestore => {
  initializeFirebase()
  return db
}
