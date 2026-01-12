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
        "bg-white border-t py-6 px-4",
        className
      )}
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 max-w-7xl mx-auto">
        <p className="text-sm sm:text-base">
          © {currentYear} <span className="font-semibold">{websiteName}</span>. {t("footer.rightsReserved")}
        </p>
        <div className="flex items-center gap-4">
          <Link
            to="/privacy"
            className="text-gray-200 hover:text-white transition-colors"
          >
            {t("footer.privacyPolicy")}
          </Link>
          <Link
            to="/terms"
            className="text-gray-200 hover:text-white transition-colors"
          >
            {t("footer.termsOfService")}
          </Link>
          <Link
            to="/help"
            className="text-gray-200 hover:text-white transition-colors"
          >
            {t("footer.help")}
          </Link>
        </div>
      </div>
    </footer>
  )
}

export { Footer }
