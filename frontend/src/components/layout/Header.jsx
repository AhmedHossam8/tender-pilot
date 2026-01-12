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

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  React.useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showDropdown]);

  const toggleLanguage = () => {
    i18n.changeLanguage(isArabic ? "en" : "ar");
  };

  return (
    <header
      className={cn(
        "flex items-center justify-between h-16 px-4 bg-white border-b shadow-sm",
        className
      )}
    >
      {/* Left: menu + search */}
      <div className="flex items-center gap-4 flex-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onMenuClick();
          }}
          className="lg:hidden min-h-[44px] min-w-[44px] touch-manipulation hover:bg-gray-100 transition-colors rounded-md"
          type="button"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Search Bar */}
        <div className="hidden md:block flex-1 max-w-2xl">
          <SearchBar />
        </div>
      </div>

      {/* Right: language, notifications, user */}
      <div className="flex items-center gap-3">
        {/* Language */}
        <Button
          variant="ghost"
          size="sm"
          className="hover:bg-gray-100 transition-colors rounded-md"
          onClick={toggleLanguage}
        >
          {isArabic ? "English" : "العربية"}
        </Button>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-gray-100 transition-colors rounded-md"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 ring-1 ring-white" />
        </Button>

        {/* User dropdown */}
        <div className="relative" ref={dropdownRef}>
          <Button
            variant="ghost"
            className="flex items-center gap-2 hover:bg-gray-100 transition-colors rounded-md"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-medium">
              {user?.full_name?.charAt(0) || "U"}
            </div>
            <span className="hidden md:inline-block text-sm font-medium truncate max-w-[120px]">
              {user?.full_name || t("common.user")}
            </span>
            <ChevronDown className="h-4 w-4" />
          </Button>

          {showDropdown && (
            <div className="absolute right-0 top-full mt-2 w-52 rounded-lg bg-white shadow-lg border py-1 z-50 overflow-hidden">
              {/* User info */}
              <div className="px-4 py-3 border-b bg-gray-50">
                <p className="text-sm font-semibold truncate">{user?.full_name || t("common.user")}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email || ""}</p>
              </div>

              {/* Profile link */}
              <Link
                to="/app/profile/edit"
                className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                onClick={() => setShowDropdown(false)}
              >
                <User className="h-4 w-4" />
                {t("common.profile")}
              </Link>

              {/* Settings link */}
              <Link
                to="/app/settings"
                className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                onClick={() => setShowDropdown(false)}
              >
                <Settings className="h-4 w-4" />
                {t("common.settings")}
              </Link>

              {/* Logout */}
              <button
                className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-100 transition-colors w-full"
                onClick={() => {
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
