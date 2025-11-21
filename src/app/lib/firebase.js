import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  initializeFirestore, 
  memoryLocalCache 
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

// [ไม้ตาย] ตั้งชื่อ App ใหม่เพื่อหนี Instance เดิมที่ค้าง Cache
const APP_NAME = 'SPA_CLIENT_INSTANCE_V2'; 

let app;
let db;

try {
    // 1. ลองดึง App ชื่อนี้มาดูว่ามีหรือยัง
    app = getApp(APP_NAME);
    db = getFirestore(app);
} catch (e) {
    // 2. ถ้ายังไม่มี (หรือ Error) ให้สร้างใหม่ด้วย Config ที่ถูกต้อง 100%
    app = initializeApp(firebaseConfig, APP_NAME);
    
    db = initializeFirestore(app, {
        // ใช้ Memory Cache เท่านั้น (แก้ไฟล์ล็อก)
        localCache: memoryLocalCache(),
        // บังคับ HTTP Long Polling (แก้เน็ตค้าง/WebSocket โดนบล็อก)
        experimentalForceLongPolling: true,
    });
    console.log(`🔥 Firebase (${APP_NAME}) initialized: Memory Cache + Long Polling`);
}

const auth = getAuth(app); 

export { db, auth };
