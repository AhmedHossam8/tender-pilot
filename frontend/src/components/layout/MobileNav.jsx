import * as React from "react"
import { NavLink, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { getDynamicNavigation, bottomNavigationItems } from "./Sidebar"
import { useTranslation } from "react-i18next"
import { useAuthStore } from "@/contexts/authStore"

function MobileNav({ isOpen, onClose, className, isRtl = false }) {
  const location = useLocation()
  const { t } = useTranslation()
  const { userType, isClient, isProvider } = useAuthStore()

  const navigation = getDynamicNavigation(userType, isClient, isProvider).map(item => ({ 
    ...item, 
    name: item.label || t(item.key) 
  }))
  const bottomNavigation = bottomNavigationItems.map(item => ({ ...item, name: t(item.key) }))

  // Prevent body scroll when nav is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  // Handle backdrop click with proper event handling
  const handleBackdropClick = React.useCallback((e) => {
    // Only close if the target is the backdrop itself
    if (e.target === e.currentTarget) {
      e.preventDefault()
      e.stopPropagation()
      onClose()
    }
  }, [onClose])

  // Handle close button click
  const handleCloseClick = React.useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    onClose()
  }, [onClose])

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
      <aside
        className={cn(
          "fixed top-0 h-full w-64 bg-secondary text-secondary-foreground z-50",
          "transform transition-transform duration-300 ease-in-out",
          isRtl 
            ? "right-0" 
            : "left-0",
          isOpen 
            ? "translate-x-0" 
            : (isRtl ? "translate-x-full" : "-translate-x-full"),
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-secondary-foreground/10">
          <span className="text-xl font-bold text-white">{t('common.websiteName')}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCloseClick}
            className="text-secondary-foreground/70 hover:text-white min-h-[44px] min-w-[44px]"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-white"
                    : "text-secondary-foreground/70 hover:bg-secondary-foreground/10 hover:text-white"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </NavLink>
            )
          })}
        </nav>

        {/* Bottom Navigation */}
        <div className="absolute bottom-0 left-0 right-0 px-2 py-4 border-t border-secondary-foreground/10">
          {bottomNavigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                "text-secondary-foreground/70 hover:bg-secondary-foreground/10 hover:text-white"
              )}
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
