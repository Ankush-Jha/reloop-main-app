import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, initializeFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Singleton pattern for Firebase App
const isFirstInit = !getApps().length;
const app = isFirstInit ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);

// `ignoreUndefinedProperties` stops optional fields (e.g. hostel/room on sign-up)
// from making every write throw "Unsupported field value: undefined".
export const db = isFirstInit
    ? initializeFirestore(app, { ignoreUndefinedProperties: true })
    : getFirestore(app);

// Optional: point the client at the local Firestore emulator for testing.
if (isFirstInit && process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST) {
    const [host, port] = process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST.split(':');
    connectFirestoreEmulator(db, host, Number(port));
}

if (isFirstInit && process.env.NEXT_PUBLIC_AUTH_EMULATOR_URL) {
    connectAuthEmulator(auth, process.env.NEXT_PUBLIC_AUTH_EMULATOR_URL, { disableWarnings: true });
}

export const storage = getStorage(app);
export default app;
