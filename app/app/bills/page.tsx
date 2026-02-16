/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/providers";
import { getUserProfile } from "@/lib/userProfile";
import { BillSession, listBillSessions } from "@/lib/billSessions";
import { Receipt, Plus, Clock, CheckCircle } from "lucide-react";

// In-page loading component
function BillsLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="h-4 w-64 bg-gray-100 rounded animate-pulse"></div>
        </div>
        <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
      </div>

      {/* Sessions List Skeleton */}
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 p-6 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-5 w-48 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-64 bg-gray-100 rounded animate-pulse"></div>
              </div>
              <div className="h-5 w-20 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BillsPage() {
  const { user } = useAuth();
  const [currency, setCurrency] = useState("LKR");
  const [sessions, setSessions] = useState<BillSession[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh(uid: string) {
    setLoading(true);
    const [profile, s] = await Promise.all([
      getUserProfile(uid),
      listBillSessions(uid),
    ]);
    setCurrency(profile.currency ?? "LKR");
    setSessions(s);
    setLoading(false);
  }

  useEffect(() => {
    if (!user) return;
    refresh(user.uid);
  }, [user]);

  if (!user) return null;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Receipt className="w-6 h-6 text-gray-700" />
            <h1 className="text-2xl font-light tracking-tight text-gray-900">
              Bill Sessions
            </h1>
          </div>
          <p className="text-sm text-gray-500 font-light mt-1">
            Dump bills from your purse → get a useful summary
          </p>
        </div>

        <Link
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-gray-900/25"
          href="/app/bills/new"
        >
          <Plus className="w-4 h-4" />
          New Session
        </Link>
      </div>

      {/* Sessions List */}
      {loading ? (
        <BillsLoading />
      ) : sessions.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 p-12 shadow-sm">
          <div className="text-center">
            <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-light text-gray-900 mb-2">
              No bill sessions yet
            </h3>
            <p className="text-gray-500 text-sm font-light mb-6">
              Start by creating a new session to dump your bills and get
              insights.
            </p>
            <Link
              href="/app/bills/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              Create Your First Session
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => {
            const isClosed = s.closedAt;
            const isConverted = s.convertedToTransactions;
            const total = s.summary?.total ?? 0;

            return (
              <Link
                key={s.id}
                href={`/app/bills/${s.id}`}
                className="block bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:border-gray-200"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h2 className="text-lg font-medium text-gray-900 truncate">
                        {s.title}
                      </h2>
                      <div className="flex items-center gap-1">
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

                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span>Month: {s.monthKey}</span>
                      <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                      <span>{s.itemCount || 0} items</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm text-gray-500">Total</div>
                    <div className="text-xl font-light text-gray-900">
                      {currency} {total.toFixed(2)}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
