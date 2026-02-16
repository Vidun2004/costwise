"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/providers";
import { getUserProfile } from "@/lib/userProfile";
import { createBillSession } from "@/lib/billSessions";
import { monthKeyFromDate } from "@/lib/date";

export default function NewBillSessionPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [currency, setCurrency] = useState("LKR");
  const [title, setTitle] = useState("");
  const [dateStr, setDateStr] = useState(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const profile = await getUserProfile(user.uid);
      const cur = profile.currency ?? "LKR";
      setCurrency(cur);
      const mk = monthKeyFromDate(new Date(dateStr + "T12:00:00"));
      setTitle(`Bills – ${mk}`);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!user) return null;

  return (
    <div className="space-y-4 max-w-xl">
      <h1 className="text-2xl font-semibold">New bill session</h1>

      <div className="grid gap-2">
        <label className="text-sm opacity-70">Session date</label>
        <input
          className="border rounded px-3 py-2"
          type="date"
          value={dateStr}
          onChange={(e) => setDateStr(e.target.value)}
        />

        <label className="text-sm opacity-70">Title</label>
        <input
          className="border rounded px-3 py-2"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <button
          disabled={busy}
          className="px-3 py-2 rounded bg-black text-white disabled:opacity-60"
          onClick={async () => {
            setBusy(true);
            const d = new Date(dateStr + "T12:00:00");
            const id = await createBillSession({
              uid: user.uid,
              title,
              currency,
              date: d,
            });
            router.replace(`/app/bills/${id}`);
          }}
        >
          {busy ? "Creating..." : "Create session"}
        </button>

        <button
          className="px-3 py-2 rounded border"
          onClick={() => router.back()}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
