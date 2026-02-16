import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "./firebase";

export type Budget = {
  id: string;
  monthKey: string;
  categoryId: string;
  limit: number;
};

export function budgetId(monthKey: string, categoryId: string) {
  return `${monthKey}_${categoryId}`;
}

export async function upsertBudget(params: {
  uid: string;
  monthKey: string;
  categoryId: string;
  limit: number;
}) {
  const { uid, monthKey, categoryId, limit } = params;
  if (!uid) throw new Error("uid required");
  if (!monthKey) throw new Error("monthKey required");
  if (!categoryId) throw new Error("categoryId required");
  if (!Number.isFinite(limit) || limit < 0)
    throw new Error("limit must be >= 0");

  const id = budgetId(monthKey, categoryId);
  const ref = doc(db, "users", uid, "budgets", id);

  const snap = await getDoc(ref);
  const exists = snap.exists();

  await setDoc(
    ref,
    {
      monthKey,
      categoryId,
      limit,
      ...(exists ? {} : { createdAt: serverTimestamp() }),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function listBudgetsForMonth(uid: string, monthKey: string) {
  const colRef = collection(db, "users", uid, "budgets");
  const q = query(colRef, where("monthKey", "==", monthKey));
  const snap = await getDocs(q);

  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<Budget, "id">),
  })) as Budget[];
}
