import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

const DEFAULT_CATEGORIES = [
  { id: "food", name: "Food" },
  { id: "transport", name: "Transport" },
  { id: "bills", name: "Bills" },
  { id: "shopping", name: "Shopping" },
  { id: "entertainment", name: "Entertainment" },
  { id: "health", name: "Health" },
  { id: "education", name: "Education" },
  { id: "other", name: "Other" },
];

export async function signup(
  email: string,
  password: string,
  displayName?: string,
) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);

  if (displayName?.trim()) {
    await updateProfile(cred.user, { displayName: displayName.trim() });
  }

  // Create user profile doc if it doesn't exist
  const userRef = doc(db, "users", cred.user.uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    await setDoc(userRef, {
      uid: cred.user.uid,
      email: cred.user.email,
      displayName: displayName?.trim() ?? "",
      currency: "LKR",
      categories: DEFAULT_CATEGORIES, // fixed defaults (we'll add custom later)
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  return cred.user;
}

export async function login(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function logout() {
  await signOut(auth);
}

export async function resetPassword(email: string) {
  await sendPasswordResetEmail(auth, email);
}
