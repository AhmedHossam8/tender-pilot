import * as React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  Users,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Building2,
  Sparkles,
  Briefcase,
  ShoppingBag,
  UserCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/contexts/authStore";

// Static navigation items for MobileNav backward compatibility
export const navigationItems = [
  { key: "sidebar.dashboard", href: "/", icon: LayoutDashboard },
  { key: "aiEngine.dashboard", href: "/ai/dashboard", icon: Sparkles },
  { key: "sidebar.projects", href: "/projects", icon: FileText },
  { key: "sidebar.proposals", href: "/proposals", icon: FolderOpen },
  { key: "sidebar.documents", href: "/documents", icon: Building2 },
  { key: "sidebar.team", href: "/team", icon: Users },
  { key: "sidebar.settings", href: "/settings", icon: Settings },
];

export const bottomNavigationItems = [
  { key: "sidebar.help", href: "/help", icon: HelpCircle },
];

// Helper function to build dynamic navigation based on user type
export const getDynamicNavigation = (userType, isClient, isProvider) => {
  const baseNav = [
    { key: "sidebar.dashboard", href: "/", icon: LayoutDashboard },
    { key: "aiEngine.dashboard", href: "/ai/dashboard", icon: Sparkles },
  ];

  // Add user type specific dashboards
  if (isClient && isClient()) {
    baseNav.push({ 
      key: "sidebar.clientDashboard", 
      href: "/dashboard/client", 
      icon: UserCircle,
      label: "Client Dashboard"
    });
  }

  if (isProvider && isProvider()) {
    baseNav.push({ 
      key: "sidebar.providerDashboard", 
      href: "/dashboard/provider", 
      icon: Briefcase,
      label: "Provider Dashboard"
    });
  }

  // Add common navigation items
  baseNav.push(
    { key: "sidebar.projects", href: "/projects", icon: FileText },
    { key: "sidebar.proposals", href: "/proposals", icon: FolderOpen },
  );

  // Add services for providers
  if (isProvider && isProvider()) {
    baseNav.push({ 
      key: "sidebar.services", 
      href: "/services", 
      icon: ShoppingBag,
      label: "Services"
    });
  }

  baseNav.push(
    { key: "sidebar.documents", href: "/documents", icon: Building2 },
    { key: "sidebar.team", href: "/team", icon: Users },
    { key: "sidebar.settings", href: "/settings", icon: Settings },
  );

  return baseNav;
};

function Sidebar({ collapsed, onToggleCollapse, isRtl }) {
  const location = useLocation();
  const { t } = useTranslation();
  const { userType, isClient, isProvider } = useAuthStore();

  const navigation = getDynamicNavigation(userType, isClient, isProvider).map(item => ({ 
    ...item, 
    name: item.label || t(item.key) 
  }));
  
  const bottomNavigation = bottomNavigationItems.map(item => ({ 
    ...item, 
    name: t(item.key) 
  }));

  return (
    <aside
      className={cn(
        "flex flex-col bg-secondary text-secondary-foreground h-screen transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        isRtl ? "rtl absolute right-0" : "absolute left-0"
      )}
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-secondary-foreground/10">
        {!collapsed ? (
          <span className="text-xl font-bold text-white">TenderPilot</span>
        ) : (
          <span className="text-xl font-bold text-white mx-auto">TP</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-white"
                  : "text-secondary-foreground/70 hover:bg-secondary-foreground/10 hover:text-white"
              )}
            >
              <item.icon className={cn("h-5 w-5", collapsed && "mx-auto")} />
              {!collapsed && <span>{item.name}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Navigation */}
      <div className="px-2 py-4 border-t border-secondary-foreground/10">
        {bottomNavigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium",
              "text-secondary-foreground/70 hover:bg-secondary-foreground/10 hover:text-white"
            )}
          >
            <item.icon className={cn("h-5 w-5", collapsed && "mx-auto")} />
            {!collapsed && <span>{item.name}</span>}
          </NavLink>
        ))}

        {/* Collapse Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className={cn(
            "w-full mt-2 justify-center text-secondary-foreground/70 hover:text-white hover:bg-secondary-foreground/10"
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              <span>{t("sidebar.collapse")}</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}

export { Sidebar as default, Sidebar };
