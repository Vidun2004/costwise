"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/providers";
import { getUserProfile } from "@/lib/userProfile";
import { BillSession, listBillSessions } from "@/lib/billSessions";

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
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Bill Sessions</h1>
          <div className="text-sm opacity-70">
            Dump bills from your purse → get a useful summary
          </div>
        </div>

        <Link
          className="px-3 py-2 rounded bg-black text-white"
          href="/app/bills/new"
        >
          + New session
        </Link>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : sessions.length === 0 ? (
        <div className="opacity-70">No bill sessions yet.</div>
      ) : (
        <div className="space-y-2">
          {sessions.map((s) => (
            <Link
              key={s.id}
              href={`/app/bills/${s.id}`}
              className="block border rounded-xl p-4 hover:bg-black/5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold truncate">{s.title}</div>
                  <div className="text-sm opacity-70">
                    Month: {s.monthKey} • {s.closedAt ? "Closed" : "Open"} •{" "}
                    {s.convertedToTransactions ? "Converted" : "Not converted"}
                  </div>
                </div>

                <div className="text-sm opacity-80">
                  {currency} {(s.summary?.total ?? 0).toFixed(2)}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
