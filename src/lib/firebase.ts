import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Note: You should fill these with your actual Firebase configuration values.
// The appId provided: 1:869336678838:web:7e96a0c5fde5c24a444117
// Firebase Configuration for ACTVET Rewards Portal
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyD-YOUR-REAL-KEY-HERE",
    authDomain: "actvet-rewards.firebaseapp.com",
    projectId: "actvet-rewards",
    storageBucket: "actvet-rewards.appspot.com",
    messagingSenderId: "869336678838",
    appId: "1:869336678838:web:7e96a0c5fde5c24a444117"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export { firebaseConfig }; // Export for secondary app usage
export default app;
