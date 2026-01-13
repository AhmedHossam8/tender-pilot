import * as React from "react";
import { Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { Footer } from "@/components/layout/Footer";
import { Toaster } from "sonner";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/contexts/authStore";
import { useMessages } from "@/hooks/useMessages"; // <-- import your hook

function AppLayout({ showFooter = false }) {
  const { i18n } = useTranslation();
  const { user } = useAuthStore();

  const { unreadCountQuery } = useMessages(); // <-- get unread count

  const unreadCount = unreadCountQuery?.data ?? 0; // <-- default to 0

  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  const isRtl = i18n.language === "ar";

  // Prevent function recreation on every render
  const handleMobileMenuClick = React.useCallback(() => {
    setMobileNavOpen(true);
  }, []);

  const handleMobileMenuClose = React.useCallback(() => {
    setMobileNavOpen(false);
  }, []);

  return (
    <div
      className={cn(
        "min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white relative overflow-hidden"
      )}
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]" />
        <div className="absolute top-0 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      {/* Desktop Sidebar */}
      <div
        className={cn(
          "hidden lg:block fixed inset-y-0 z-30 transition-all duration-300",
          isRtl ? "right-0" : "left-0"
        )}
      >
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          isRtl={isRtl}
          unreadCount={unreadCount} // <-- pass safely
        />
      </div>

      {/* Mobile Navigation */}
      <div className="relative z-20 lg:hidden">
        <MobileNav
          isOpen={mobileNavOpen}
          onClose={handleMobileMenuClose}
          isRtl={isRtl}
          unreadCount={unreadCount} // <-- pass safely
        />
      </div>

      {/* Main content */}
      <div
        className={cn(
          "flex flex-col min-h-screen transition-all duration-300 relative z-10",
          sidebarCollapsed
            ? isRtl
              ? "lg:pr-16"
              : "lg:pl-16"
            : isRtl
              ? "lg:pr-64"
              : "lg:pl-64"
        )}
      >
        <Header onMenuClick={handleMobileMenuClick} user={user} unreadCount={unreadCount} />

        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>

        {showFooter && <Footer />}
      </div>

      <Toaster position="top-right" richColors />
    </div>
  );
}

export default AppLayout;
