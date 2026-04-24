// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBUq0h-6hVfJ-dBMflbyQ20XyFNdL7BWjI",
  authDomain: "urbanthreadsstore-3dde1.firebaseapp.com",
  projectId: "urbanthreadsstore-3dde1",
  storageBucket: "urbanthreadsstore-3dde1.firebasestorage.app",
  messagingSenderId: "28776324764",
  appId: "1:28776324764:web:b1dd597132efbe86639759",
  measurementId: "G-RR6PPVLMB8",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Enable offline persistence for Firestore
db.enablePersistence().catch((err) => {
  if (err.code == "failed-precondition") {
    console.log(
      "Multiple tabs open, persistence can only be enabled in one tab at a time.",
    );
  } else if (err.code == "unimplemented") {
    console.log(
      "The current browser does not support all of the features required to enable persistence.",
    );
  }
});

console.log("Firebase initialized successfully");

// Global flag to track Firebase initialization
window.firebaseReady = true;

// Initialize all managers when Firebase is ready
function initializeAllManagers() {
  if (window.firebaseReady && typeof window.initializeAuthManager === 'function') {
    window.initializeAuthManager();
  }
  if (window.firebaseReady && typeof window.initializeCartManager === 'function') {
    window.initializeCartManager();
  }
}

// Wait for DOM to be ready, then initialize
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(initializeAllManagers, 100);
});
