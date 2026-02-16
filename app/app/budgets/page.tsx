/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/app/providers";
import { getUserProfile, Category } from "@/lib/userProfile";
import { monthKeyFromDate } from "@/lib/date";
import { listBudgetsForMonth, upsertBudget, Budget } from "@/lib/budgets";
import {
  Calendar,
  Wallet,
  Save,
  AlertCircle,
  Layers,
  DollarSign,
} from "lucide-react";

// In-page loading component
function BudgetsLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
        <div className="h-4 w-64 bg-gray-100 rounded animate-pulse"></div>
      </div>

      {/* Month Selector Skeleton */}
      <div className="flex items-center gap-2">
        <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-10 w-48 bg-gray-200 rounded-lg animate-pulse"></div>
      </div>

      {/* Overall Budget Card Skeleton */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-5 w-40 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-24 bg-gray-100 rounded animate-pulse"></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="h-10 w-20 bg-gray-300 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Per-category Section Skeleton */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>

        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 border border-gray-100 rounded-lg"
            >
              <div className="space-y-2">
                <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-24 bg-gray-100 rounded animate-pulse"></div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="h-10 w-20 bg-gray-300 rounded-lg animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function BudgetsPage() {
  const { user } = useAuth();
  const [monthKey, setMonthKey] = useState(() => monthKeyFromDate(new Date()));
  const [currency, setCurrency] = useState("LKR");
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const budgetMap = useMemo(() => {
    const m = new Map<string, number>();
    budgets.forEach((b) => m.set(b.categoryId, b.limit));
    return m;
  }, [budgets]);

  async function refresh(uid: string, mk: string) {
    setLoading(true);
    const [profile, monthBudgets] = await Promise.all([
      getUserProfile(uid),
      listBudgetsForMonth(uid, mk),
    ]);
    setCurrency(profile.currency ?? "LKR");
    setCategories(Array.isArray(profile.categories) ? profile.categories : []);
    setBudgets(monthBudgets);
    setLoading(false);
  }

  useEffect(() => {
    if (!user) return;
    refresh(user.uid, monthKey);
  }, [user, monthKey]);

  if (!user) return null;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-light tracking-tight text-gray-900">
          Budgets
        </h1>
        <p className="text-sm text-gray-500 font-light">
          Set monthly limits for overall spending and per category
        </p>
      </div>

      {/* Month Selector */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Calendar className="w-4 h-4" />
          <span>Month:</span>
        </div>
        <div className="relative">
          <input
            className="pl-4 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all duration-200 text-sm text-gray-900"
            type="month"
            value={monthKey}
            onChange={(e) => setMonthKey(e.target.value)}
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 text-red-800 rounded-lg p-4 flex items-start gap-3 text-sm border border-red-100">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <BudgetsLoading />
      ) : (
        <>
          {/* Overall Budget Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Wallet className="w-5 h-5 text-gray-700" />
              <h2 className="text-sm font-medium text-gray-700 uppercase tracking-wider">
                Overall Budget
              </h2>
            </div>

            <BudgetRow
              label="Overall (All categories combined)"
              currency={currency}
              initialValue={budgetMap.get("all") ?? 0}
              busy={busyId === "all"}
              onSave={async (limit) => {
                setError(null);
                setBusyId("all");
                try {
                  await upsertBudget({
                    uid: user.uid,
                    monthKey,
                    categoryId: "all",
                    limit,
                  });
                  await refresh(user.uid, monthKey);
                } catch (e: any) {
                  setError(e?.message ?? "Failed to save budget");
                } finally {
                  setBusyId(null);
                }
              }}
            />
          </div>

          {/* Per-category Budgets */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Layers className="w-5 h-5 text-gray-700" />
              <h2 className="text-sm font-medium text-gray-700 uppercase tracking-wider">
                Per-category Budgets
              </h2>
            </div>

            {categories.length === 0 ? (
              <div className="text-center py-8">
                <Layers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm font-light">
                  No categories found. Create categories in your profile first.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {categories.map((c) => (
                  <BudgetRow
                    key={c.id}
                    label={c.name}
                    currency={currency}
                    initialValue={budgetMap.get(c.id) ?? 0}
                    busy={busyId === c.id}
                    onSave={async (limit) => {
                      setError(null);
                      setBusyId(c.id);
                      try {
                        await upsertBudget({
                          uid: user.uid,
                          monthKey,
                          categoryId: c.id,
                          limit,
                        });
                        await refresh(user.uid, monthKey);
                      } catch (e: any) {
                        setError(e?.message ?? "Failed to save budget");
                      } finally {
                        setBusyId(null);
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Info Note */}
          <div className="text-xs text-gray-400 text-center">
            <p>
              Budgets help you track spending and stay on top of your finances
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function BudgetRow(props: {
  label: string;
  currency: string;
  initialValue: number;
  busy: boolean;
  onSave: (limit: number) => Promise<void>;
}) {
  const { label, currency, initialValue, busy, onSave } = props;
  const [value, setValue] = useState(String(initialValue));

  useEffect(() => {
    setValue(String(initialValue));
  }, [initialValue]);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-gray-100 rounded-lg hover:border-gray-200 transition-all duration-200">
      <div className="space-y-1">
        <div className="font-medium text-gray-900">{label}</div>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <DollarSign className="w-3 h-3" />
          <span>Monthly limit in {currency}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
            {currency}
          </span>
          <input
            className="pl-12 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all duration-200 text-right text-gray-900 w-40"
            inputMode="decimal"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="0.00"
            disabled={busy}
          />
        </div>

        <button
          disabled={busy}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg shadow-gray-900/25 min-w-[80px] justify-center"
          onClick={() => onSave(Number(value))}
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
              Save
            </>
          )}
        </button>
      </div>
    </div>
  );
}
