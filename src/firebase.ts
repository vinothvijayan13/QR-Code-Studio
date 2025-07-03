import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getFirestore } from 'firebase/firestore'; // 1. Import getFirestore

const firebaseConfig = {
  apiKey: "AIzaSyCVr-dK5Z31xP6bq98GwL0xeMfDJ8f4xpE",
  authDomain: "qr-code-4663c.firebaseapp.com",
  projectId: "qr-code-4663c",
  storageBucket: "qr-code-4663c.firebasestorage.app",
  messagingSenderId: "718826370015",
  appId: "1:718826370015:web:9e75fbbc823443e3688a6a",
  measurementId: "G-E672YXRXV3"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Analytics
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

// 2. Initialize and export Firestore
export const db = getFirestore(app);