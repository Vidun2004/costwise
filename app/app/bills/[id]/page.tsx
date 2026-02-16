/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/app/providers";
import { getUserProfile, Category, addCustomCategory } from "@/lib/userProfile";
import {
  addBillItem,
  BillItem,
  BillSession,
  convertSessionToTransactions,
  deleteBillItem,
  getBillSession,
  listBillItems,
  saveSessionSummary,
} from "@/lib/billSessions";

export default function BillSessionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [session, setSession] = useState<BillSession | null>(null);
  const [items, setItems] = useState<BillItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currency, setCurrency] = useState("LKR");

  // item form
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [note, setNote] = useState("");
  const [dateStr, setDateStr] = useState(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });

  // custom category
  const [newCat, setNewCat] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh(uid: string) {
    const [profile, s, its] = await Promise.all([
      getUserProfile(uid),
      getBillSession(uid, id),
      listBillItems(uid, id),
    ]);
    setCurrency(profile.currency ?? "LKR");
    const cats: Category[] = Array.isArray(profile.categories)
      ? profile.categories
      : [];
    setCategories(cats);
    if (!categoryId && cats[0]) setCategoryId(cats[0].id);
    setSession(s);
    setItems(its);
  }

  useEffect(() => {
    if (!user) return;
    refresh(user.uid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, id]);

  const live = useMemo(() => {
    let total = 0;
    let biggest: { merchant: string; amount: number } | null = null;
    const byCat = new Map<string, number>();

    for (const it of items) {
      total += it.amount;
      if (!biggest || it.amount > biggest.amount)
        biggest = { merchant: it.merchant, amount: it.amount };
      byCat.set(it.categoryId, (byCat.get(it.categoryId) ?? 0) + it.amount);
    }

    const byCategory = Array.from(byCat.entries())
      .map(([categoryId, total]) => ({ categoryId, total }))
      .sort((a, b) => b.total - a.total);

    return { total, count: items.length, biggest, byCategory };
  }, [items]);

  const catName = useMemo(() => {
    const m = new Map<string, string>();
    categories.forEach((c) => m.set(c.id, c.name));
    return (id: string) => m.get(id) ?? id;
  }, [categories]);

  if (!user) return null;
  if (!session) return <div className="p-6">Loading...</div>;

  const insightLine = (() => {
    const top = live.byCategory[0];
    const topText = top
      ? `${catName(top.categoryId)} (${currency} ${top.total.toFixed(2)})`
      : "—";
    const bigText = live.biggest
      ? `${live.biggest.merchant} (${currency} ${live.biggest.amount.toFixed(2)})`
      : "—";
    return `Top category: ${topText}. Biggest bill: ${bigText}.`;
  })();

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold truncate">{session.title}</h1>
          <div className="text-sm opacity-70">
            {session.closedAt ? "Closed" : "Open"} •{" "}
            {session.convertedToTransactions
              ? "Converted to Transactions"
              : "Not converted"}
          </div>
        </div>
        <button
          className="px-3 py-2 rounded border"
          onClick={() => router.back()}
        >
          Back
        </button>
      </div>

      {/* Summary card */}
      <div className="border rounded-xl p-4 space-y-2">
        <div className="font-medium">Session summary</div>
        <div className="text-sm opacity-80">
          Total:{" "}
          <span className="font-medium">
            {currency} {live.total.toFixed(2)}
          </span>{" "}
          • Bills: <span className="font-medium">{live.count}</span>
        </div>
        <div className="text-sm opacity-70">{insightLine}</div>

        <div className="flex flex-wrap gap-2 mt-2">
          <button
            disabled={busy}
            className="px-3 py-2 rounded border disabled:opacity-60"
            onClick={async () => {
              setBusy(true);
              setError(null);
              try {
                await saveSessionSummary({
                  uid: user.uid,
                  sessionId: id,
                  close: true,
                });
                await refresh(user.uid);
              } catch (e: any) {
                setError(e?.message ?? "Failed to close session");
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "..." : "Close session (save summary)"}
          </button>

          <button
            disabled={busy || session.convertedToTransactions}
            className="px-3 py-2 rounded bg-black text-white disabled:opacity-60"
            onClick={async () => {
              setBusy(true);
              setError(null);
              try {
                await convertSessionToTransactions({
                  uid: user.uid,
                  sessionId: id,
                });
                await refresh(user.uid);
                // budgets/dashboard will update automatically because transactions now exist
              } catch (e: any) {
                setError(e?.message ?? "Failed to convert");
              } finally {
                setBusy(false);
              }
            }}
          >
            {session.convertedToTransactions
              ? "Converted"
              : "One tap: Convert → Transactions"}
          </button>
        </div>

        {error && <div className="text-sm text-red-600 mt-2">{error}</div>}
      </div>

      {/* Add bill item */}
      <div className="border rounded-xl p-4 space-y-3">
        <div className="font-medium">Add a bill</div>

        <div className="grid gap-2">
          <input
            className="border rounded px-3 py-2"
            placeholder="Merchant (e.g. Keells)"
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
          />

          <input
            className="border rounded px-3 py-2"
            inputMode="decimal"
            placeholder={`Amount (${currency})`}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <select
            className="border rounded px-3 py-2"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <input
              className="border rounded px-3 py-2 flex-1"
              placeholder="Add custom category (optional)"
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
            />
            <button
              className="px-3 py-2 rounded border"
              onClick={async () => {
                setError(null);
                try {
                  await addCustomCategory(user.uid, newCat);
                  setNewCat("");
                  await refresh(user.uid);
                } catch (e: any) {
                  setError(e?.message ?? "Failed to add category");
                }
              }}
            >
              Add
            </button>
          </div>

          <input
            className="border rounded px-3 py-2"
            type="date"
            value={dateStr}
            onChange={(e) => setDateStr(e.target.value)}
          />

          <input
            className="border rounded px-3 py-2"
            placeholder="Note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          <button
            disabled={busy}
            className="px-3 py-2 rounded bg-black text-white disabled:opacity-60"
            onClick={async () => {
              setBusy(true);
              setError(null);
              try {
                const d = new Date(dateStr + "T12:00:00");
                await addBillItem({
                  uid: user.uid,
                  sessionId: id,
                  merchant,
                  amount: Number(amount),
                  categoryId,
                  note,
                  date: d,
                });
                setMerchant("");
                setAmount("");
                setNote("");
                await refresh(user.uid);
              } catch (e: any) {
                setError(e?.message ?? "Failed to add bill");
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Adding..." : "Add bill"}
          </button>
        </div>
      </div>

      {/* Items list */}
      <div className="space-y-2">
        <div className="font-medium">Bills in this session</div>
        {items.length === 0 ? (
          <div className="opacity-70">No bills added yet.</div>
        ) : (
          items.map((it) => (
            <div
              key={it.id}
              className="border rounded-xl p-4 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="font-medium">
                  {currency} {it.amount.toFixed(2)} • {it.merchant}
                </div>
                <div className="text-sm opacity-70 truncate">
                  {catName(it.categoryId)} •{" "}
                  {it.date.toDate().toLocaleDateString()}
                  {it.note ? ` • ${it.note}` : ""}
                </div>
              </div>

              <button
                className="px-3 py-2 rounded border"
                onClick={async () => {
                  await deleteBillItem(user.uid, id, it.id);
                  await refresh(user.uid);
                }}
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
