import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';

const NotFoundPage = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#101825] px-4 text-white">
      <div className="max-w-2xl mx-auto text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <h1 className="text-6xl md:text-9xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            404
          </h1>
        </div>

        {/* Error Message */}
        <h2 className="text-2xl md:text-4xl font-bold mb-4">
          {t('errors.notFound.title')}
        </h2>
        <p className="text-base md:text-lg text-gray-400 mb-8 max-w-md mx-auto">
          {t('errors.notFound.message')}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Link to="/">
            <Button size="lg" className="gap-2 w-full sm:w-auto">
              <Home className="h-5 w-5" />
              {t('errors.notFound.goHome')}
            </Button>
          </Link>
          <Link to="/app/projects">
            <Button size="lg" variant="outline" className="gap-2">
              <Search className="h-5 w-5" />
              {t('errors.notFound.browseProjects')}
            </Button>
          </Link>
        </div>

        {/* Helpful Links */}
        <div className="mt-12 pt-8 border-t border-gray-700">
          <p className="text-sm text-gray-400 mb-4">
            {t('errors.notFound.lookingFor')}
          </p>
          <div className="flex flex-wrap gap-4 justify-center text-sm">
            <Link to="/app/services" className="text-primary hover:underline">
              {t('sidebar.services')}
            </Link>
            <Link to="/app/help" className="text-primary hover:underline">
              {t('sidebar.help')}
            </Link>
            <Link to="/app/messages" className="text-primary hover:underline">
              {t('sidebar.messages')}
            </Link>
            <Link to="/app/settings" className="text-primary hover:underline">
              {t('sidebar.settings')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
