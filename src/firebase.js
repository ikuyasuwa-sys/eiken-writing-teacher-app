import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD9a9-ZHQexstJcNkVHORq3swqLf1HR3QQ",
  authDomain: "eiken-writing-app.firebaseapp.com",
  projectId: "eiken-writing-app",
  storageBucket: "eiken-writing-app.firebasestorage.app",
  messagingSenderId: "312002399629",
  appId: "1:312002399629:web:d736939a422854494a01c4"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

