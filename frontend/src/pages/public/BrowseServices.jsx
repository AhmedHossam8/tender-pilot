import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, MapPin, DollarSign, Star, ArrowRight, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useAuthStore } from '@/contexts/authStore';
import api from '@/lib/api';

const BrowseServices = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: servicesData, isLoading, error } = useQuery({
    queryKey: ['public-services', searchQuery],
    queryFn: async () => {
      const params = searchQuery ? { search: searchQuery } : {};
      const response = await api.get('/services/services/', { params });
      return response.data;
    },
  });

  // Handle both paginated and non-paginated responses
  const services = Array.isArray(servicesData)
    ? servicesData
    : (servicesData?.results || []);

  const handleServiceClick = (serviceId) => {
    if (isAuthenticated) {
      navigate(`/app/services/${serviceId}`);
    } else {
      // Store intended destination and redirect to login
      sessionStorage.setItem('redirectAfterLogin', `/app/services/${serviceId}`);
      navigate('/login', { state: { message: t('auth.signInToViewServices') } });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]"></div>
        <div className="absolute top-0 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: '1s' }}
        ></div>
      </div>

      {/* Header */}
      <section className="relative py-20 overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-black mb-6">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                {t('public.browseServices.title')}
              </span>
            </h1>

            <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
              {t('public.browseServices.description')}
            </p>

            {/* Search */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
              <Input
                type="text"
                placeholder={t('public.browseServices.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-14 py-6 bg-white/5 backdrop-blur border border-white/10 rounded-xl text-white placeholder-slate-400 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 text-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16 relative z-10">
        <div className="container mx-auto px-4">
          {error ? (
            <div className="text-center py-20">
              <p className="text-red-400 mb-6 text-lg">{error.message}</p>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
          ) : isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-48 rounded-2xl bg-white/5 animate-pulse"
                ></div>
              ))}
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-slate-400 text-lg mb-6">
                {t('public.browseServices.noServices')}
              </p>
              <Link to="/register">
                <Button>{t('public.browseServices.beFirst')}</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
              {services.map((service) => (
                <div
                  key={service.id}
                  onClick={() => handleServiceClick(service.id)}
                  className="group relative bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-white/20 p-6 cursor-pointer transition-all hover:scale-[1.02] hover:bg-white/10"
                >
                  {/* Header */}
                  <div className="flex justify-between mb-4">
                    <h3 className="text-xl font-bold group-hover:text-blue-400 transition-colors">
                      {service.title}
                    </h3>
                    {service.average_rating && (
                      <div className="flex items-center gap-1 text-yellow-400">
                        <Star className="h-4 w-4 fill-yellow-400" />
                        <span className="font-semibold">
                          {service.average_rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>

                  <p className="text-slate-400 mb-6 line-clamp-3">
                    {service.description}
                  </p>

                  {/* Meta */}
                  <div className="flex items-center justify-between text-sm text-slate-300 mb-6">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-400" />
                      <span className="font-semibold">
                        ${service.base_price}
                      </span>
                    </div>
                    {service.delivery_time && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-400" />
                        <span>
                          {service.delivery_time} {t('public.browseServices.days')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  {service.provider_name && (
                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                      <span className="text-sm text-slate-400">
                        {t('public.browseServices.by')}{' '}
                        <span className="font-medium text-white">
                          {service.provider_name}
                        </span>
                      </span>
                      <ArrowRight className="h-4 w-4 text-blue-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                  )}

                  {!isAuthenticated && (
                    <p className="mt-4 text-xs text-slate-500 text-center">
                      {t('public.browseServices.signInToBook')}
                    </p>
                  )}

                  {/* Hover Glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity pointer-events-none" />
                </div>
              ))}
            </div>
          )}

          {/* CTA */}
          {!isAuthenticated && services.length > 0 && (
            <div className="mt-20 text-center bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 backdrop-blur rounded-2xl border border-white/10 p-12 max-w-4xl mx-auto">
              <h3 className="text-3xl font-bold mb-4">
                {t('public.browseServices.readyToStart')}
              </h3>
              <p className="text-slate-300 mb-8 max-w-2xl mx-auto">
                {t('public.browseServices.readyToStartDesc')}
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Link to="/register">
                  <Button size="lg">
                    {t('public.browseServices.createAccount')}
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline" className="text-black">
                    {t('public.browseServices.signIn')}
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );

};

export default BrowseServices;
