import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD6Aw860-N0fZFpAzG5H6bbQ9q9b8OFVBg",
  authDomain: "project-5e4456df-0998-4bd7-805.firebaseapp.com",
  projectId: "project-5e4456df-0998-4bd7-805",
  storageBucket: "project-5e4456df-0998-4bd7-805.firebasestorage.app",
  messagingSenderId: "590671476645",
  appId: "1:590671476645:web:51a222f6191c34f2199a4c",
  measurementId: "G-W7LH2G0X9B"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

let _authResolve: (uid: string) => void;
export const authReady = new Promise<string>((resolve) => {
  _authResolve = resolve;
});

onAuthStateChanged(auth, async (user) => {
  if (user) {
    _authResolve(user.uid);
  } else {
    const cred = await signInAnonymously(auth);
    _authResolve(cred.user.uid);
  }
});

export function getCurrentUid(): string {
  return auth.currentUser?.uid || "anonymous";
}
