/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/providers";
import { createTransaction, TxType } from "@/lib/transactions";
import { addCustomCategory, getUserProfile, Category } from "@/lib/userProfile";
import {
  ArrowLeft,
  Tag,
  Calendar,
  FileText,
  Plus,
  Save,
  TrendingUp,
  TrendingDown,
  AlertCircle,
} from "lucide-react";

// In-page loading component
function NewTransactionLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse"></div>
        <div className="h-4 w-32 bg-gray-100 rounded animate-pulse"></div>
      </div>

      {/* Form Skeleton */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 p-6 shadow-sm space-y-6">
        {/* Type Field */}
        <div className="space-y-2">
          <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 w-full bg-gray-100 rounded-lg animate-pulse"></div>
        </div>

        {/* Amount Field */}
        <div className="space-y-2">
          <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 w-full bg-gray-100 rounded-lg animate-pulse"></div>
        </div>

        {/* Category Field */}
        <div className="space-y-2">
          <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 w-full bg-gray-100 rounded-lg animate-pulse"></div>
          <div className="flex gap-2 mt-2">
            <div className="h-10 flex-1 bg-gray-100 rounded-lg animate-pulse"></div>
            <div className="h-10 w-16 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
        </div>

        {/* Date Field */}
        <div className="space-y-2">
          <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 w-full bg-gray-100 rounded-lg animate-pulse"></div>
        </div>

        {/* Note Field */}
        <div className="space-y-2">
          <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 w-full bg-gray-100 rounded-lg animate-pulse"></div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <div className="h-12 flex-1 bg-gray-900/50 rounded-lg animate-pulse"></div>
          <div className="h-12 w-24 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}

export default function NewTransactionPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [type, setType] = useState<TxType>("expense");
  const [amount, setAmount] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [note, setNote] = useState("");
  const [dateStr, setDateStr] = useState(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [currency, setCurrency] = useState("LKR");
  const [newCatName, setNewCatName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(uid: string) {
    setLoading(true);
    const profile = await getUserProfile(uid);
    setCurrency(profile.currency ?? "LKR");
    const cats: Category[] = Array.isArray(profile.categories)
      ? profile.categories
      : [];
    setCategories(cats);
    if (!categoryId && cats[0]) setCategoryId(cats[0].id);
    setLoading(false);
  }

  useEffect(() => {
    if (!user) return;
    loadProfile(user.uid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const parsedAmount = useMemo(() => Number(amount), [amount]);

  if (!user) return null;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200"
          title="Go back"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-light tracking-tight text-gray-900">
            Add transaction
          </h1>
          <p className="text-sm text-gray-500 font-light">
            Record a new income or expense • {currency}
          </p>
        </div>
      </div>

      {loading ? (
        <NewTransactionLoading />
      ) : (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 p-6 shadow-sm">
          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 text-red-800 rounded-lg p-4 flex items-start gap-3 text-sm border border-red-100">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError(null);
              try {
                const d = new Date(dateStr + "T12:00:00"); // avoid timezone edge cases
                await createTransaction({
                  uid: user.uid,
                  type,
                  amount: parsedAmount,
                  categoryId,
                  note,
                  date: d,
                });
                router.replace("/app/transactions");
              } catch (e: any) {
                setError(e?.message ?? "Failed to create transaction");
              } finally {
                setBusy(false);
              }
            }}
            className="space-y-6"
          >
            {/* Type Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 block">
                Transaction type
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setType("expense")}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all duration-200 ${
                    type === "expense"
                      ? "bg-red-50 border-red-200 text-red-700"
                      : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <TrendingDown className="w-4 h-4" />
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => setType("income")}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all duration-200 ${
                    type === "income"
                      ? "bg-green-50 border-green-200 text-green-700"
                      : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  Income
                </button>
              </div>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 block">
                Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  {currency}
                </span>
                <input
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all duration-200 text-gray-900 placeholder:text-gray-400"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  disabled={busy}
                />
              </div>
            </div>

            {/* Category Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 block">
                Category
              </label>
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

              {/* Add Custom Category */}
              <div className="flex gap-2 mt-3">
                <div className="relative flex-1">
                  <Plus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all duration-200 text-sm text-gray-900 placeholder:text-gray-400"
                    placeholder="Add custom category"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    disabled={busy}
                  />
                </div>
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 shadow-lg shadow-gray-900/25"
                  onClick={async () => {
                    if (!newCatName.trim()) return;
                    setError(null);
                    try {
                      await addCustomCategory(user.uid, newCatName);
                      setNewCatName("");
                      await loadProfile(user.uid);
                    } catch (e: any) {
                      setError(e?.message ?? "Failed to add category");
                    }
                  }}
                  disabled={busy || !newCatName.trim()}
                >
                  Add
                </button>
              </div>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 block">
                Date
              </label>
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
            </div>

            {/* Note */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 block">
                Note{" "}
                <span className="text-gray-400 font-light">(optional)</span>
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all duration-200 text-gray-900 placeholder:text-gray-400"
                  placeholder="Add a note..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  disabled={busy}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={busy || !amount || !categoryId}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg shadow-gray-900/25"
              >
                {busy ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
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
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Transaction
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => router.back()}
                disabled={busy}
                className="px-6 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-all duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
