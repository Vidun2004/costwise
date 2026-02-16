/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "./firebase";
import { monthKeyFromDate } from "./date";

export type TxType = "expense" | "income";

export type Transaction = {
  id: string;
  type: TxType;
  amount: number;
  categoryId: string;
  note?: string;
  date: Timestamp;
  monthKey: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

export async function createTransaction(params: {
  uid: string;
  type: TxType;
  amount: number;
  categoryId: string;
  note?: string;
  date: Date;
}) {
  const { uid, type, amount, categoryId, note, date } = params;

  if (!uid) throw new Error("uid required");
  if (!Number.isFinite(amount) || amount <= 0)
    throw new Error("amount must be > 0");
  if (!categoryId) throw new Error("category required");

  const txCol = collection(db, "users", uid, "transactions");

  await addDoc(txCol, {
    type,
    amount,
    categoryId,
    note: note?.trim() ?? "",
    date: Timestamp.fromDate(date),
    monthKey: monthKeyFromDate(date),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function listTransactionsForMonth(uid: string, monthKey: string) {
  const txCol = collection(db, "users", uid, "transactions");
  const q = query(
    txCol,
    where("monthKey", "==", monthKey),
    orderBy("date", "desc"),
  );
  const snap = await getDocs(q);

  return snap.docs.map(
    (d) =>
      ({
        id: d.id,
        ...(d.data() as Omit<Transaction, "id">),
      }) satisfies Transaction,
  );
}

export async function deleteTransaction(uid: string, txId: string) {
  await deleteDoc(doc(db, "users", uid, "transactions", txId));
}

export async function updateTransaction(
  uid: string,
  txId: string,
  patch: Partial<{
    type: TxType;
    amount: number;
    categoryId: string;
    note: string;
    date: Date;
  }>,
) {
  const ref = doc(db, "users", uid, "transactions", txId);

  const updateData: any = {
    updatedAt: serverTimestamp(),
  };

  if (patch.type) updateData.type = patch.type;
  if (typeof patch.amount === "number") updateData.amount = patch.amount;
  if (patch.categoryId) updateData.categoryId = patch.categoryId;
  if (typeof patch.note === "string") updateData.note = patch.note;
  if (patch.date instanceof Date) {
    updateData.date = Timestamp.fromDate(patch.date);
    updateData.monthKey = monthKeyFromDate(patch.date);
  }

  await updateDoc(ref, updateData);
}
