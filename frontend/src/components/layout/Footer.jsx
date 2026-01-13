import * as React from "react"
import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"

function Footer({ className, websiteName }) {
  const { t } = useTranslation()
  const currentYear = new Date().getFullYear()
  const brand = websiteName || t("common.websiteName", "ServiceHub")

  return (
    <footer className={cn(
      "bg-[#101825] text-white border-t border-gray-800 py-6 px-4",
      className
    )}>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 max-w-7xl mx-auto">
        <p className="text-sm sm:text-base">
          © {currentYear} <span className="font-semibold">{brand}</span>. {t("footer.rightsReserved")}
        </p>
        <div className="flex items-center gap-4">
          <Link to="/privacy" className="text-gray-300 hover:text-white transition-colors">{t("footer.privacyPolicy")}</Link>
          <Link to="/terms" className="text-gray-300 hover:text-white transition-colors">{t("footer.termsOfService")}</Link>
          <Link to="/help" className="text-gray-300 hover:text-white transition-colors">{t("footer.help")}</Link>
        </div>
      </div>
    </footer>
  )
}

export { Footer }
