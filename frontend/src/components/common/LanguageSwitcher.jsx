import React from "react";
import i18n from "i18next";
import { Button } from "@/components/ui/Button";

const LanguageSwitcher = ({ className }) => {
  const changeLang = (lang) => {
    i18n.changeLanguage(lang);
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => changeLang("en")}
        aria-label="Switch to English"
      >
        EN
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => changeLang("ar")}
        aria-label="Switch to Arabic"
      >
        AR
      </Button>
    </div>
  );
};

export default LanguageSwitcher;
