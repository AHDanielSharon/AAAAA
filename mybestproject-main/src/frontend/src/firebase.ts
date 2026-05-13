import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import {
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  onAuthStateChanged, signOut, type User
} from "firebase/auth";
import { getStorage } from "firebase/storage";

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
export const storage = getStorage(app);

// Auth state promise
let _authResolve: (uid: string) => void;
export const authReady = new Promise<string>((resolve) => {
  _authResolve = resolve;
});

let _currentUser: User | null = null;

onAuthStateChanged(auth, (user) => {
  _currentUser = user;
  if (user) {
    _authResolve(user.uid);
  }
});

export function getCurrentUid(): string {
  return _currentUser?.uid || "anonymous";
}

export function isLoggedIn(): boolean {
  return _currentUser !== null;
}

export function getCurrentUser(): User | null {
  return _currentUser;
}

// Sign up with email + password
export async function signUpWithEmail(email: string, password: string): Promise<string> {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  _authResolve(cred.user.uid);
  return cred.user.uid;
}

// Login with email + password
export async function loginWithEmail(email: string, password: string): Promise<string> {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  _authResolve(cred.user.uid);
  return cred.user.uid;
}

// Logout
export async function logoutUser(): Promise<void> {
  await signOut(auth);
  _currentUser = null;
}
