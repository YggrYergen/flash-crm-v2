import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyCxgZIx7eDzeSCgeiw1gP7qmpzl8KXvhZc",
    authDomain: "flash-crm-mvp.firebaseapp.com",
    projectId: "flash-crm-mvp",
    storageBucket: "flash-crm-mvp.firebasestorage.app",
    messagingSenderId: "459310227925",
    appId: "1:459310227925:web:fab88df7481585f9201d5c",
    measurementId: "G-TWMC70K2BS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);
