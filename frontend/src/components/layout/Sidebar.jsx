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
import { Badge } from "@/components/ui/Badge";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/contexts/authStore";
import { useQuery } from "@tanstack/react-query";
import { messagingService } from "@/services/messaging.service";

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

export const getDynamicNavigation = (userType, isClient, isProvider) => {
  const baseNav = [];

  if (isClient && isClient()) {
    baseNav.push({
      key: "sidebar.clientDashboard",
      href: "/app/dashboard/client",
      icon: UserCircle,
    });
  }

  if (isProvider && isProvider()) {
    baseNav.push({
      key: "sidebar.providerDashboard",
      href: "/app/dashboard/provider",
      icon: Briefcase,
    });
  }

  baseNav.push({ key: "sidebar.projects", href: "/app/projects", icon: FileText });

  if ((isClient && isClient()) || (isProvider && isProvider())) {
    baseNav.push({ key: "sidebar.bids", href: "/app/bids", icon: ShoppingBag });
  }

  baseNav.push(
    { key: "sidebar.services", href: "/app/services", icon: Wrench },
    { key: "sidebar.bookings", href: "/app/bookings", icon: Calendar },
    { key: "sidebar.messages", href: "/app/messages", icon: MessageSquare, showBadge: true },
    { key: "sidebar.settings", href: "/app/settings", icon: Settings }
  );

  if (userType === "admin") {
    baseNav.push({ key: "sidebar.aiAnalytics", href: "/app/ai/analytics", icon: Brain, label: "AI Analytics" });
  }

  return baseNav;
};

function Sidebar({ collapsed, onToggleCollapse, isRtl }) {
  const location = useLocation();
  const { t } = useTranslation();
  const { userType, isClient, isProvider } = useAuthStore();

  const { data: unreadData } = useQuery({
    queryKey: ["unread-count"],
    queryFn: async () => {
      try {
        const res = await messagingService.getUnreadCount();
        return res ?? { unread_count: 0 };
      } catch (error) {
        console.error("Failed to fetch unread count:", error);
        return { unread_count: 0 };
      }
    },
    refetchInterval: 30000,
    retry: 1,
  });

  const navigation = getDynamicNavigation(userType, isClient, isProvider).map((item) => ({
    ...item,
    name: item.label || t(item.key),
  }));

  const bottomNavigation = bottomNavigationItems.map((item) => ({
    ...item,
    name: t(item.key),
  }));

  const activeClass = "bg-primary text-white shadow-inner";
  const inactiveClass = "text-gray-300 hover:bg-gray-700 hover:text-white";

  return (
    <aside className={cn(
      "flex flex-col bg-[#0d1420]/95 backdrop-blur-md text-white h-screen transition-all duration-300 border-r border-white/10 shadow-2xl shadow-black/40",
      collapsed ? "w-16" : "w-64",
      isRtl ? "rtl fixed inset-y-0 right-0" : "fixed inset-y-0 left-0"
    )}>
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-gray-700">
        <NavLink
          to={isClient() ? "/app/dashboard/client" : isProvider() ? "/app/dashboard/provider" : "/app"}
          className="flex items-center w-full gap-3"
        >
          <div className="h-11 w-11 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0">
            <span className="text-white font-bold text-lg">SH</span>
          </div>
          {!collapsed && (
            <span className="text-xl font-bold text-white tracking-tight">{t("common.websiteName", "ServiceHub")}</span>
          )}
        </NavLink>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-900/80">
        {navigation.map((item) => {
          const isActive = location.pathname.startsWith(item.href);
          const unreadCount = item.showBadge ? unreadData?.unread_count || 0 : 0;

          return (
            <NavLink
              key={item.name}
              to={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative",
                isActive ? activeClass : inactiveClass
              )}
              title={collapsed ? item.name : undefined} // tooltip for collapsed
            >
              <item.icon className={cn("h-5 w-5", collapsed && "mx-auto")} />
              {!collapsed && <span className="flex-1 truncate">{item.name}</span>}
              {item.showBadge && unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className={cn(
                    "h-5 min-w-5 flex items-center justify-center text-xs",
                    collapsed && `absolute -top-1 ${isRtl ? "-left-1" : "-right-1"}`
                  )}
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Badge>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Navigation */}
      <div className="px-2 py-4 border-t border-gray-700/70 bg-[#0c121d]/90 backdrop-blur">
        {bottomNavigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
              inactiveClass
            )}
            title={collapsed ? item.name : undefined}
          >
            <item.icon className={cn("h-5 w-5", collapsed && "mx-auto")} />
            {!collapsed && <span className="truncate">{item.name}</span>}
          </NavLink>
        ))}

        {/* Collapse Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="w-full mt-2 justify-center text-gray-300 hover:text-white hover:bg-gray-700 transition-colors rounded-md"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : (
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
