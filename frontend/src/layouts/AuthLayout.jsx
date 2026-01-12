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
        "min-h-screen flex flex-col bg-gradient-to-br from-primary/5 via-background to-accent/5",
        className
      )}
    >
      {/* Header */}
      <header className="p-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-lg">TP</span>
          </div>
          <span className="text-xl font-bold">{t('common.websiteName')}</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-sm text-muted-foreground">
        <p>{t('common.copyright', { year: new Date().getFullYear() })}</p>
      </footer>
    </div>
  );
}

export default AuthLayout;
