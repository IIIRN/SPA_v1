// src/app/lib/firebase.js
import { initializeApp, getApps } from "firebase/app";
import { 
  getFirestore, 
  initializeFirestore, 
  memoryLocalCache // [1] เพิ่ม import นี้
} from "firebase/firestore";
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
    
    // [2] ปรับแต่ง settings ใหม่
    db = initializeFirestore(app, {
        experimentalForceLongPolling: true, // ยังคงไว้ เพราะจำเป็นสำหรับ LINE
        localCache: memoryLocalCache(),      // <--- [สำคัญ] บังคับใช้ Memory Cache เท่านั้น แก้ปัญหาไฟล์ล็อก
        // cacheSizeBytes: CACHE_SIZE_UNLIMITED // [ลบออก] ไม่ใช้แล้วเมื่อใช้ memoryLocalCache
    });
    console.log("🔥 Firebase initialized with Memory Cache & Long Polling");

} else {
    app = getApps()[0];
    // [3] ใช้ initializeFirestore เสมอเพื่อให้แน่ใจว่าได้ instance ที่ config ถูกต้อง
    // การเรียกซ้ำกับ app เดิมจะคืนค่า instance เดิมให้อัตโนมัติ
    db = initializeFirestore(app, {
        experimentalForceLongPolling: true,
        localCache: memoryLocalCache()
    });
}

const auth = getAuth(app); 

export { db, auth };
