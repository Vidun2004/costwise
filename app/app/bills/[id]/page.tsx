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
import {
  ArrowLeft,
  Receipt,
  ShoppingBag,
  DollarSign,
  Tag,
  Calendar,
  FileText,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock,
  Save,
  TrendingUp,
  Layers,
} from "lucide-react";

// In-page loading component
function BillSessionLoading() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header Skeleton */}
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <div className="h-8 w-64 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="h-4 w-48 bg-gray-100 rounded animate-pulse"></div>
        </div>
        <div className="h-10 w-20 bg-gray-200 rounded-lg animate-pulse"></div>
      </div>

      {/* Summary Card Skeleton */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 p-6 shadow-sm space-y-4">
        <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
        <div className="space-y-2">
          <div className="h-4 w-48 bg-gray-100 rounded animate-pulse"></div>
          <div className="h-4 w-64 bg-gray-100 rounded animate-pulse"></div>
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-40 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="h-10 w-48 bg-gray-300 rounded-lg animate-pulse"></div>
        </div>
      </div>

      {/* Add Bill Form Skeleton */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 p-6 shadow-sm space-y-4">
        <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
        <div className="space-y-3">
          <div className="h-10 w-full bg-gray-100 rounded-lg animate-pulse"></div>
          <div className="h-10 w-full bg-gray-100 rounded-lg animate-pulse"></div>
          <div className="h-10 w-full bg-gray-100 rounded-lg animate-pulse"></div>
          <div className="h-10 w-full bg-gray-100 rounded-lg animate-pulse"></div>
          <div className="h-10 w-full bg-gray-100 rounded-lg animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}

export default function BillSessionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [session, setSession] = useState<BillSession | null>(null);
  const [items, setItems] = useState<BillItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currency, setCurrency] = useState("LKR");
  const [loading, setLoading] = useState(true);

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
    setLoading(true);
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
    setLoading(false);
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
  if (!session && loading) return <BillSessionLoading />;
  if (!session) return <div className="p-6">Session not found</div>;

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

  const isClosed = session.closedAt;
  const isConverted = session.convertedToTransactions;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 flex-shrink-0"
            title="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-light tracking-tight text-gray-900 truncate">
                {session.title}
              </h1>
              <div className="flex items-center gap-1 flex-shrink-0">
                {isClosed ? (
                  <span className="flex items-center gap-1 text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                    <CheckCircle className="w-3 h-3" />
                    Closed
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-full">
                    <Clock className="w-3 h-3" />
                    Open
                  </span>
                )}

                {isConverted && (
                  <span className="flex items-center gap-1 text-xs px-2 py-1 bg-green-50 text-green-600 rounded-full">
                    <CheckCircle className="w-3 h-3" />
                    Converted
                  </span>
                )}
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Month: {session.monthKey} • {items.length} items
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <BillSessionLoading />
      ) : (
        <>
          {/* Summary Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Receipt className="w-5 h-5 text-gray-700" />
              <h2 className="text-sm font-medium text-gray-700 uppercase tracking-wider">
                Session Summary
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="space-y-1">
                <div className="text-sm text-gray-500">Total</div>
                <div className="text-2xl font-light text-gray-900">
                  {currency} {live.total.toFixed(2)}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-gray-500">Items</div>
                <div className="text-2xl font-light text-gray-900">
                  {live.count}
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-4">
              <p>{insightLine}</p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 mt-4">
              {!isClosed && (
                <button
                  disabled={busy || items.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-all duration-200 disabled:opacity-50"
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
                  {busy ? (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Close Session
                    </>
                  )}
                </button>
              )}

              {!isConverted && isClosed && (
                <button
                  disabled={busy}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-gray-900/25"
                  onClick={async () => {
                    setBusy(true);
                    setError(null);
                    try {
                      await convertSessionToTransactions({
                        uid: user.uid,
                        sessionId: id,
                      });
                      await refresh(user.uid);
                    } catch (e: any) {
                      setError(e?.message ?? "Failed to convert");
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  <TrendingUp className="w-4 h-4" />
                  Convert to Transactions
                </button>
              )}

              {isConverted && (
                <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Converted to transactions
                  </span>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-4 bg-red-50 text-red-800 rounded-lg p-4 flex items-start gap-3 text-sm border border-red-100">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Add Bill Item - Only show if session is open */}
          {!isClosed && !isConverted && (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Plus className="w-5 h-5 text-gray-700" />
                <h2 className="text-sm font-medium text-gray-700 uppercase tracking-wider">
                  Add a Bill
                </h2>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
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
                className="space-y-4"
              >
                <div className="grid gap-4">
                  {/* Merchant */}
                  <div className="relative">
                    <ShoppingBag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all duration-200 text-gray-900 placeholder:text-gray-400"
                      placeholder="Merchant (e.g. Keells)"
                      value={merchant}
                      onChange={(e) => setMerchant(e.target.value)}
                      required
                      disabled={busy}
                    />
                  </div>

                  {/* Amount */}
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all duration-200 text-gray-900 placeholder:text-gray-400"
                      inputMode="decimal"
                      placeholder={`Amount (${currency})`}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                      disabled={busy}
                    />
                  </div>

                  {/* Category */}
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all duration-200 text-gray-900 appearance-none"
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      required
                      disabled={busy}
                    >
                      <option value="">Select a category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Custom Category */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Plus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all duration-200 text-sm text-gray-900 placeholder:text-gray-400"
                        placeholder="Add custom category"
                        value={newCat}
                        onChange={(e) => setNewCat(e.target.value)}
                        disabled={busy}
                      />
                    </div>
                    <button
                      type="button"
                      className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 shadow-lg shadow-gray-900/25"
                      onClick={async () => {
                        if (!newCat.trim()) return;
                        setError(null);
                        try {
                          await addCustomCategory(user.uid, newCat);
                          setNewCat("");
                          await refresh(user.uid);
                        } catch (e: any) {
                          setError(e?.message ?? "Failed to add category");
                        }
                      }}
                      disabled={busy || !newCat.trim()}
                    >
                      Add
                    </button>
                  </div>

                  {/* Date */}
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all duration-200 text-gray-900"
                      type="date"
                      value={dateStr}
                      onChange={(e) => setDateStr(e.target.value)}
                      required
                      disabled={busy}
                    />
                  </div>

                  {/* Note */}
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all duration-200 text-gray-900 placeholder:text-gray-400"
                      placeholder="Note (optional)"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      disabled={busy}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={busy || !merchant || !amount || !categoryId}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-gray-900/25"
                  >
                    {busy ? (
                      <>
                        <svg
                          className="animate-spin h-5 w-5"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Add Bill
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Items List */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-gray-700" />
              <h2 className="text-sm font-medium text-gray-700 uppercase tracking-wider">
                Bills in this session ({items.length})
              </h2>
            </div>

            {items.length === 0 ? (
              <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 p-8 shadow-sm">
                <div className="text-center">
                  <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm font-light">
                    No bills added yet. Add your first bill above.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((it) => (
                  <div
                    key={it.id}
                    className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg font-medium text-gray-900">
                            {currency} {it.amount.toFixed(2)}
                          </span>
                          <span className="text-sm text-gray-600">
                            • {it.merchant}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs">
                            {catName(it.categoryId)}
                          </span>
                          <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                          <span>{it.date.toDate().toLocaleDateString()}</span>
                          {it.note && (
                            <>
                              <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                              <span className="truncate">{it.note}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <button
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                        onClick={async () => {
                          if (
                            confirm(
                              "Are you sure you want to delete this bill?",
                            )
                          ) {
                            await deleteBillItem(user.uid, id, it.id);
                            await refresh(user.uid);
                          }
                        }}
                        title="Delete bill"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
