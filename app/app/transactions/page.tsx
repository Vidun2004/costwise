/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/app/providers";
import {
  listTransactionsForMonth,
  deleteTransaction,
  Transaction,
} from "@/lib/transactions";
import { monthKeyFromDate } from "@/lib/date";
import { getUserProfile, Category } from "@/lib/userProfile";
import {
  Calendar,
  Plus,
  TrendingUp,
  TrendingDown,
  Wallet,
  Trash2,
  Receipt,
  Filter,
} from "lucide-react";

// In-page loading component
function TransactionsLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="h-4 w-24 bg-gray-100 rounded animate-pulse"></div>
        </div>
        <div className="h-10 w-24 bg-gray-200 rounded-lg animate-pulse"></div>
      </div>

      {/* Month Selector Skeleton */}
      <div className="flex items-center gap-2">
        <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-10 w-48 bg-gray-200 rounded-lg animate-pulse"></div>
      </div>

      {/* Summary Card Skeleton */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 p-6 space-y-4">
        <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
        <div className="flex gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-6 w-24 bg-gray-300 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Transactions List Skeleton */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 p-4"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-48 bg-gray-100 rounded animate-pulse"></div>
              </div>
              <div className="h-8 w-16 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TransactionsPage() {
  const { user } = useAuth();
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthKey, setMonthKey] = useState(() => monthKeyFromDate(new Date()));
  const [categories, setCategories] = useState<Category[]>([]);
  const [currency, setCurrency] = useState("LKR");

  const categoryMap = useMemo(() => {
    const m = new Map<string, string>();
    categories.forEach((c) => m.set(c.id, c.name));
    return m;
  }, [categories]);

  async function refresh(uid: string, mk: string) {
    setLoading(true);
    const [profile, list] = await Promise.all([
      getUserProfile(uid),
      listTransactionsForMonth(uid, mk),
    ]);
    setCurrency(profile.currency ?? "LKR");
    setCategories(Array.isArray(profile.categories) ? profile.categories : []);
    setTxs(list);
    setLoading(false);
  }

  useEffect(() => {
    if (!user) return;
    refresh(user.uid, monthKey);
  }, [user, monthKey]);

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const t of txs) {
      if (t.type === "income") income += t.amount;
      else expense += t.amount;
    }
    return { income, expense, net: income - expense };
  }, [txs]);

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-light tracking-tight text-gray-900">
            Transactions
          </h1>
          <p className="text-sm text-gray-500 font-light">
            Manage your income and expenses
          </p>
        </div>

        <Link
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-gray-900/25"
          href="/app/transactions/new"
        >
          <Plus className="w-4 h-4" />
          Add Transaction
        </Link>
      </div>

      {/* Month Selector */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Filter className="w-4 h-4" />
          <span>Filter by month:</span>
        </div>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all duration-200 text-sm text-gray-900"
            type="month"
            value={monthKey}
            onChange={(e) => setMonthKey(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <TransactionsLoading />
      ) : (
        <>
          {/* Summary Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Receipt className="w-5 h-5 text-gray-700" />
              <h2 className="text-sm font-medium text-gray-700 uppercase tracking-wider">
                Monthly Summary
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span>Income</span>
                </div>
                <p className="text-2xl font-light text-green-600">
                  +{currency} {totals.income.toFixed(2)}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <TrendingDown className="w-4 h-4 text-red-600" />
                  <span>Expenses</span>
                </div>
                <p className="text-2xl font-light text-red-600">
                  -{currency} {totals.expense.toFixed(2)}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Wallet className="w-4 h-4 text-gray-700" />
                  <span>Net</span>
                </div>
                <p
                  className={`text-2xl font-light ${totals.net >= 0 ? "text-gray-900" : "text-red-600"}`}
                >
                  {currency} {totals.net.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Transactions List */}
          {txs.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 p-12 shadow-sm">
              <div className="text-center">
                <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-light text-gray-900 mb-2">
                  No transactions yet
                </h3>
                <p className="text-gray-500 text-sm font-light mb-6">
                  Get started by adding your first transaction for this month.
                </p>
                <Link
                  href="/app/transactions/new"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-all duration-200"
                >
                  <Plus className="w-4 h-4" />
                  Add your first transaction
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {txs.map((t) => {
                const dateStr = t.date?.toDate
                  ? t.date.toDate().toLocaleDateString()
                  : "";
                const isExpense = t.type === "expense";

                return (
                  <div
                    key={t.id}
                    className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <span
                            className={`text-lg font-medium ${
                              isExpense ? "text-red-600" : "text-green-600"
                            }`}
                          >
                            {isExpense ? "−" : "+"} {currency}{" "}
                            {t.amount.toFixed(2)}
                          </span>
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                            {categoryMap.get(t.categoryId) ?? t.categoryId}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <span>{dateStr}</span>
                          {t.note && (
                            <>
                              <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                              <span className="truncate">{t.note}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <button
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                        onClick={async () => {
                          if (
                            confirm(
                              "Are you sure you want to delete this transaction?",
                            )
                          ) {
                            await deleteTransaction(user.uid, t.id);
                            await refresh(user.uid, monthKey);
                          }
                        }}
                        title="Delete transaction"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
