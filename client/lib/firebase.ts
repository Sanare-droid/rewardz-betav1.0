import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const bucketEnv = (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "").trim();
const projectIdEnv = (import.meta.env.VITE_FIREBASE_PROJECT_ID || "").trim();
// Some envs mistakenly use *.firebasestorage.app which triggers CORS; fix to *.appspot.com
const fixedBucket = bucketEnv.endsWith("firebasestorage.app")
  ? `${projectIdEnv}.appspot.com`
  : bucketEnv || (projectIdEnv ? `${projectIdEnv}.appspot.com` : "");

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: projectIdEnv,
  storageBucket: fixedBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

if (
  !firebaseConfig.apiKey ||
  !firebaseConfig.projectId ||
  !firebaseConfig.appId ||
  !firebaseConfig.authDomain
) {
  const missing = [
    !firebaseConfig.apiKey && "VITE_FIREBASE_API_KEY",
    !firebaseConfig.authDomain && "VITE_FIREBASE_AUTH_DOMAIN",
    !firebaseConfig.projectId && "VITE_FIREBASE_PROJECT_ID",
    !firebaseConfig.appId && "VITE_FIREBASE_APP_ID",
  ]
    .filter(Boolean)
    .join(", ");
  console.error(`Missing Firebase environment variables: ${missing}`);
}

let app: any;
try {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
} catch (e) {
  console.error("Failed to initialize Firebase", e);
}

// Export null-safe Firebase services so the rest of the app can handle
// initialization failures gracefully instead of throwing at module import time.
export const auth = app ? getAuth(app) : null;

let dbInstance: any = null;
if (app) {
  try {
    dbInstance = initializeFirestore(app, {
      experimentalForceLongPolling: true,
      experimentalAutoDetectLongPolling: true,
      useFetchStreams: false,
    } as any);
  } catch (e) {
    try {
      dbInstance = getFirestore(app);
    } catch (inner) {
      console.error("Failed to initialize Firestore", inner);
      dbInstance = null;
    }
  }
}
export const db = (dbInstance || (app ? getFirestore(app) : undefined)) as ReturnType<typeof getFirestore>;

export const storage = (app ? getStorage(app) : undefined) as ReturnType<typeof getStorage>;

export default app;
