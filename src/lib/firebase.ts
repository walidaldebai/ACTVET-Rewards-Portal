import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Note: You should fill these with your actual Firebase configuration values.
// The appId provided: 1:869336678838:web:7e96a0c5fde5c24a444117
// Firebase Configuration for ACTVET Rewards Portal
// Helper to safely get env variables or fallbacks
const getEnv = (key: string, fallback: string) => {
    const val = import.meta.env[key];
    return (val && val !== "your_api_key_here" && val.trim() !== "") ? val : fallback;
};

// Firebase Configuration for ACTVET Rewards Portal
const firebaseConfig = {
    apiKey: getEnv('VITE_FIREBASE_API_KEY', "AIzaSyC4waaHNqlpSvqVAH3KM8ybbP-nKxMuxjo"),
    authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN', "actvet-rewards.firebaseapp.com"),
    projectId: getEnv('VITE_FIREBASE_PROJECT_ID', "actvet-rewards"),
    storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET', "actvet-rewards.appspot.com"),
    messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', "869336678838"),
    appId: getEnv('VITE_FIREBASE_APP_ID', "1:869336678838:web:7e96a0c5fde5c24a444117")
};

console.log(`[Firebase] Initialized for Project: ${firebaseConfig.projectId}`);
if (firebaseConfig.apiKey === "AIzaSyC4waaHNqlpSvqVAH3KM8ybbP-nKxMuxjo") {
    console.warn("[Firebase] Using internal fallback API Key. If this is not intended, verify your .env file.");
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export { firebaseConfig }; // Export for secondary app usage
export default app;
