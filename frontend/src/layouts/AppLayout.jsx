import * as React from "react";
import { Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { Footer } from "@/components/layout/Footer";
import { Toaster } from "sonner";
import { useTranslation } from "react-i18next";
// import { useAuthStore } from "../stores/authStore";

function AppLayout({ showFooter = false }) {
  const { i18n } = useTranslation();
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const isRtl = i18n.language === "ar";
  // const user = useAuthStore((state) => state.user);
  const user = { name: "John Doe" }; // Placeholder for user data
  
  return (
    <div className={cn("min-h-screen bg-background")} dir={isRtl ? "rtl" : "ltr"}>
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
        />
      </div>

      {/* Mobile Navigation */}
      <MobileNav
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        isRtl={isRtl}
      />

      {/* Main Content Area */}
      <div
        className={cn(
          "flex flex-col min-h-screen transition-all duration-300",
          sidebarCollapsed
            ? isRtl
              ? "lg:pr-16"
              : "lg:pl-16"
            : isRtl
              ? "lg:pr-64"
              : "lg:pl-64"
        )}
      >
        <Header onMenuClick={() => setMobileNavOpen(true)} user={user} />
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
