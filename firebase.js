import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD2...", 
  authDomain: "vigilance-cb3c4.firebaseapp.com",
  projectId: "vigilance-cb3c4",
  storageBucket: "vigilance-cb3c4.firebasestorage.app",
  messagingSenderId: "637920727647",
  appId: "1:637920727647:web:cd3b3da7d0e733400c81ea",
  measurementId: "G-SJ6B5T1641"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Export 'app' so you can use it in other files
export default app;