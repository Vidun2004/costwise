"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/app/providers";
import { monthKeyFromDate } from "@/lib/date";
import { getUserProfile, Category } from "@/lib/userProfile";
import { listTransactionsForMonth, Transaction } from "@/lib/transactions";
import { listBudgetsForMonth, Budget } from "@/lib/budgets";
import { spentByCategory, totalIncomeExpense } from "@/lib/insights";
import { listGoals, Goal } from "@/lib/goals";
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Wallet,
  Target,
  PieChart,
} from "lucide-react";

// In-page loading component
function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="h-4 w-24 bg-gray-100 rounded animate-pulse"></div>
        </div>
        <div className="h-10 w-48 bg-gray-200 rounded-lg animate-pulse"></div>
      </div>

      {/* Summary Card Skeleton */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 p-6 space-y-4">
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
        <div className="flex gap-6">
          <div className="space-y-2">
            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-6 w-24 bg-gray-300 rounded animate-pulse"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-6 w-24 bg-gray-300 rounded animate-pulse"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-6 w-24 bg-gray-300 rounded animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Goals Skeleton */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 p-6 space-y-4">
        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <div className="flex justify-between">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded">
              <div className="h-2 w-3/4 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Categories Skeleton */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 p-6 space-y-4">
        <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-2">
            <div className="flex justify-between">
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded">
              <div className="h-2 w-1/2 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="h-3 w-24 bg-gray-100 rounded animate-pulse"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AppHome() {
  const { user } = useAuth();
  const [monthKey, setMonthKey] = useState(() => monthKeyFromDate(new Date()));
  const [currency, setCurrency] = useState("LKR");
  const [categories, setCategories] = useState<Category[]>([]);
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    (async () => {
      setLoading(true);
      const [profile, monthTxs, monthBudgets, userGoals] = await Promise.all([
        getUserProfile(user.uid),
        listTransactionsForMonth(user.uid, monthKey),
        listBudgetsForMonth(user.uid, monthKey),
        listGoals(user.uid),
      ]);
      setCurrency(profile.currency ?? "LKR");
      setCategories(
        Array.isArray(profile.categories) ? profile.categories : [],
      );
      setTxs(monthTxs);
      setBudgets(monthBudgets);
      setGoals(userGoals);
      setLoading(false);
    })();
  }, [user, monthKey]);

  const { income, expense, net } = useMemo(
    () => totalIncomeExpense(txs),
    [txs],
  );
  const spentMap = useMemo(() => spentByCategory(txs), [txs]);

  const budgetMap = useMemo(() => {
    const m = new Map<string, number>();
    budgets.forEach((b) => m.set(b.categoryId, b.limit));
    return m;
  }, [budgets]);

  const overallLimit = budgetMap.get("all") ?? 0;
  const overallRemaining = overallLimit > 0 ? overallLimit - expense : null;

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Header with Month Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-light tracking-tight text-gray-900">
            Dashboard
          </h1>
          <p className="text-sm text-gray-500 font-light">
            Track your financial progress
          </p>
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
        <DashboardLoading />
      ) : (
        <>
          {/* Summary Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Wallet className="w-5 h-5 text-gray-700" />
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
                <p className="text-2xl font-light text-gray-900">
                  {currency} {income.toFixed(2)}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <TrendingDown className="w-4 h-4 text-red-600" />
                  <span>Expenses</span>
                </div>
                <p className="text-2xl font-light text-gray-900">
                  {currency} {expense.toFixed(2)}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Wallet className="w-4 h-4 text-gray-700" />
                  <span>Net</span>
                </div>
                <p
                  className={`text-2xl font-light ${net >= 0 ? "text-gray-900" : "text-red-600"}`}
                >
                  {currency} {net.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Overall Budget */}
            {overallLimit > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">Overall Budget</span>
                  <span className="text-sm font-medium text-gray-900">
                    {currency} {expense.toFixed(2)} / {currency}{" "}
                    {overallLimit.toFixed(2)}
                  </span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      overallRemaining! < 0 ? "bg-red-600" : "bg-gray-900"
                    }`}
                    style={{
                      width: `${Math.min(100, (expense / overallLimit) * 100)}%`,
                    }}
                  />
                </div>
                <p
                  className={`text-xs mt-1 ${
                    overallRemaining! < 0 ? "text-red-600" : "text-gray-500"
                  }`}
                >
                  {overallRemaining! < 0
                    ? `${currency} ${Math.abs(overallRemaining!).toFixed(2)} over budget`
                    : `${currency} ${overallRemaining!.toFixed(2)} remaining`}
                </p>
              </div>
            )}
          </div>

          {/* Savings Goals */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-gray-700" />
                <h2 className="text-sm font-medium text-gray-700 uppercase tracking-wider">
                  Savings Goals
                </h2>
              </div>
              {goals.length > 0 && (
                <Link
                  href="/app/goals"
                  className="text-xs text-gray-500 hover:text-gray-900 transition-colors"
                >
                  View all
                </Link>
              )}
            </div>

            {goals.length === 0 ? (
              <div className="text-center py-8">
                <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm font-light">
                  No goals yet. Create one in Goals.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {goals.slice(0, 3).map((g) => {
                  const pct =
                    g.targetAmount > 0
                      ? Math.min(
                          100,
                          Math.round((g.currentAmount / g.targetAmount) * 100),
                        )
                      : 0;
                  return (
                    <div key={g.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">
                          {g.name}
                        </span>
                        <span className="text-sm text-gray-500">
                          {currency} {g.currentAmount.toFixed(2)} / {currency}{" "}
                          {g.targetAmount.toFixed(2)}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-2 bg-gray-900 rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500">{pct}% complete</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Category Budgets */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="w-5 h-5 text-gray-700" />
              <h2 className="text-sm font-medium text-gray-700 uppercase tracking-wider">
                Category Budgets
              </h2>
            </div>

            {categories.length === 0 ? (
              <div className="text-center py-8">
                <PieChart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm font-light">
                  No categories found. Set up categories in your profile.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {categories.map((c) => {
                  const limit = budgetMap.get(c.id) ?? 0;
                  const spent = spentMap.get(c.id) ?? 0;
                  const pct =
                    limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
                  const remaining = limit > 0 ? limit - spent : null;

                  return (
                    <div key={c.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">
                          {c.name}
                        </span>
                        {limit > 0 ? (
                          <span
                            className={`text-sm ${
                              remaining! < 0 ? "text-red-600" : "text-gray-500"
                            }`}
                          >
                            {currency} {spent.toFixed(2)} / {currency}{" "}
                            {limit.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">
                            No budget
                          </span>
                        )}
                      </div>

                      {limit > 0 && (
                        <>
                          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${
                                remaining! < 0 ? "bg-red-600" : "bg-gray-900"
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">
                              {pct.toFixed(0)}% used
                            </span>
                            <span
                              className={
                                remaining! < 0
                                  ? "text-red-600"
                                  : "text-gray-500"
                              }
                            >
                              {remaining! < 0
                                ? `${currency} ${Math.abs(remaining!).toFixed(2)} over`
                                : `${currency} ${remaining!.toFixed(2)} left`}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
