// src/app/lib/firebase.js
import { initializeApp, getApps } from "firebase/app";
import { 
  getFirestore, 
  initializeFirestore, 
  CACHE_SIZE_UNLIMITED 
} from "firebase/firestore"; // [1] เพิ่ม import initializeFirestore
import { getAuth } from "firebase/auth"; 

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app;
let db;

if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    
    // [2] เปลี่ยนจาก getFirestore เป็น initializeFirestore พร้อม options
    db = initializeFirestore(app, {
        experimentalForceLongPolling: true, // <--- หัวใจสำคัญ: แก้ปัญหา LINE ค้าง
        cacheSizeBytes: CACHE_SIZE_UNLIMITED
    });
    console.log("🔥 Firebase initialized with Long Polling");

} else {
    app = getApps()[0];
    db = getFirestore(app);
}

const auth = getAuth(app); 

export { db, auth };
