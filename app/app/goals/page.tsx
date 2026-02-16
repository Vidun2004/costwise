/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/app/providers";
import { getUserProfile } from "@/lib/userProfile";
import {
  createGoal,
  deleteGoal,
  depositToGoal,
  Goal,
  listGoals,
} from "@/lib/goals";
import {
  Target,
  Calendar,
  Plus,
  Trash2,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// In-page loading component
function GoalsLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse"></div>
        <div className="h-4 w-64 bg-gray-100 rounded animate-pulse"></div>
      </div>

      {/* Progress Overview Skeleton */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="h-2 w-full bg-gray-100 rounded-full">
            <div className="h-2 w-1/2 bg-gray-200 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Create Goal Toggle Skeleton */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>

      {/* Goals List Skeleton */}
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 p-6 shadow-sm space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="h-5 w-40 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-48 bg-gray-100 rounded animate-pulse"></div>
              </div>
              <div className="h-8 w-16 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>

            <div className="space-y-2">
              <div className="h-2 w-full bg-gray-100 rounded-full">
                <div className="h-2 w-3/4 bg-gray-200 rounded-full animate-pulse"></div>
              </div>
              <div className="h-3 w-20 bg-gray-100 rounded animate-pulse"></div>
            </div>

            <div className="flex gap-2">
              <div className="h-10 flex-1 bg-gray-100 rounded-lg animate-pulse"></div>
              <div className="h-10 w-16 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function GoalsPage() {
  const { user } = useAuth();
  const [currency, setCurrency] = useState("LKR");
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // quick-add form
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [deadline, setDeadline] = useState(""); // yyyy-mm-dd
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh(uid: string) {
    setLoading(true);
    const [profile, g] = await Promise.all([
      getUserProfile(uid),
      listGoals(uid),
    ]);
    setCurrency(profile.currency ?? "LKR");
    setGoals(g);
    setLoading(false);
  }

  useEffect(() => {
    if (!user) return;
    refresh(user.uid);
  }, [user]);

  const totals = useMemo(() => {
    const totalTarget = goals.reduce((s, g) => s + (g.targetAmount || 0), 0);
    const totalCurrent = goals.reduce((s, g) => s + (g.currentAmount || 0), 0);
    return { totalTarget, totalCurrent };
  }, [goals]);

  if (!user) return null;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-light tracking-tight text-gray-900">
          Savings Goals
        </h1>
        <p className="text-sm text-gray-500 font-light">
          Track and achieve your financial targets
        </p>
      </div>

      {/* Progress Overview */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-gray-700" />
          <h2 className="text-sm font-medium text-gray-700 uppercase tracking-wider">
            Overall Progress
          </h2>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Total saved</span>
            <span className="font-medium text-gray-900">
              {currency} {totals.totalCurrent.toFixed(2)} / {currency}{" "}
              {totals.totalTarget.toFixed(2)}
            </span>
          </div>

          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-2 bg-gray-900 rounded-full transition-all duration-300"
              style={{
                width: `${
                  totals.totalTarget > 0
                    ? Math.min(
                        100,
                        (totals.totalCurrent / totals.totalTarget) * 100,
                      )
                    : 0
                }%`,
              }}
            />
          </div>

          <p className="text-xs text-gray-500">
            {totals.totalTarget > 0
              ? `${Math.round((totals.totalCurrent / totals.totalTarget) * 100)}% of total goals achieved`
              : "No goals set yet"}
          </p>
        </div>
      </div>

      {/* Collapsible Create Goal Form */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 shadow-sm">
        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50/50 transition-all duration-200 rounded-xl"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Plus
                className={`w-4 h-4 text-gray-700 transition-transform duration-200 ${
                  isFormOpen ? "rotate-45" : ""
                }`}
              />
            </div>
            <div>
              <span className="font-medium text-gray-900">Create New Goal</span>
              <p className="text-xs text-gray-500 mt-0.5">
                Add a new savings target to track
              </p>
            </div>
          </div>
          {isFormOpen ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {isFormOpen && (
          <div className="px-6 pb-6 border-t border-gray-100 pt-4">
            {error && (
              <div className="mb-4 bg-red-50 text-red-800 rounded-lg p-4 flex items-start gap-3 text-sm border border-red-100">
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
                  const t = Number(target);
                  const d = deadline ? new Date(deadline + "T12:00:00") : null;
                  await createGoal({
                    uid: user.uid,
                    name,
                    targetAmount: t,
                    deadline: d,
                  });
                  setName("");
                  setTarget("");
                  setDeadline("");
                  setIsFormOpen(false); // Auto-close after successful creation
                  await refresh(user.uid);
                } catch (e: any) {
                  setError(e?.message ?? "Failed to create goal");
                } finally {
                  setBusy(false);
                }
              }}
              className="space-y-3"
            >
              <input
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all duration-200 text-gray-900 placeholder:text-gray-400"
                placeholder="Goal name (e.g. New iPhone)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={busy}
              />

              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                  {currency}
                </span>
                <input
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all duration-200 text-gray-900 placeholder:text-gray-400"
                  inputMode="decimal"
                  placeholder="Target amount"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  required
                  disabled={busy}
                />
              </div>

              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all duration-200 text-gray-900"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  disabled={busy}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={busy || !name || !target}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-gray-900/25"
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
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Create Goal
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsFormOpen(false);
                    setName("");
                    setTarget("");
                    setDeadline("");
                    setError(null);
                  }}
                  className="px-4 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Goals List */}
      {loading ? (
        <GoalsLoading />
      ) : goals.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 p-12 shadow-sm">
          <div className="text-center">
            <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-light text-gray-900 mb-2">
              No goals yet
            </h3>
            <p className="text-gray-500 text-sm font-light mb-4">
              Create your first savings goal to get started.
            </p>
            <button
              onClick={() => setIsFormOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              Create Your First Goal
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map((g) => (
            <GoalCard
              key={g.id}
              goal={g}
              currency={currency}
              onDeposit={async (amt) => {
                await depositToGoal(user.uid, g.id, amt);
                await refresh(user.uid);
              }}
              onDelete={async () => {
                if (confirm("Are you sure you want to delete this goal?")) {
                  await deleteGoal(user.uid, g.id);
                  await refresh(user.uid);
                }
              }}
            />
          ))}
        </div>
      )}

      {/* Info Note */}
      <div className="text-xs text-gray-400 text-center">
        <p>
          Track your progress and stay motivated to reach your savings goals
        </p>
      </div>
    </div>
  );
}

function GoalCard(props: {
  goal: Goal;
  currency: string;
  onDeposit: (amount: number) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const { goal, currency, onDeposit, onDelete } = props;
  const [deposit, setDeposit] = useState("");
  const [busy, setBusy] = useState(false);

  const pct =
    goal.targetAmount > 0
      ? Math.min(
          100,
          Math.round((goal.currentAmount / goal.targetAmount) * 100),
        )
      : 0;

  const deadlineStr = goal.deadline?.toDate
    ? goal.deadline.toDate().toLocaleDateString()
    : goal.deadline
      ? String(goal.deadline)
      : "";

  const isCompleted = goal.currentAmount >= goal.targetAmount;

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all duration-200">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-medium text-gray-900">{goal.name}</h3>
            {isCompleted && (
              <span className="flex items-center gap-1 text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                <CheckCircle className="w-3 h-3" />
                Completed
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span className="font-medium text-gray-900">
              {currency} {goal.currentAmount.toFixed(2)} / {currency}{" "}
              {goal.targetAmount.toFixed(2)}
            </span>
            {deadlineStr && (
              <>
                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {deadlineStr}
                </span>
              </>
            )}
          </div>
        </div>

        <button
          onClick={onDelete}
          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
          title="Delete goal"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2 mb-4">
        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              isCompleted ? "bg-green-600" : "bg-gray-900"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">{pct}% complete</span>
          <span className="text-gray-500">
            {currency} {(goal.targetAmount - goal.currentAmount).toFixed(2)}{" "}
            remaining
          </span>
        </div>
      </div>

      {/* Deposit Form */}
      {!isCompleted && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              const amt = Number(deposit);
              await onDeposit(amt);
              setDeposit("");
            } finally {
              setBusy(false);
            }
          }}
          className="flex gap-2"
        >
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
              {currency}
            </span>
            <input
              className="w-full pl-12 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all duration-200 text-gray-900 placeholder:text-gray-400"
              inputMode="decimal"
              placeholder="Amount to add"
              value={deposit}
              onChange={(e) => setDeposit(e.target.value)}
              required
              disabled={busy}
            />
          </div>

          <button
            type="submit"
            disabled={busy || !deposit}
            className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 shadow-lg shadow-gray-900/25"
          >
            {busy ? (
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
            ) : (
              "Add"
            )}
          </button>
        </form>
      )}
    </div>
  );
}
