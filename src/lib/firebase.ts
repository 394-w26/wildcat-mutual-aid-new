import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCcdk1WPShP1ozJVvvgeQowBapMlqhiVVQ",
  authDomain: "wildcat-mutual-aid.firebaseapp.com",
  projectId: "wildcat-mutual-aid",
  storageBucket: "wildcat-mutual-aid.firebasestorage.app",
  messagingSenderId: "611318699515",
  appId: "1:611318699515:web:aafaa8e6c20fc64be5675e",
  measurementId: "G-RP43JLFBEY"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const db = getFirestore(app);

