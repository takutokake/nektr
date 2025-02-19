// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator, ref } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBCLptRXXdj-RaQukE5XD91U8p_w6oG-q4",
  authDomain: "match-test-50973.firebaseapp.com",
  projectId: "match-test-50973",
  storageBucket: "match-test-50973.firebasestorage.app",
  messagingSenderId: "233696162514",
  appId: "1:233696162514:web:e8edebb5068857f12e730b"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);
auth.onAuthStateChanged((user) => {
  console.log('Auth state changed:', user ? 'User logged in' : 'No user');
}, (error) => {
  console.error('Auth state change error:', error);
});

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Storage with CORS settings
export const storage = getStorage(app);

// Configure storage with CORS settings
const storageInstance = getStorage();
storageInstance.maxOperationRetryTime = 10000; // 10 seconds max retry
storageInstance.maxUploadRetryTime = 10000;

// Google Auth Provider with custom parameters
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Add required scopes
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.email');
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.profile');

console.log('Firebase initialized successfully');

export default app;