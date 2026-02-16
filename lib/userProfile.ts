import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";

export type Category = { id: string; name: string };

export async function getUserProfile(uid: string) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Profile not found");
  return snap.data();
}

export async function addCustomCategory(uid: string, name: string) {
  const clean = name.trim();
  if (!clean) throw new Error("Category name required");

  const id =
    "c_" +
    clean
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") +
    "_" +
    Math.random().toString(36).slice(2, 7);

  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Profile not found");

  const data = snap.data();
  const categories: Category[] = Array.isArray(data.categories)
    ? data.categories
    : [];

  // prevent duplicates by name (case-insensitive)
  const exists = categories.some(
    (c) => c.name.toLowerCase() === clean.toLowerCase(),
  );
  if (exists) return;

  await updateDoc(ref, {
    categories: [...categories, { id, name: clean }],
  });
}
