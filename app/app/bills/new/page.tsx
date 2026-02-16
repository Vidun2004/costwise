"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/providers";
import { getUserProfile } from "@/lib/userProfile";
import { createBillSession } from "@/lib/billSessions";
import { monthKeyFromDate } from "@/lib/date";
import { Receipt, Calendar, ArrowLeft, Save, FileText } from "lucide-react";

// In-page loading component
function NewBillSessionLoading() {
  return (
    <div className="space-y-6 max-w-xl mx-auto">
      {/* Header Skeleton */}
      <div className="flex items-center gap-4">
        <div className="h-8 w-8 bg-gray-200 rounded-lg animate-pulse"></div>
        <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse"></div>
      </div>

      {/* Form Skeleton */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 p-6 shadow-sm space-y-6">
        {/* Date Field */}
        <div className="space-y-2">
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 w-full bg-gray-100 rounded-lg animate-pulse"></div>
        </div>

        {/* Title Field */}
        <div className="space-y-2">
          <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const profile = await getUserProfile(user.uid);
      const cur = profile.currency ?? "LKR";
      setCurrency(cur);
      const mk = monthKeyFromDate(new Date(dateStr + "T12:00:00"));
      setTitle(`Bills – ${mk}`);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!user) return null;

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200"
          title="Go back"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex items-center gap-2">
          <Receipt className="w-6 h-6 text-gray-700" />
          <h1 className="text-2xl font-light tracking-tight text-gray-900">
            New Bill Session
          </h1>
        </div>
      </div>

      {loading ? (
        <NewBillSessionLoading />
      ) : (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 p-6 shadow-sm">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
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
            className="space-y-6"
          >
            {/* Date Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 block">
                Session date
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
              <p className="text-xs text-gray-400 mt-1">
                This determines the month for the session
              </p>
            </div>

            {/* Title Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 block">
                Session title
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all duration-200 text-gray-900 placeholder:text-gray-400"
                  placeholder="Enter a title for this session"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  disabled={busy}
                />
              </div>
            </div>

            {/* Currency Display */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">Currency:</span>
                <span className="font-medium text-gray-900">{currency}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={busy}
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
                    <Save className="w-4 h-4" />
                    Create Session
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

      {/* Info Note */}
      <div className="text-xs text-gray-400 text-center">
        <p>Create a session to start adding and organizing your bills</p>
      </div>
    </div>
  );
}
