import * as React from "react"
import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"
import {
  Bell,
  Search,
  Menu,
  User,
  LogOut,
  Settings,
  ChevronDown,
} from "lucide-react"

import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"

function Header({ onMenuClick, user, className }) {
  const { t, i18n } = useTranslation()

  const [showDropdown, setShowDropdown] = React.useState(false)
  const dropdownRef = React.useRef(null)

  const isArabic = i18n.language === "ar"

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const toggleLanguage = () => {
    i18n.changeLanguage(isArabic ? "en" : "ar")
  }

  return (
    <header
      className={cn(
        "flex items-center justify-between h-16 px-4 bg-white border-b",
        className
      )}
    >
      {/* Left side */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="lg:hidden"
        >
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
              className={cn(
                "w-64 lg:w-80",
                isArabic ? "pr-9 text-right" : "pl-9"
              )}
            />
          </div>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Language Switch */}
        <Button variant="ghost" size="sm" onClick={toggleLanguage}>
          {isArabic ? "English" : "العربية"}
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
        </Button>

        {/* User Menu */}
        <div className="relative" ref={dropdownRef}>
          <Button
            variant="ghost"
            className="flex items-center gap-2"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-medium">
              {user?.name?.charAt(0) || "U"}
            </div>
            <span className="hidden md:inline-block text-sm font-medium">
              {user?.name || t("common.user")}
            </span>
            <ChevronDown className="h-4 w-4" />
          </Button>

          {showDropdown && (
            <div className="absolute right-0 top-full mt-2 w-48 rounded-md bg-white shadow-lg border py-1 z-50">
              <div className="px-4 py-2 border-b">
                <p className="text-sm font-medium">
                  {user?.name || t("common.user")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {user?.email || "user@example.com"}
                </p>
              </div>

              <Link
                to="/profile"
                className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted transition-colors"
                onClick={() => setShowDropdown(false)}
              >
                <User className="h-4 w-4" />
                {t("common.profile")}
              </Link>

              <Link
                to="/settings"
                className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted transition-colors"
                onClick={() => setShowDropdown(false)}
              >
                <Settings className="h-4 w-4" />
                {t("common.settings")}
              </Link>

              <button
                className="flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-muted transition-colors w-full"
                onClick={() => {
                  setShowDropdown(false)
                  // logout later
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
  )
}

export { Header }
