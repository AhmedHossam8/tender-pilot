import * as React from "react";
import { Outlet, Link, Navigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";
import { useAuthStore } from "@/contexts/authStore";

function AuthLayout({ className }) {
  const { user, isInitialized } = useAuthStore();

  // Prevent flicker before auth hydration finishes
  if (!isInitialized) return null;

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
          <span className="text-xl font-bold">TenderPilot</span>
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
        <p>© {new Date().getFullYear()} TenderPilot. All rights reserved.</p>
      </footer>

      <Toaster position="top-right" richColors />
    </div>
  );
}

export default AuthLayout;
