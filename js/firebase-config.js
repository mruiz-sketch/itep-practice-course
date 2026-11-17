// ============================================================
//  FIREBASE CONFIG
//  Firebase project: itep-practice-upsrj (Firestore in Mexico).
//  This web config is public by design; security is enforced by
//  firestore.rules and Firebase Authentication.
//  If apiKey is set back to "PASTE_YOUR_API_KEY", the app runs in
//  DEMO MODE (accounts saved only in the browser).
// ============================================================
export const firebaseConfig = {
  apiKey: "AIzaSyDaWitEWUhtPOneg-cLreo4fywxv11PJNA",
  authDomain: "itep-practice-upsrj.firebaseapp.com",
  projectId: "itep-practice-upsrj",
  storageBucket: "itep-practice-upsrj.firebasestorage.app",
  messagingSenderId: "108735305019",
  appId: "1:108735305019:web:1315b768d49936042e131e",
};

// Only institutional accounts can register.
export const EMAIL_DOMAIN = "upsrj.edu.mx";
