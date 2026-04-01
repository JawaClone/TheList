/* ══════════════════════════════════════════
   THE LIST — Firebase Configuration (CDN Version)
   ══════════════════════════════════════════ */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, enableIndexedDbPersistence } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBpS8yOBvEhkQr9GWMU9wcQkZM5ipGaJlc",
  authDomain: "thelist-3299f.firebaseapp.com",
  projectId: "thelist-3299f",
  storageBucket: "thelist-3299f.firebasestorage.app",
  messagingSenderId: "165723542894",
  appId: "1:165723542894:web:6c97fcf83497954c41dd7f",
  measurementId: "G-WCBBNZJE5M"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export instances
export const auth = getAuth(app);
export const db = getFirestore(app);

// Activar memoria de base de datos OFFLINE en el navegador
enableIndexedDbPersistence(db).catch((err) => {
  console.warn("No se pudo activar la memoria offline. Error:", err);
});
