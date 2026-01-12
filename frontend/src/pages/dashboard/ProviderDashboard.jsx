import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../contexts/authStore';
import DashboardCard from '../../components/dashboard/DashboardCard';
import SkillBadge from '../../components/profile/SkillBadge';
import { toast } from 'sonner';
import { serviceService } from '../../services/services.service';
import bidService from '../../services/bid.service';
import { usePersonalizedRecommendations, useTrendingOpportunities } from '../../hooks/useRecommendations';
import { Sparkles, TrendingUp, RefreshCw } from 'lucide-react';
import { RecommendationSkeleton } from '../../components/common/LoadingSkeleton';
import { Button } from '@/components/ui';

/**
 * ProviderDashboard
 * Dashboard for service providers showing their services, bids, and earnings
 */
const ProviderDashboard = () => {
  const { t } = useTranslation();
  const { user, profile } = useAuthStore();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeServices: 0,
    totalServices: 0,
    activeBids: 0,
    totalBids: 0,
    acceptedBids: 0,
    completedProjects: 0,
    totalEarnings: 0,
    averageRating: 0,
  });

  // Fetch AI recommendations
  const { data: recommendations, isLoading: recommendationsLoading, refetch: refetchRecommendations } = usePersonalizedRecommendations({ limit: 5 });
  const { data: trending, isLoading: trendingLoading, refetch: refetchTrending } = useTrendingOpportunities({ limit: 3 });

  // Handler for refreshing recommendations
  const handleRefreshRecommendations = async () => {
    toast.info('Refreshing recommendations...');
    await refetchRecommendations();
    toast.success('Recommendations updated');
  };

  // Handler for refreshing trending opportunities
  const handleRefreshTrending = async () => {
    toast.info('Refreshing trending opportunities...');
    await refetchTrending();
    toast.success('Trending opportunities updated');
  };

  // Fetch services
  const { data: servicesData, isLoading: servicesLoading } = useQuery({
    queryKey: ['my-services'],
    queryFn: async () => {
      const response = await serviceService.getAll();
      return response.data?.results || response.data || [];
    },
    onError: (error) => {
      console.error('Error loading services:', error);
    },
  });

  // Fetch bids - get only sent bids for provider
  const { data: bidsData, isLoading: bidsLoading } = useQuery({
    queryKey: ['my-bids'],
    queryFn: async () => {
      const response = await bidService.getBids({ type: 'sent' });
      return response.data?.results || response.data || [];
    },
    onError: (error) => {
      console.error('Error loading bids:', error);
    },
  });

  useEffect(() => {
    if (servicesData && bidsData) {
      const services = servicesData || [];
      const bids = bidsData || [];
      
      setStats({
        activeServices: services.filter(s => s.is_active).length,
        totalServices: services.length,
        activeBids: bids.filter(b => b.status === 'pending').length,
        totalBids: bids.length,
        acceptedBids: bids.filter(b => b.status === 'accepted').length,
        completedProjects: 0, // TODO: Get from projects API
        totalEarnings: 0, // TODO: Calculate from completed projects
        averageRating: profile?.average_rating || 0,
      });
      setLoading(false);
    }
  }, [servicesData, bidsData, profile]);

  const recentServices = servicesData?.slice(0, 3) || [];
  const recentBids = bidsData?.slice(0, 3) || [];

  if (loading || servicesLoading || bidsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  const profileCompleteness = profile?.ai_profile_score || 0;
  const needsProfileUpdate = profileCompleteness < 70;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t('dashboard.provider.title')}
        </h1>
        <p className="text-gray-600">
          {t('dashboard.provider.welcome', { name: user?.full_name || t('common.provider') })}
        </p>
      </div>

      {/* Profile Completeness Alert */}
      {needsProfileUpdate && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm text-yellow-700">
                {t('dashboard.provider.profileIncomplete', { percentage: profileCompleteness })}
              </p>
              <div className="mt-2">
                <Link
                  to="/app/settings"
                  className="text-sm font-medium text-yellow-700 underline hover:text-yellow-600"
                >
                  {t('dashboard.provider.updateProfile')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <DashboardCard
          title={t('dashboard.provider.activeServices')}
          value={stats.activeServices}
          subtitle={t('dashboard.provider.currentlyListed')}
          color="blue"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          }
        />

        <DashboardCard
          title={t('dashboard.provider.activeBids')}
          value={stats.activeBids}
          subtitle={t('dashboard.provider.pendingReview')}
          color="yellow"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        <DashboardCard
          title={t('dashboard.provider.acceptedBids')}
          value={stats.acceptedBids}
          subtitle={t('dashboard.provider.wonProjects')}
          color="green"
          trend="+12% this month"
          trendDirection="up"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        <DashboardCard
          title={t('dashboard.provider.totalEarnings')}
          value={`$${stats.totalEarnings.toLocaleString()}`}
          subtitle={t('dashboard.provider.lifetimeRevenue')}
          color="green"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        <DashboardCard
          title={t('dashboard.provider.completedProjects')}
          value={stats.completedProjects}
          subtitle={t('dashboard.provider.successfullyDelivered')}
          color="indigo"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          }
        />

        <DashboardCard
          title={t('dashboard.provider.totalBids')}
          value={stats.totalBids}
          subtitle={t('dashboard.provider.allTime')}
          color="purple"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />

        <DashboardCard
          title={t('dashboard.provider.averageRating')}
          value={stats.averageRating.toFixed(1)}
          subtitle={t('dashboard.provider.outOfFive')}
          color="yellow"
          icon={
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          }
        />

        <DashboardCard
          title={t('dashboard.provider.profileScore')}
          value={`${profileCompleteness}%`}
          subtitle={t('dashboard.provider.completeness')}
          color={profileCompleteness >= 80 ? 'green' : profileCompleteness >= 50 ? 'yellow' : 'red'}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">{t('dashboard.provider.quickActions')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link
            to="/app/services"
            className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <div className="text-center">
              <div className="font-semibold text-gray-900">{t('dashboard.provider.addService')}</div>
              <div className="text-xs text-gray-600">{t('dashboard.provider.createNewListing')}</div>
            </div>
          </Link>

          <Link
            to="/app/projects"
            className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <div className="text-center">
              <div className="font-semibold text-gray-900">{t('dashboard.provider.findProjects')}</div>
              <div className="text-xs text-gray-600">{t('dashboard.provider.browseAndBid')}</div>
            </div>
          </Link>

          <Link
            to="/app/bids"
            className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div className="text-center">
              <div className="font-semibold text-gray-900">{t('dashboard.provider.myBids')}</div>
              <div className="text-xs text-gray-600">{t('dashboard.provider.trackSubmissions')}</div>
            </div>
          </Link>

          <Link
            to="/app/settings"
            className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <div className="text-center">
              <div className="font-semibold text-gray-900">{t('dashboard.provider.editProfile')}</div>
              <div className="text-xs text-gray-600">{t('dashboard.provider.updateSkills')}</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Profile Skills */}
      {profile?.skills && profile.skills.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{t('dashboard.provider.yourSkills')}</h2>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill) => (
              <SkillBadge key={skill.id} skill={skill} />
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Services */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">{t('dashboard.provider.myServices')}</h2>
            <Link to="/app/services" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              {t('common.viewAll')}
            </Link>
          </div>
          
          {recentServices.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-500 mb-2">{t('dashboard.provider.noServicesYet')}</p>
              <Link to="/app/services" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                {t('dashboard.provider.createFirstService')}
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentServices.map((service) => (
                <Link
                  key={service.id}
                  to={`/app/services/${service.id}`}
                  className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900">{service.name}</h3>
                    <span className="text-sm font-bold text-gray-900">
                      {service.packages?.[0]?.price ? `$${service.packages[0].price}` : 'N/A'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{service.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{service.packages?.length || 0} {t('dashboard.provider.packages')}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      service.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {service.is_active ? t('common.active') : t('common.inactive')}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* AI Recommended Projects */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <Sparkles className="mr-2 h-5 w-5 text-purple-500" />
              {t('dashboard.provider.recommendedForYou')}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefreshRecommendations}
              disabled={recommendationsLoading}
              className="flex items-center gap-1"
            >
              <RefreshCw className={`h-4 w-4 ${recommendationsLoading ? 'animate-spin' : ''}`} />
              <span className="text-sm">Refresh</span>
            </Button>
          </div>
          
          {recommendationsLoading ? (
            <RecommendationSkeleton count={3} />
          ) : recommendations?.recommendations?.length > 0 ? (
            <div className="space-y-3">
              {recommendations.recommendations.map((rec) => (
                <Link
                  key={rec.project.id}
                  to={`/app/projects/${rec.project.id}`}
                  className="block p-4 border-l-4 border-purple-400 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900">{rec.project.title}</h3>
                    <span className="text-sm font-bold text-purple-600">
                      {(rec.match_score * 100).toFixed(0)}% {t('dashboard.provider.match')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{rec.project.description}</p>
                  <div className="flex items-center gap-4 mt-2">
                    {rec.project.budget_min && rec.project.budget_max && (
                      <span className="text-sm text-green-600 font-medium">
                        ${rec.project.budget_min} - ${rec.project.budget_max}
                      </span>
                    )}
                    {rec.matching_skills?.length > 0 && (
                      <span className="text-xs text-gray-500">
                        {rec.matching_skills.slice(0, 3).join(', ')}
                      </span>
                    )}
                  </div>
                  {rec.reasoning && (
                    <p className="text-xs text-gray-500 mt-2 italic">{rec.reasoning}</p>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">{t('dashboard.provider.noRecommendations')}</p>
              <p className="text-sm text-gray-400 mt-1">{t('dashboard.provider.completeProfileForMatches')}</p>
            </div>
          )}
        </div>

        {/* Trending Opportunities */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <TrendingUp className="mr-2 h-5 w-5 text-orange-500" />
              {t('dashboard.provider.trendingOpportunities')}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefreshTrending}
              disabled={trendingLoading}
              className="flex items-center gap-1"
            >
              <RefreshCw className={`h-4 w-4 ${trendingLoading ? 'animate-spin' : ''}`} />
              <span className="text-sm">{t('common.refresh')}</span>
            </Button>
          </div>
          
          {trendingLoading ? (
            <RecommendationSkeleton count={3} />
          ) : trending?.trending?.length > 0 ? (
            <div className="space-y-3">
              {trending.trending.map((item) => (
                <Link
                  key={item.project.id}
                  to={`/app/projects/${item.project.id}`}
                  className="block p-4 border border-orange-200 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900">{item.project.title}</h3>
                    <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-800">
                      🔥 Trending
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{item.project.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span className="text-gray-500">👁️ {item.view_count} views</span>
                    <span className="text-gray-500">📝 {item.bid_count} bids</span>
                    {item.average_bid && (
                      <span className="text-green-600 font-medium">
                        {t('dashboard.provider.avgBid')}: ${item.average_bid}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">{t('dashboard.provider.noTrendingProjects')}</p>
            </div>
          )}
        </div>

        {/* Recent Bids */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">{t('dashboard.provider.recentBids')}</h2>
            <Link to="/app/bids" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              {t('common.viewAll')}
            </Link>
          </div>
          
          {recentBids.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500 mb-2">{t('dashboard.provider.noBidsYet')}</p>
              <Link to="/app/projects" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                {t('dashboard.provider.browseProjects')}
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentBids.map((bid) => (
                <Link
                  key={bid.id}
                  to={`/app/bids/${bid.id}`}
                  className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900">{bid.project_title || t('common.project')}</h3>
                    <span className="text-sm font-bold text-gray-900">${bid.proposed_amount}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{bid.cover_letter}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {new Date(bid.created_at).toLocaleDateString()}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      bid.status === 'accepted' ? 'bg-green-100 text-green-800' :
                      bid.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      bid.status === 'shortlisted' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {bid.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProviderDashboard;
