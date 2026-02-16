/* eslint-disable @typescript-eslint/no-explicit-any */
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
  BarChart3,
  LineChart,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
} from "lucide-react";

// Recharts components
import {
  PieChart as RePieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

// Custom tooltip styles
const CustomTooltip = ({ active, payload, label, currency }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
        <p className="text-gray-600 font-medium mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-gray-900">
            <span style={{ color: entry.color }}>{entry.name}:</span> {currency}{" "}
            {entry.value.toFixed(2)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Progress Ring component (keep this as it's custom and lightweight)
function ProgressRing({
  percentage,
  size = 80,
  strokeWidth = 8,
  color = "#111827",
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#f3f4f6"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <span className="absolute text-sm font-medium text-gray-900">
        {Math.round(percentage)}%
      </span>
    </div>
  );
}

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
  const [chartView, setChartView] = useState<"pie" | "bar">("pie");

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
  const overallPercentage =
    overallLimit > 0 ? (expense / overallLimit) * 100 : 0;

  // Prepare pie chart data
  const pieChartData = useMemo(() => {
    return categories
      .map((c) => ({
        name: c.name,
        value: spentMap.get(c.id) || 0,
      }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [categories, spentMap]);

  // Prepare category comparison data for bar chart
  const categoryBarData = useMemo(() => {
    return categories
      .map((c) => ({
        category: c.name,
        spent: spentMap.get(c.id) || 0,
        budget: budgetMap.get(c.id) || 0,
        remaining: (budgetMap.get(c.id) || 0) - (spentMap.get(c.id) || 0),
      }))
      .filter((item) => item.spent > 0 || item.budget > 0)
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 8);
  }, [categories, spentMap, budgetMap]);

  // Generate trend data with proper structure
  const trendData = useMemo(() => {
    // In a real app, you'd fetch this from history
    // This is sample data
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return days.map((day, index) => ({
      day,
      amount: [450, 520, 480, 610, 590, 680, 720][index],
    }));
  }, []);

  // Calculate savings rate
  const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;

  // Get recent transactions
  const recentTransactions = useMemo(() => {
    return [...txs]
      .sort((a, b) => {
        const dateA = a.date?.toDate?.() || new Date(0);
        const dateB = b.date?.toDate?.() || new Date(0);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 5);
  }, [txs]);

  // Colors for charts
  const COLORS = ["#111827", "#4B5563", "#9CA3AF", "#6B7280", "#374151"];

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
          {/* Key Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Income</span>
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-xl font-light text-gray-900">
                {currency} {income.toFixed(2)}
              </p>
              <p className="text-xs text-gray-400 mt-1">This month</p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Expenses</span>
                <TrendingDown className="w-4 h-4 text-red-600" />
              </div>
              <p className="text-xl font-light text-gray-900">
                {currency} {expense.toFixed(2)}
              </p>
              <p className="text-xs text-gray-400 mt-1">This month</p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Net Savings</span>
                <Wallet className="w-4 h-4 text-gray-700" />
              </div>
              <p
                className={`text-xl font-light ${net >= 0 ? "text-gray-900" : "text-red-600"}`}
              >
                {currency} {net.toFixed(2)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {savingsRate >= 0 ? "+" : ""}
                {savingsRate.toFixed(1)}% savings rate
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Overall Budget</span>
                <BarChart3 className="w-4 h-4 text-gray-700" />
              </div>
              {overallLimit > 0 ? (
                <>
                  <p className="text-xl font-light text-gray-900">
                    {currency} {expense.toFixed(2)} / {overallLimit.toFixed(2)}
                  </p>
                  <div className="mt-2 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        overallPercentage > 100 ? "bg-red-600" : "bg-gray-900"
                      }`}
                      style={{ width: `${Math.min(100, overallPercentage)}%` }}
                    />
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-400">No budget set</p>
              )}
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Spending by Category - Interactive Chart */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-gray-700" />
                  <h2 className="text-sm font-medium text-gray-700 uppercase tracking-wider">
                    Spending by Category
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setChartView("pie")}
                    className={`p-1.5 rounded-lg transition-colors ${
                      chartView === "pie"
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                    title="Pie chart view"
                  >
                    <PieChart className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setChartView("bar")}
                    className={`p-1.5 rounded-lg transition-colors ${
                      chartView === "bar"
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                    title="Bar chart view"
                  >
                    <BarChart3 className="w-4 h-4" />
                  </button>
                  <Link
                    href="/app/budgets"
                    className="text-xs text-gray-500 hover:text-gray-900 transition-colors ml-2"
                  >
                    Manage budgets
                  </Link>
                </div>
              </div>

              {pieChartData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartView === "pie" ? (
                      <RePieChart>
                        <Pie
                          data={pieChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, percent }) =>
                            `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`
                          }
                          labelLine={false}
                        >
                          {pieChartData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          content={<CustomTooltip currency={currency} />}
                        />
                      </RePieChart>
                    ) : (
                      <BarChart
                        data={categoryBarData}
                        layout="vertical"
                        margin={{ left: 80, right: 20, top: 10, bottom: 10 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          horizontal={false}
                        />
                        <XAxis type="number" hide />
                        <YAxis
                          type="category"
                          dataKey="category"
                          tick={{ fontSize: 12, fill: "#6B7280" }}
                          width={70}
                        />
                        <Tooltip
                          content={<CustomTooltip currency={currency} />}
                        />
                        <Bar
                          dataKey="spent"
                          fill="#111827"
                          radius={[0, 4, 4, 0]}
                        />
                        {categoryBarData.some((d) => d.budget > 0) && (
                          <Bar
                            dataKey="budget"
                            fill="#9CA3AF"
                            radius={[0, 4, 4, 0]}
                          />
                        )}
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-12">
                  <PieChart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm font-light">
                    No spending data for this month
                  </p>
                </div>
              )}
            </div>

            {/* Spending Trend - Area Chart */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <LineChart className="w-5 h-5 text-gray-700" />
                <h2 className="text-sm font-medium text-gray-700 uppercase tracking-wider">
                  Spending Trend
                </h2>
              </div>

              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient
                        id="spendingGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#111827"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#111827"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 12, fill: "#9CA3AF" }}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: "#9CA3AF" }}
                      tickFormatter={(value) => `${currency} ${value}`}
                    />
                    <Tooltip content={<CustomTooltip currency={currency} />} />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="#111827"
                      strokeWidth={2}
                      fill="url(#spendingGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <div>
                  <p className="text-xs text-gray-400">Average</p>
                  <p className="text-sm font-medium text-gray-900">
                    {currency}{" "}
                    {(
                      trendData.reduce((sum, d) => sum + d.amount, 0) /
                      trendData.length
                    ).toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Total</p>
                  <p className="text-sm font-medium text-gray-900">
                    {currency}{" "}
                    {trendData.reduce((sum, d) => sum + d.amount, 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Goals Progress */}
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {goals.slice(0, 3).map((g) => {
                  const pct =
                    g.targetAmount > 0
                      ? Math.min(100, (g.currentAmount / g.targetAmount) * 100)
                      : 0;
                  const remaining = g.targetAmount - g.currentAmount;

                  return (
                    <div
                      key={g.id}
                      className="flex flex-col items-center text-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <ProgressRing
                        percentage={pct}
                        size={80}
                        strokeWidth={6}
                        color="#111827"
                      />
                      <h3 className="font-medium text-gray-900 mt-3">
                        {g.name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {currency} {g.currentAmount.toFixed(2)} /{" "}
                        {g.targetAmount.toFixed(2)}
                      </p>
                      {remaining > 0 && (
                        <p className="text-xs text-gray-400 mt-2">
                          {currency} {remaining.toFixed(2)} to go
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Transactions */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-700" />
                <h2 className="text-sm font-medium text-gray-700 uppercase tracking-wider">
                  Recent Transactions
                </h2>
              </div>
              <Link
                href="/app/transactions"
                className="text-xs text-gray-500 hover:text-gray-900 transition-colors"
              >
                View all
              </Link>
            </div>

            {recentTransactions.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm font-light">
                  No transactions for this month
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTransactions.map((tx) => {
                  const isExpense = tx.type === "expense";
                  const date = tx.date?.toDate?.() || new Date();

                  return (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            isExpense ? "bg-red-100" : "bg-green-100"
                          }`}
                        >
                          {isExpense ? (
                            <ArrowDownRight className="w-4 h-4 text-red-600" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4 text-green-600" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {tx.note || "Transaction"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {date.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-sm font-medium ${
                          isExpense ? "text-red-600" : "text-green-600"
                        }`}
                      >
                        {isExpense ? "-" : "+"}
                        {currency} {tx.amount.toFixed(2)}
                      </span>
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
