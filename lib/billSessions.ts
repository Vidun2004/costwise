/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  writeBatch,
  increment,
} from "firebase/firestore";
import { db } from "./firebase";
import { monthKeyFromDate } from "./date";

export type BillSession = {
  id: string;
  title: string;
  monthKey: string;
  currency: string;
  itemCount: number;
  createdAt?: Timestamp;
  closedAt?: Timestamp | null;
  convertedToTransactions?: boolean;
  convertedAt?: Timestamp | null;
  summary?: {
    total: number;
    count: number;
    biggest?: { merchant: string; amount: number } | null;
    byCategory: { categoryId: string; total: number }[];
  };
};

export type BillItem = {
  id: string;
  merchant: string;
  amount: number;
  categoryId: string;
  note?: string;
  date: Timestamp;
  createdAt?: Timestamp;
};

export async function createBillSession(params: {
  uid: string;
  title?: string;
  currency: string;
  date?: Date; // for monthKey (default today)
}) {
  const { uid, title, currency, date } = params;
  const d = date ?? new Date();
  const mk = monthKeyFromDate(d);

  const colRef = collection(db, "users", uid, "billSessions");
  const created = await addDoc(colRef, {
    title: title?.trim() || `Bills – ${mk}`,
    monthKey: mk,
    currency: currency || "LKR",
    itemCount: 0,
    createdAt: serverTimestamp(),
    closedAt: null,
    convertedToTransactions: false,
    convertedAt: null,
    summary: {
      total: 0,
      count: 0,
      biggest: null,
      byCategory: [],
    },
  });

  return created.id;
}

export async function listBillSessions(uid: string, limit = 50) {
  const colRef = collection(db, "users", uid, "billSessions");
  const q = query(colRef, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs
    .slice(0, limit)
    .map((d) => ({ id: d.id, ...(d.data() as any) })) as BillSession[];
}

export async function getBillSession(uid: string, sessionId: string) {
  const ref = doc(db, "users", uid, "billSessions", sessionId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Session not found");
  return { id: snap.id, ...(snap.data() as any) } as BillSession;
}

export async function addBillItem(params: {
  uid: string;
  sessionId: string;
  merchant: string;
  amount: number;
  categoryId: string;
  note?: string;
  date: Date;
}) {
  const { uid, sessionId, merchant, amount, categoryId, note, date } = params;

  const cleanMerchant = merchant.trim();
  if (!cleanMerchant) throw new Error("Merchant required");
  if (!Number.isFinite(amount) || amount <= 0)
    throw new Error("Amount must be > 0");
  if (!categoryId) throw new Error("Category required");

  const itemsCol = collection(
    db,
    "users",
    uid,
    "billSessions",
    sessionId,
    "items",
  );
  await addDoc(itemsCol, {
    merchant: cleanMerchant,
    amount,
    categoryId,
    note: note?.trim() ?? "",
    date: Timestamp.fromDate(date),
    createdAt: serverTimestamp(),
  });
  const sessionRef = doc(db, "users", uid, "billSessions", sessionId);
  await updateDoc(sessionRef, {
    itemCount: increment(1),
  });
}

export async function listBillItems(uid: string, sessionId: string) {
  const itemsCol = collection(
    db,
    "users",
    uid,
    "billSessions",
    sessionId,
    "items",
  );
  const q = query(itemsCol, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as any),
  })) as BillItem[];
}

export async function deleteBillItem(
  uid: string,
  sessionId: string,
  itemId: string,
) {
  await deleteDoc(
    doc(db, "users", uid, "billSessions", sessionId, "items", itemId),
  );
  await updateDoc(doc(db, "users", uid, "billSessions", sessionId), {
    itemCount: increment(-1),
  });
}

/**
 * Computes summary from items and saves it. Optionally "closes" the session.
 */
export async function saveSessionSummary(params: {
  uid: string;
  sessionId: string;
  close?: boolean;
}) {
  const { uid, sessionId, close } = params;

  const items = await listBillItems(uid, sessionId);

  let total = 0;
  const count = items.length;
  let biggest: { merchant: string; amount: number } | null = null;

  const byCat = new Map<string, number>();
  for (const it of items) {
    total += it.amount;

    if (!biggest || it.amount > biggest.amount) {
      biggest = { merchant: it.merchant, amount: it.amount };
    }

    byCat.set(it.categoryId, (byCat.get(it.categoryId) ?? 0) + it.amount);
  }

  const byCategory = Array.from(byCat.entries())
    .map(([categoryId, sum]) => ({ categoryId, total: sum }))
    .sort((a, b) => b.total - a.total);

  const ref = doc(db, "users", uid, "billSessions", sessionId);
  await updateDoc(ref, {
    itemCount: count,
    summary: { total, count, biggest, byCategory },
    ...(close ? { closedAt: serverTimestamp() } : {}),
  });
}

/**
 * ONE-TAP: converts ALL items -> transactions in a single batch.
 * Also marks session as converted.
 */
export async function convertSessionToTransactions(params: {
  uid: string;
  sessionId: string;
}) {
  const { uid, sessionId } = params;

  const session = await getBillSession(uid, sessionId);
  if (session.convertedToTransactions) return;

  const items = await listBillItems(uid, sessionId);

  const batch = writeBatch(db);

  // write transactions
  for (const it of items) {
    const date = it.date.toDate();
    const mk = monthKeyFromDate(date);

    const txRef = doc(collection(db, "users", uid, "transactions"));
    batch.set(txRef, {
      type: "expense",
      amount: it.amount,
      categoryId: it.categoryId,
      note: it.note ?? "",
      date: it.date,
      monthKey: mk,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      source: {
        kind: "billSession",
        sessionId,
        itemId: it.id,
      },
    });
  }

  // ensure summary saved + mark converted
  const sessionRef = doc(db, "users", uid, "billSessions", sessionId);
  batch.update(sessionRef, {
    convertedToTransactions: true,
    convertedAt: serverTimestamp(),
    closedAt: session.closedAt ?? serverTimestamp(),
  });

  await batch.commit();

  // then save summary snapshot (not in batch because it queries items; quick + safe)
  await saveSessionSummary({ uid, sessionId, close: true });
}
