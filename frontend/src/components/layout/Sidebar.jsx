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
  Wrench,
  Calendar,
  Briefcase,
  ShoppingBag,
  UserCircle,
  MessageSquare,
  Brain,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/contexts/authStore";
import { Badge } from "@/components/ui/Badge";
import { useQuery } from "@tanstack/react-query";
import { messagingService } from "@/services/messaging.service";

// Static navigation items for MobileNav backward compatibility
export const navigationItems = [
  { key: "sidebar.projects", href: "/app/projects", icon: FileText },
  { key: "sidebar.messages", href: "/app/messages", icon: MessageSquare },
  { key: "sidebar.services", href: "/app/services", icon: Wrench },
  { key: "sidebar.bookings", href: "/app/bookings", icon: Calendar },
  { key: "sidebar.bids", href: "/app/bids", icon: Briefcase },
  { key: "sidebar.settings", href: "/app/settings", icon: Settings },
];

export const bottomNavigationItems = [
  { key: "sidebar.help", href: "/app/help", icon: HelpCircle },
];

// Helper function to build dynamic navigation based on user type
export const getDynamicNavigation = (userType, isClient, isProvider) => {
  const baseNav = [];

  // Add user type specific dashboards
  if (isClient && isClient()) {
    baseNav.push({
      key: "sidebar.clientDashboard",
      href: "/app/dashboard/client",
      icon: UserCircle
    });
  }

  if (isProvider && isProvider()) {
    baseNav.push({
      key: "sidebar.providerDashboard",
      href: "/app/dashboard/provider",
      icon: Briefcase
    });
  }

  // Add common navigation items
  baseNav.push(
    { key: "sidebar.projects", href: "/app/projects", icon: FileText },
  );

  // Bids - for both clients and providers
  if (isClient && isClient() || isProvider && isProvider()) {
    baseNav.push(
      { key: "sidebar.bids", href: "/app/bids", icon: ShoppingBag },
    );
  }

  // Services and Bookings - primarily for providers, but clients can browse
  // if (isProvider && isProvider()) {
    baseNav.push(
      { key: "sidebar.services", href: "/app/services", icon: Wrench },
    );
  // }

  // Bookings - for tracking service bookings
  baseNav.push(
    { key: "sidebar.bookings", href: "/app/bookings", icon: Calendar },
    { key: "sidebar.messages", href: "/app/messages", icon: MessageSquare, showBadge: true },
    { key: "sidebar.settings", href: "/app/settings", icon: Settings },
  );

  // Admin-only features
  if (userType === 'admin') {
    baseNav.push(
      { key: "sidebar.aiAnalytics", href: "/app/ai/analytics", icon: Brain, label: "AI Analytics" },
    );
  }

  return baseNav;
};

function Sidebar({ collapsed, onToggleCollapse, isRtl }) {
  const location = useLocation();
  const { t } = useTranslation();
  const { userType, isClient, isProvider } = useAuthStore();

  // Fetch unread count
  const { data: unreadData } = useQuery({
    queryKey: ['unread-count'],
    queryFn: async () => {
      try {
        const res = await messagingService.getUnreadCount();
        return res ?? { count: 0 };
      } catch (error) {
        console.error('Failed to fetch unread count:', error);
        return { count: 0 };
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    retry: 1,
    enabled: true,
  });

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
        <NavLink 
          to={isClient() ? "/app/dashboard/client" : isProvider() ? "/app/dashboard/provider" : "/app"} 
          className="flex items-center w-full"
        >
          {!collapsed ? (
            <span className="text-xl font-bold text-white">{t('common.websiteName')}</span>
          ) : (
            <span className="text-xl font-bold text-white mx-auto">SH</span>
          )}
        </NavLink>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          const unreadCount = item.showBadge ? unreadData?.unread_count : 0;

          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative",
                isActive
                  ? "bg-primary text-white"
                  : "text-secondary-foreground/70 hover:bg-secondary-foreground/10 hover:text-white"
              )}
            >
              <item.icon className={cn("h-5 w-5", collapsed && "mx-auto")} />
              {!collapsed && (
                <span className="flex-1">{item.name}</span>
              )}
              {item.showBadge && unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className={cn(
                    "h-5 min-w-5 flex items-center justify-center text-xs",
                    collapsed && "absolute -top-1 -right-1"
                  )}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
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