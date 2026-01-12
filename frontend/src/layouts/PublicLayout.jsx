import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Menu, X, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/contexts/authStore';

const PublicLayout = () => {
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated, user } = useAuthStore();

  // Handle hash navigation
  useEffect(() => {
    if (location.hash) {
      const element = document.querySelector(location.hash);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  }, [location]);

  const navigation = [
    { name: t('navigation.home'), href: '/' },
    { name: t('navigation.browseServices'), href: '/browse/services' },
    { name: t('navigation.browseProjects'), href: '/browse/projects' },
    { name: t('navigation.about'), href: '/#about' },
  ];

  const isActive = (href) => {
    if (href.startsWith('#')) return false;
    return location.pathname === href;
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {t('common.websiteName')}
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    isActive(item.href) ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Auth Buttons - Desktop */}
            <div className="hidden md:flex items-center gap-4">
              {isAuthenticated ? (
                <>
                  <Link to="/app">
                    <Button variant="ghost">{t('navigation.dashboard')}</Button>
                  </Link>
                  <Link to="/app/profile/edit">
                    <Button className="gap-2">
                      <User className="h-4 w-4" />
                      {user?.username || t('common.profile')}
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="ghost">{t('auth.signIn')}</Button>
                  </Link>
                  <Link to="/register">
                    <Button>{t('auth.getStarted')}</Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden"
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
          <div className="md:hidden border-t border-border">
            <div className="px-4 py-4 space-y-3">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "block px-3 py-2 rounded-md text-base font-medium transition-colors",
                    isActive(item.href)
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className="pt-4 flex flex-col gap-2">
                {isAuthenticated ? (
                  <>
                    <Link to="/app" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full">{t('navigation.dashboard')}</Button>
                    </Link>
                    <Link to="/app/profile/edit" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full gap-2">
                        <User className="h-4 w-4" />
                        {user?.username || t('common.profile')}
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full">{t('auth.signIn')}</Button>
                    </Link>
                    <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full">{t('auth.getStarted')}</Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-secondary/30 border-t border-border mt-auto">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold">ServiceHub</h3>
              <p className="text-sm text-muted-foreground">
                {t('footer.tagline')}
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold mb-4">{t('footer.quickLinks')}</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/#about" className="text-muted-foreground hover:text-primary">{t('footer.aboutUs')}</Link></li>
                <li><Link to="/#features" className="text-muted-foreground hover:text-primary">{t('footer.features')}</Link></li>
                <li><Link to="/#how-it-works" className="text-muted-foreground hover:text-primary">{t('footer.howItWorks')}</Link></li>
              </ul>
            </div>

            {/* For Users */}
            <div>
              <h4 className="font-semibold mb-4">{t('footer.forUsers')}</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/login" className="text-muted-foreground hover:text-primary">{t('auth.signIn')}</Link></li>
                <li><Link to="/register" className="text-muted-foreground hover:text-primary">{t('auth.register')}</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold mb-4">{t('footer.legal')}</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-muted-foreground hover:text-primary">{t('footer.privacyPolicy')}</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary">{t('footer.termsOfService')}</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary">{t('footer.cookiePolicy')}</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>{t('footer.copyright', { year: new Date().getFullYear() })}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
