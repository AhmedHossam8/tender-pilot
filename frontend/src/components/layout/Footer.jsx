import * as React from "react"
import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"

function Footer({ className, websiteName = "TenderPilot" }) {
  const { t } = useTranslation()
  const currentYear = new Date().getFullYear()

  return (
    <footer
      className={cn(
        "bg-white border-t py-4 px-4 text-center text-sm text-muted-foreground",
        className
      )}
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto">
        <p>
          © {currentYear} {websiteName}. {t("footer.rightsReserved")}
        </p>
        <div className="flex items-center gap-4">
          <Link to="/privacy" className="hover:text-foreground transition-colors">
            {t("footer.privacyPolicy")}
          </Link>
          <Link to="/terms" className="hover:text-foreground transition-colors">
            {t("footer.termsOfService")}
          </Link>
          <Link to="/help" className="hover:text-foreground transition-colors">
            {t("footer.help")}
          </Link>
        </div>
      </div>
    </footer>
  )
}

export { Footer }
