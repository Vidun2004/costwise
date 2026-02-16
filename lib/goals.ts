/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  increment,
} from "firebase/firestore";
import { db } from "./firebase";

export type Goal = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: Timestamp | null;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

export async function createGoal(params: {
  uid: string;
  name: string;
  targetAmount: number;
  deadline?: Date | null;
}) {
  const { uid, name, targetAmount, deadline } = params;
  const clean = name.trim();
  if (!clean) throw new Error("Goal name required");
  if (!Number.isFinite(targetAmount) || targetAmount <= 0)
    throw new Error("Target must be > 0");

  const colRef = collection(db, "users", uid, "goals");
  await addDoc(colRef, {
    name: clean,
    targetAmount,
    currentAmount: 0,
    deadline: deadline ? Timestamp.fromDate(deadline) : null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function listGoals(uid: string) {
  const colRef = collection(db, "users", uid, "goals");
  const q = query(colRef, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<Goal, "id">),
  })) as Goal[];
}

export async function deleteGoal(uid: string, goalId: string) {
  await deleteDoc(doc(db, "users", uid, "goals", goalId));
}

export async function updateGoal(
  uid: string,
  goalId: string,
  patch: Partial<{ name: string; targetAmount: number; deadline: Date | null }>,
) {
  const ref = doc(db, "users", uid, "goals", goalId);
  const data: any = { updatedAt: serverTimestamp() };
  if (typeof patch.name === "string") data.name = patch.name.trim();
  if (typeof patch.targetAmount === "number")
    data.targetAmount = patch.targetAmount;
  if (patch.deadline instanceof Date)
    data.deadline = Timestamp.fromDate(patch.deadline);
  if (patch.deadline === null) data.deadline = null;
  await updateDoc(ref, data);
}

export async function depositToGoal(
  uid: string,
  goalId: string,
  amount: number,
) {
  if (!Number.isFinite(amount) || amount <= 0)
    throw new Error("Deposit must be > 0");
  const ref = doc(db, "users", uid, "goals", goalId);
  await updateDoc(ref, {
    currentAmount: increment(amount),
    updatedAt: serverTimestamp(),
  });
}
