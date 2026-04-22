const firebaseConfig = {
  apiKey: "your-api-key-here",
  authDomain: "urbanthreadstore.firebaseapp.com",
  projectId: "urbanthreadstore",
  storageBucket: "urbanthreadstore.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id",
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
