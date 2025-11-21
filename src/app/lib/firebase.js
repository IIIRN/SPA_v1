// src/app/lib/firebase.js
import { initializeApp, getApps } from "firebase/app";
import { 
  getFirestore, 
  initializeFirestore, 
  memoryLocalCache // [1] สำคัญมาก: ต้อง import ตัวนี้
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
    
    // [2] กำหนดให้ใช้ memoryLocalCache() เท่านั้น
    db = initializeFirestore(app, {
        localCache: memoryLocalCache(), // <--- หัวใจสำคัญ: แก้ปัญหา LINE ค้าง 100%
        // experimentalForceLongPolling: true // (Optional) ถ้าใช้ memoryCache แล้ว อันนี้อาจไม่จำเป็น แต่ใส่ไว้ก็ไม่เสียหาย
    });
    console.log("🔥 Firebase initialized with Memory Cache");

} else {
    app = getApps()[0];
    // [3] เรียกซ้ำเพื่อให้แน่ใจว่าได้ instance ที่ถูกต้อง
    db = initializeFirestore(app, {
        localCache: memoryLocalCache()
    });
}

const auth = getAuth(app); 

export { db, auth };
