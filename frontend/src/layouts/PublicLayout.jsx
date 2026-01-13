import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { Outlet } from "react-router-dom";
import { useNavigate, useLocation } from "react-router-dom";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import { useTranslation } from 'react-i18next';

const PublicLayout = () => {
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigation = [
    { name: t('navigation.home'), path: "/" },
    { name: t('navigation.browseServices'), path: "/browse/services" },
    { name: t('navigation.browseProjects'), path: "/browse/projects" },
    { name: t('navigation.features'), path: "/", scrollTo: "features" },
  ];

  const navigate = useNavigate();
  const location = useLocation();

  const handleNavClick = (item) => {
    // HOME BUTTON
    if (item.name === "Home") {
      if (location.pathname !== "/") {
        navigate("/");
      }

      // scroll to top
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });

      setMobileMenuOpen(false);
      return;
    }

    // SECTION SCROLL (Features, About, etc.)
    if (item.scrollTo) {
      navigate(item.path);

      requestAnimationFrame(() => {
        const el = document.getElementById(item.scrollTo);
        el?.scrollIntoView({ behavior: "smooth", block: "start" });
      });

      setMobileMenuOpen(false);
      return;
    }

    // NORMAL ROUTE
    navigate(item.path);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]"></div>
        <div className="absolute top-0 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Navigation */}
      <nav className={`sticky top-0 z-50 transition-all duration-300 ${scrolled
        ? 'bg-slate-950/80 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-blue-500/5'
        : 'bg-transparent border-b border-white/5'
        }`}>
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <a href="/" className="flex items-center group">
              <span className="text-3xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent group-hover:scale-105 transition-transform">
                {t('common.websiteName')}
              </span>
            </a>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navigation.map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleNavClick(item)}
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                >
                  {item.name}
                </button>
              ))}
            </div>

            {/* Auth Buttons - Desktop */}
            <div className="hidden md:flex items-center gap-3">
              <LanguageSwitcher />
              <a href="/login">
                <button className="px-5 py-2.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                  {t('auth.signIn')}
                </button>
              </a>
              <a href="/register">
                <button className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-lg font-semibold text-sm transition-all hover:scale-105 hover:shadow-lg hover:shadow-blue-500/50">
                  {t('auth.getStarted')}
                </button>
              </a>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 hover:bg-white/5 rounded-lg transition-all"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 bg-slate-950/95 backdrop-blur-xl">
            <div className="px-4 py-6 space-y-2">
              {navigation.map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleNavClick(item)}
                  className="block w-full text-left px-4 py-3 rounded-lg text-base font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-all"
                >
                  {item.name}
                </button>
              ))}
              <div className="pt-4 flex flex-col gap-2">
                <LanguageSwitcher />
                <a href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <button className="w-full px-4 py-3 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                    {t('auth.signIn')}
                  </button>
                </a>
                <a href="/register" onClick={() => setMobileMenuOpen(false)}>
                  <button className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-semibold text-sm transition-all hover:scale-105">
                    {t('auth.getStarted')}
                  </button>
                </a>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-1 relative z-10">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="relative z-10 bg-black/40 backdrop-blur-sm border-t border-white/10 mt-auto">
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
            {/* Brand */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-3xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {t('common.websiteName')}
              </h3>
              <p className="text-slate-400 leading-relaxed max-w-md">
                {t('footer.tagline')}
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-bold text-lg mb-6 text-white">{t('footer.platform')}</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="/#features" className="text-slate-400 hover:text-white transition-colors hover:translate-x-1 inline-block">{t('footer.features')}</a></li>
                <li><a href="/#how-it-works" className="text-slate-400 hover:text-white transition-colors hover:translate-x-1 inline-block">{t('footer.howItWorks')}</a></li>
              </ul>
            </div>

            {/* For Users */}
            <div>
              <h4 className="font-bold text-lg mb-6 text-white">{t('footer.forUsers')}</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="/browse/services" className="text-slate-400 hover:text-white transition-colors hover:translate-x-1 inline-block">{t('navigation.browseServices')}</a></li>
                <li><a href="/browse/projects" className="text-slate-400 hover:text-white transition-colors hover:translate-x-1 inline-block">{t('navigation.browseProjects')}</a></li>
                <li><a href="/login" className="text-slate-400 hover:text-white transition-colors hover:translate-x-1 inline-block">{t('auth.signIn')}</a></li>
                <li><a href="/register" className="text-slate-400 hover:text-white transition-colors hover:translate-x-1 inline-block">{t('auth.register')}</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-bold text-lg mb-6 text-white">{t('footer.legal')}</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors hover:translate-x-1 inline-block">{t('footer.privacyPolicy')}</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors hover:translate-x-1 inline-block">{t('footer.termsOfService')}</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors hover:translate-x-1 inline-block">{t('footer.cookiePolicy')}</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors hover:translate-x-1 inline-block">{t('footer.gdpr')}</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-400">
              {t('footer.copyright', { year: new Date().getFullYear() })}
            </p>
            <div className="flex items-center gap-6 text-sm text-slate-400">
              <a href="#" className="hover:text-white transition-colors">{t('footer.status')}</a>
              <a href="#" className="hover:text-white transition-colors">{t('footer.support')}</a>
              <a href="#" className="hover:text-white transition-colors">{t('footer.documentation')}</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;

<style>{`
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
`}</style>