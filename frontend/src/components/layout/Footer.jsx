import * as React from "react"
import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"

function Footer({ className }) {
  const currentYear = new Date().getFullYear()

  return (
    <footer
      className={cn(
        "bg-white border-t py-4 px-4 text-center text-sm text-muted-foreground",
        className
      )}
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto">
        <p>© {currentYear} TenderPilot. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <Link to="/privacy" className="hover:text-foreground transition-colors">
            Privacy Policy
          </Link>
          <Link to="/terms" className="hover:text-foreground transition-colors">
            Terms of Service
          </Link>
          <Link to="/help" className="hover:text-foreground transition-colors">
            Help
          </Link>
        </div>
      </div>
    </footer>
  )
}

export { Footer }
