"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../providers";
import { logout } from "@/lib/auth";
import Loading from "@/components/Loading";
import {
  LayoutDashboard,
  Receipt,
  Target,
  TrendingUp,
  LogOut,
  Menu,
  X,
  ReceiptIcon,
} from "lucide-react";

export default function AppAreaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  const navItems = [
    { href: "/app", label: "Dashboard", icon: LayoutDashboard },
    { href: "/app/transactions", label: "Transactions", icon: Receipt },
    { href: "/app/budgets", label: "Budgets", icon: TrendingUp },
    { href: "/app/goals", label: "Goals", icon: Target },
    { href: "/app/bills", label: "Bills", icon: ReceiptIcon },
  ];

  if (loading) return <Loading />;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and User Info */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-gray-900 to-gray-700 flex items-center justify-center shadow-lg shadow-gray-900/25">
                  <span className="text-white font-semibold text-sm">C</span>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-lg font-light tracking-tight text-gray-900">
                    Costwise
                  </h1>
                  <p className="text-xs text-gray-500 font-light">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-gray-900 text-white shadow-lg shadow-gray-900/25"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Desktop Logout Button */}
            <button
              onClick={async () => {
                await logout();
                router.replace("/login");
              }}
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200 border border-gray-200 hover:border-gray-300"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-all duration-200"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white/95 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-4 py-3 space-y-1">
              {/* Mobile User Info */}
              <div className="px-3 py-2 mb-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">
                  {user.email}
                </p>
              </div>

              {/* Mobile Nav Items */}
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-gray-900 text-white"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}

              {/* Mobile Logout Button */}
              <button
                onClick={async () => {
                  await logout();
                  router.replace("/login");
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200 mt-2 border-t border-gray-100 pt-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
