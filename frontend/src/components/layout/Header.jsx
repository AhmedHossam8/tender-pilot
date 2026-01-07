import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Bell, Search, Menu, User, LogOut, Settings, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useNotifications } from "@/hooks/useNotifications";

// Import your auth store
import { useAuthStore } from "@/contexts/authStore";

export function Header({ onMenuClick, className }) {
  const { t, i18n } = useTranslation();
  const [showDropdown, setShowDropdown] = React.useState(false);
  const dropdownRef = React.useRef(null);
  const navigate = useNavigate();

  const isArabic = i18n.language === "ar";

  const { user, logout } = useAuthStore();

  const {
    notifications,
    unreadCount,
    markRead,
    isLoading: notificationsLoading,
  } = useNotifications();
  const [showNotifications, setShowNotifications] = React.useState(false);
  const notificationsRef = React.useRef(null);
  // Logout
  const handleLogout = () => {
    logout();          // clears tokens + state
    navigate("/login", { replace: true });
  };

  // Close dropdown on outside click
  React.useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  React.useEffect(() => {
    function handleClickOutside(event) {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleLanguage = () => {
    i18n.changeLanguage(isArabic ? "en" : "ar");
  };

  return (
    <header className={cn("flex items-center justify-between h-16 px-4 bg-white border-b", className)}>
      {/* Left: menu + search */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onMenuClick} className="lg:hidden">
          <Menu className="h-5 w-5" />
        </Button>

        {/* Search */}
        <div className="hidden md:flex items-center">
          <div className="relative">
            <Search
              className={cn(
                "absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground",
                isArabic ? "right-3" : "left-3"
              )}
            />
            <Input
              type="search"
              placeholder={t("common.search")}
              className={cn("w-64 lg:w-80", isArabic ? "pr-9 text-right" : "pl-9")}
            />
          </div>
        </div>
      </div>

      {/* Right: language, notifications, user */}
      <div className="flex items-center gap-2">
        {/* Language */}
        <Button variant="ghost" size="sm" onClick={toggleLanguage}>
          {isArabic ? "English" : "العربية"}
        </Button>

        {/* Notifications */}
        <div className="relative" ref={notificationsRef}>
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => setShowNotifications((prev) => !prev)}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 text-[10px]
                       flex items-center justify-center rounded-full bg-destructive text-white">
                {unreadCount}
              </span>
            )}
          </Button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border rounded-md shadow-lg z-50">
              <div className="px-4 py-2 border-b font-medium text-sm">
                Notifications
              </div>

              <div className="max-h-96 overflow-y-auto">
                {notificationsLoading ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Loading...
                  </div>
                ) : !notifications || notifications.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No notifications
                  </div>
                ) : (
                  notifications.slice(0, 5).map((n) => (
                    <button
                      key={n.id}
                      className={cn(
                        "w-full text-left px-4 py-3 text-sm border-b hover:bg-muted transition",
                        !n.is_read && "bg-muted/50"
                      )}
                      onClick={() => {
                        if (!n.is_read) markRead.mutate(n.id);
                        setShowNotifications(false);
                        if (n.link) navigate(n.link);
                      }}
                    >
                      <p className="font-medium">{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {n.message}
                      </p>
                    </button>
                  ))
                )}
              </div>

              <div className="p-2 text-center">
                <Link
                  to="/notifications"
                  className="text-sm text-primary hover:underline"
                  onClick={() => setShowNotifications(false)}
                >
                  View all notifications
                </Link>
              </div>
            </div>
          )}
        </div>


        {/* User dropdown */}
        <div className="relative" ref={dropdownRef}>
          <Button
            variant="ghost"
            className="flex items-center gap-2"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-medium">
              {user?.full_name?.charAt(0) || "U"}
            </div>
            <span className="hidden md:inline-block text-sm font-medium">
              {user?.full_name || t("common.user")}
            </span>
            <ChevronDown className="h-4 w-4" />
          </Button>

          {showDropdown && (
            <div className="absolute right-0 top-full mt-2 w-48 rounded-md bg-white shadow-lg border py-1 z-50">
              {/* User info */}
              <div className="px-4 py-2 border-b">
                <p className="text-sm font-medium">{user?.full_name || t("common.user")}</p>
                <p className="text-xs text-muted-foreground">{user?.email || ""}</p>
              </div>

              {/* Profile link */}
              <Link
                to="/profile"
                className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted transition-colors"
                onClick={() => setShowDropdown(false)}
              >
                <User className="h-4 w-4" />
                {t("common.profile")}
              </Link>

              {/* Settings link */}
              <Link
                to="/settings"
                className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted transition-colors"
                onClick={() => setShowDropdown(false)}
              >
                <Settings className="h-4 w-4" />
                {t("common.settings")}
              </Link>

              {/* Logout */}
              <button
                className="flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-muted transition-colors w-full"
                onClick={async () => {
                  setShowDropdown(false);
                  handleLogout();
                }}
              >
                <LogOut className="h-4 w-4" />
                {t("auth.logout")}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
