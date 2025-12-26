import i18n from "i18next";

const LanguageSwitcher = () => {
  const changeLang = (lang) => {
    i18n.changeLanguage(lang);
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  };

  return (
    <div className="flex gap-2">
      <button onClick={() => changeLang("en")}>EN</button>
      <button onClick={() => changeLang("ar")}>AR</button>
    </div>
  );
};

export default LanguageSwitcher;
