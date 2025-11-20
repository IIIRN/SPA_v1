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

// ประกาศตัวแปรไว้นอกเงื่อนไข
let app;
let db;

// ตรวจสอบว่ามีการ Initialize App ไปหรือยัง
if (getApps().length === 0) {
  // กรณีเริ่มทำงานครั้งแรก (Cold Start)
  app = initializeApp(firebaseConfig);
  
  // *** จุดสำคัญ: บังคับใช้ Long Polling เพื่อแก้ปัญหาใน LINE ***
  db = initializeFirestore(app, {
    experimentalForceLongPolling: true, // ต้องมีบรรทัดนี้
    cacheSizeBytes: CACHE_SIZE_UNLIMITED
  });
  console.log("🔥 Firebase initialized with Long Polling"); // เพิ่ม Log เพื่อเช็ค

} else {
  // กรณีแอปถูกโหลดไว้แล้ว (Hot Reload / Fast Refresh)
  app = getApps()[0];
  // พยายามใช้ db เดิม หรือถ้าไม่มีให้ get ใหม่ (แต่ถ้า hot reload ค่านี้อาจจะเป็นค่าเก่าที่ไม่มี polling)
  db = getFirestore(app);
}

const auth = getAuth(app); 

export { db, auth };
