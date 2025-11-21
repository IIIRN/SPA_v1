import { initializeApp, getApps } from "firebase/app";
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

let app;
let db;

if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    
    // [FORCE CONFIG] บังคับใช้ทั้ง Memory Cache และ Long Polling เพื่อแก้ปัญหา LINE ค้าง
    db = initializeFirestore(app, {
        localCache: memoryLocalCache(),       // ไม่เก็บไฟล์ลงเครื่อง (แก้ Cache Lock)
        experimentalForceLongPolling: true,   // <--- [สำคัญที่สุด] บังคับใช้ HTTP แทน WebSocket (แก้ Connection Hang)
    });
    console.log("🔥 Firebase initialized: Memory Cache + Long Polling (Forced)");

} else {
    app = getApps()[0];
    // พยายาม init ซ้ำเพื่อให้แน่ใจว่าได้ instance ที่ถูกต้อง (ถ้าทำได้)
    try {
        db = initializeFirestore(app, {
            localCache: memoryLocalCache(),
            experimentalForceLongPolling: true,
        });
    } catch (e) {
        // ถ้า init ไปแล้ว จะเข้า case นี้ ให้ใช้ getFirestore ธรรมดา
        // แต่มักจะเป็น instance ที่ถูกต้องจาก server component หรือ init ครั้งแรก
        db = getFirestore(app);
    }
}

const auth = getAuth(app); 

export { db, auth };
