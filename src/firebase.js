import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebaseコンソールからコピーした設定をここに貼り付けます
const firebaseConfig = {
  apiKey: "AIzaSyAjbNIzlWQp9bP_DV_-KxsVDal2uboLJcY",
  authDomain: "apricot-226b5.firebaseapp.com",
  projectId: "apricot-226b5",
  storageBucket: "apricot-226b5.firebasestorage.app",
  messagingSenderId: "312435725363",
  appId: "1:312435725363:web:24953d6141bbffbfa4ff46",
  measurementId: "G-8ZJ4YB39Q6"
};

// Firebaseアプリの初期化
const app = initializeApp(firebaseConfig);

// 使用したいサービスをエクスポート
export const auth = getAuth(app);
export const db = getFirestore(app); // Cloud Firestore用

export default app;
