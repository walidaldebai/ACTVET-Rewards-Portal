import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const getEnv = (key: string, fallback: string) => {
    const val = import.meta.env[key];
    return (val && val !== "your_api_key_here" && val.trim() !== "") ? val : fallback;
};

const firebaseConfig = {
    apiKey: getEnv('VITE_FIREBASE_API_KEY', "AIzaSyC4waaHNqlpSvqVAH3KM8ybbP-nKxMuxjo"),
    authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN', "actvet-rewards-portal.firebaseapp.com"),
    databaseURL: getEnv('VITE_FIREBASE_DATABASE_URL', "https://actvet-rewards-portal-default-rtdb.asia-southeast1.firebasedatabase.app"),
    projectId: getEnv('VITE_FIREBASE_PROJECT_ID', "actvet-rewards-portal"),
    storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET', "actvet-rewards-portal.firebasestorage.app"),
    messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', "869336678838"),
    appId: getEnv('VITE_FIREBASE_APP_ID', "1:869336678838:web:7e96a0c5fde5c24a444117")
};

import { getStorage } from 'firebase/storage';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export const storage = getStorage(app);
export { firebaseConfig };
export default app;
