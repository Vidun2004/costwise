"use client";

import { useState } from "react";
import Link from "next/link";
import { resetPassword } from "@/lib/auth";
import { Mail, ArrowLeft, Send, AlertCircle, CheckCircle } from "lucide-react";

export default function ResetPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const isSuccess = msg?.includes("If an account exists");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-gray-900 to-gray-700 text-white mb-4 shadow-lg">
            <Send className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-light tracking-tight text-gray-900">
            Reset password
          </h1>
          <p className="text-gray-500 mt-2 font-light">
            Enter your email to receive a reset link
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-8">
          {/* Message Display */}
          {msg && (
            <div
              className={`mb-6 rounded-lg p-4 flex items-start gap-3 text-sm border ${
                isSuccess
                  ? "bg-green-50 text-green-800 border-green-100"
                  : "bg-red-50 text-red-800 border-red-100"
              }`}
            >
              {isSuccess ? (
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              )}
              <span>{msg}</span>
            </div>
          )}

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setMsg(null);
              try {
                await resetPassword(email.trim());
                setMsg(
                  "If an account exists for that email, a reset link was sent.",
                );
              } catch {
                setMsg(
                  "Could not send reset email. Check the email and try again.",
                );
              } finally {
                setBusy(false);
              }
            }}
            className="space-y-6"
          >
            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 block">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all duration-200 text-gray-900 placeholder:text-gray-400"
                  placeholder="you@example.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={busy}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={busy}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:active:scale-100 shadow-lg shadow-gray-900/25"
            >
              {busy ? (
                <span className="flex items-center justify-center gap-2">
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
                  Sending...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Send className="w-5 h-5" />
                  Send reset link
                </span>
              )}
            </button>

            {/* Back to Login Link */}
            <div className="text-center pt-4 border-t border-gray-100">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Back to login
              </Link>
            </div>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-8">
          We&apos;ll never share your email with anyone else
        </p>
      </div>
    </div>
  );
}
