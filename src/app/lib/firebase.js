// src/app/lib/firebase.js

import { initializeApp, getApps } from "firebase/app";
import { getFirestore, initializeFirestore, CACHE_SIZE_UNLIMITED } from "firebase/firestore";
import { getAuth } from "firebase/auth"; 

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// ตัวแปรสำหรับเก็บ instance
let app;
let db;

// ตรวจสอบว่า Initialize ไปหรือยัง เพื่อป้องกัน Error ใน Next.js
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  
  // --- จุดสำคัญ: บังคับใช้ Long Polling เพื่อแก้ปัญหาใน LINE Webview ---
  db = initializeFirestore(app, {
    experimentalForceLongPolling: true, // แก้ปัญหา Connection ค้าง/หมุนติ้ว
    cacheSizeBytes: CACHE_SIZE_UNLIMITED // (Optional) ช่วยเรื่อง Cache
  });
  // ---------------------------------------------------------------

} else {
  app = getApps()[0];
  db = getFirestore(app);
}

const auth = getAuth(app); 

export { db, auth };
