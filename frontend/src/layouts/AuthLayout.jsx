import * as React from "react";
import { Outlet, Link, Navigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/contexts/authStore";
import { useTranslation } from "react-i18next";

function AuthLayout({ className }) {
  const { t } = useTranslation();
  const { user, loading } = useAuthStore();

  // Prevent flicker before auth hydration finishes
  if (loading) return null;

  // ✅ If already logged in → redirect to app
  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div
      className={cn(
        "min-h-screen flex flex-col bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white",
        className
      )}
    >
      {/* Header */}
      <header className="p-6">
        <Link to="/" className="flex items-center gap-3 w-fit">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">SH</span>
          </div>
          <span className="text-xl font-bold tracking-tight">
            {t("common.websiteName")}
          </span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          {/* Glass container for auth pages */}
          <div className="rounded-2xl bg-white/5 backdrop-blur border border-white/10 shadow-xl p-6 md:p-8">
            <Outlet />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-sm text-white/50">
        <p>
          {t("footer.copyright", {
            year: new Date().getFullYear(),
          })}
        </p>
      </footer>
    </div>
  );
}

export default AuthLayout;
