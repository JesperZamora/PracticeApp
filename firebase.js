// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDKCo-oZaRPEOkom0Gv3hVYf15vYefwjAs",
  authDomain: "myprojectjzw.firebaseapp.com",
  projectId: "myprojectjzw",
  storageBucket: "myprojectjzw.appspot.com",
  messagingSenderId: "540956753161",
  appId: "1:540956753161:web:2c0b213345624a05e2e7d8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getFirestore(app);
export { app, database }