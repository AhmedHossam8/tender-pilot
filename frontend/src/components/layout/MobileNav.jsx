import * as React from "react"
import { NavLink } from "react-router-dom"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { getDynamicNavigation, bottomNavigationItems } from "./Sidebar"
import { useTranslation } from "react-i18next"
import { useAuthStore } from "@/contexts/authStore"

function MobileNav({ isOpen, onClose, className, isRtl = false }) {
  const { t } = useTranslation()
  const { userType, isClient, isProvider } = useAuthStore()

  const navigation = getDynamicNavigation(userType, isClient, isProvider).map(item => ({
    ...item,
    name: item.label || t(item.key)
  }))
  const bottomNavigation = bottomNavigationItems.map(item => ({ ...item, name: t(item.key) }))

  // Prevent body scroll
  React.useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [isOpen])

  // Close on Escape key
  React.useEffect(() => {
    const handleEsc = (e) => { if (e.key === "Escape") onClose() }
    if (isOpen) window.addEventListener("keydown", handleEsc)
    return () => window.removeEventListener("keydown", handleEsc)
  }, [isOpen, onClose])

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className="lg:hidden">
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={handleBackdropClick}
          onTouchStart={handleBackdropClick}
        />
      )}

      {/* Slide-out nav */}
      <aside className={cn(
        "fixed top-0 h-full w-64 bg-[#101825] text-white z-50 transform transition-transform duration-300 ease-in-out",
        isRtl ? "right-0" : "left-0",
        isOpen ? "translate-x-0" : (isRtl ? "translate-x-full" : "-translate-x-full"),
        className
      )}>
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-white/10">
          <span className="text-xl font-bold">TenderPilot</span>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("common.close")}
            onClick={onClose}
            className="text-white/70 hover:text-white min-h-[44px] min-w-[44px]"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav role="navigation" className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={onClose}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom Navigation */}
        <div className="absolute bottom-0 left-0 right-0 px-2 py-4 border-t border-white/10">
          {bottomNavigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </div>
      </aside>
    </div>
  )
}

export { MobileNav }
