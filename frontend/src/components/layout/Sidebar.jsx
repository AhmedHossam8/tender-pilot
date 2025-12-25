import * as React from "react"
import { NavLink, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
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
} from "lucide-react"
import { Button } from "@/components/ui/Button"

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Tenders", href: "/tenders", icon: FileText },
  { name: "Proposals", href: "/proposals", icon: FolderOpen },
  { name: "Documents", href: "/documents", icon: Building2 },
  { name: "Team", href: "/team", icon: Users },
  { name: "Settings", href: "/settings", icon: Settings },
]

const bottomNavigation = [
  { name: "Help & Support", href: "/help", icon: HelpCircle },
]

function Sidebar({ collapsed, onToggleCollapse, className }) {
  const location = useLocation()

  return (
    <aside
      className={cn(
        "flex flex-col bg-secondary text-secondary-foreground h-screen transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-secondary-foreground/10">
        {!collapsed && (
          <span className="text-xl font-bold text-white">TenderPilot</span>
        )}
        {collapsed && (
          <span className="text-xl font-bold text-white mx-auto">TP</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href
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
          )
        })}
      </nav>

      {/* Bottom Navigation */}
      <div className="px-2 py-4 border-t border-secondary-foreground/10">
        {bottomNavigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
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
              <span>Collapse</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  )
}

export { Sidebar, navigation, bottomNavigation }
