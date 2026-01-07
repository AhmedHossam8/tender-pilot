import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Bell, Menu, User, LogOut, Settings, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";
import SearchBar from "@/components/search/SearchBar";

// Import your auth store
import { useAuthStore } from "@/contexts/authStore";

export function Header({ onMenuClick, className }) {
  const { t, i18n } = useTranslation();
  const [showDropdown, setShowDropdown] = React.useState(false);
  const dropdownRef = React.useRef(null);
  const navigate = useNavigate();

  const isArabic = i18n.language === "ar";

  const { user, logout } = useAuthStore();

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

  const toggleLanguage = () => {
    i18n.changeLanguage(isArabic ? "en" : "ar");
  };

  return (
    <header className={cn("flex items-center justify-between h-16 px-4 bg-white border-b", className)}>
      {/* Left: menu + search */}
      <div className="flex items-center gap-4 flex-1">
        <Button variant="ghost" size="icon" onClick={onMenuClick} className="lg:hidden">
          <Menu className="h-5 w-5" />
        </Button>

        {/* Search Bar */}
        <div className="hidden md:block flex-1 max-w-2xl">
          <SearchBar />
        </div>
      </div>

      {/* Right: language, notifications, user */}
      <div className="flex items-center gap-2">
        {/* Language */}
        <Button variant="ghost" size="sm" onClick={toggleLanguage}>
          {isArabic ? "English" : "العربية"}
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
        </Button>

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
