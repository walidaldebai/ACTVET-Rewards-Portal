import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Note: You should fill these with your actual Firebase configuration values.
// The appId provided: 1:869336678838:web:7e96a0c5fde5c24a444117
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "actvet-rewards.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "actvet-rewards",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "actvet-rewards.appspot.com",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "869336678838",
    appId: "1:869336678838:web:7e96a0c5fde5c24a444117"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
