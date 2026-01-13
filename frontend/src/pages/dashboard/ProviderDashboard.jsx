import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../contexts/authStore';
import DashboardCard from '../../components/dashboard/DashboardCard';
import SkillBadge from '../../components/profile/SkillBadge';
import { toast } from 'sonner';
import { serviceService } from '../../services/services.service';
import bidService from '../../services/bid.service';
import { usePersonalizedRecommendations, useTrendingOpportunities } from '../../hooks/useRecommendations';
import { Sparkles, RefreshCw } from 'lucide-react';
import { RecommendationSkeleton } from '../../components/common/LoadingSkeleton';
import { Button } from '@/components/ui';

const ProviderDashboard = () => {
  const { t } = useTranslation();
  const { user, profile } = useAuthStore();

  // Queries
  const { data: servicesData = [], isLoading: servicesLoading } = useQuery({
    queryKey: ['my-services'],
    queryFn: async () => (await serviceService.getAll()).data?.results || [],
    onError: (err) => console.error(err),
  });

  const { data: bidsData = [], isLoading: bidsLoading } = useQuery({
    queryKey: ['my-bids'],
    queryFn: async () => (await bidService.getBids({ type: 'sent' })).data?.results || [],
    onError: (err) => console.error(err),
  });

  const { data: recommendations, isLoading: recommendationsLoading, refetch: refetchRecommendations } = usePersonalizedRecommendations({ limit: 5 });
  const { data: trending, isLoading: trendingLoading, refetch: refetchTrending } = useTrendingOpportunities({ limit: 3 });

  // Stats computed from query data
  const stats = useMemo(() => ({
    activeServices: servicesData.filter(s => s.is_active).length,
    totalServices: servicesData.length,
    activeBids: bidsData.filter(b => b.status === 'pending').length,
    totalBids: bidsData.length,
    acceptedBids: bidsData.filter(b => b.status === 'accepted').length,
    completedProjects: bidsData.filter(b => b.status === 'completed').length,
    totalEarnings: bidsData
        .filter(b => b.status === 'completed')
        .reduce((sum, b) => sum + (b.proposed_amount || 0), 0),
    averageRating: profile?.average_rating || 0,
  }), [servicesData, bidsData, profile]);

  const profileCompleteness = profile?.ai_profile_score || 0;
  const needsProfileUpdate = profileCompleteness < 70;

  const recentServices = servicesData.slice(0, 3);
  const recentBids = bidsData.slice(0, 3);

  const handleRefreshRecommendations = async () => {
    toast.info('Refreshing recommendations...');
    await refetchRecommendations();
    toast.success('Recommendations updated');
  };

  const handleRefreshTrending = async () => {
    toast.info('Refreshing trending opportunities...');
    await refetchTrending();
    toast.success('Trending opportunities updated');
  };

  if (servicesLoading || bidsLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 text-white bg-[#101825] min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t('dashboard.provider.title')}</h1>
        <p className="text-gray-400">{t('dashboard.provider.welcome', { name: user?.full_name || t('common.provider') })}</p>
      </div>

      {/* Profile Completeness Alert */}
      {needsProfileUpdate && (
        <div className="bg-yellow-800 border-l-4 border-yellow-500 p-4 mb-6 rounded-md text-yellow-100">
          <div className="flex items-start">
            <Sparkles className="h-5 w-5 flex-shrink-0" />
            <div className="ml-3 flex-1">
              <p className="text-sm">
                {t('dashboard.provider.profileIncomplete', { percentage: profileCompleteness })}
              </p>
              <div className="mt-2">
                <Link to="/app/settings" className="text-sm font-medium underline hover:text-yellow-200">
                  {t('dashboard.provider.updateProfile')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <DashboardCard title={t('dashboard.provider.activeServices')} value={stats.activeServices} subtitle={t('dashboard.provider.currentlyListed')} color="blue" />
        <DashboardCard title={t('dashboard.provider.activeBids')} value={stats.activeBids} subtitle={t('dashboard.provider.pendingReview')} color="yellow" />
        <DashboardCard title={t('dashboard.provider.acceptedBids')} value={stats.acceptedBids} subtitle={t('dashboard.provider.wonProjects')} color="green" />
        <DashboardCard title={t('dashboard.provider.totalEarnings')} value={`$${stats.totalEarnings.toLocaleString()}`} subtitle={t('dashboard.provider.lifetimeRevenue')} color="green" />
        <DashboardCard title={t('dashboard.provider.completedProjects')} value={stats.completedProjects} subtitle={t('dashboard.provider.successfullyDelivered')} color="indigo" />
        <DashboardCard title={t('dashboard.provider.totalBids')} value={stats.totalBids} subtitle={t('dashboard.provider.allTime')} color="purple" />
        <DashboardCard title={t('dashboard.provider.averageRating')} value={stats.averageRating.toFixed(1)} subtitle={t('dashboard.provider.outOfFive')} color="yellow" />
        <DashboardCard title={t('dashboard.provider.profileScore')} value={`${profileCompleteness}%`} subtitle={t('dashboard.provider.completeness')} color={profileCompleteness >= 80 ? 'green' : profileCompleteness >= 50 ? 'yellow' : 'red'} />
      </div>

      {/* Quick Actions */}
      <div className="bg-[#1c1f2a] rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">{t('dashboard.provider.quickActions')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { to: '/app/services', label: t('dashboard.provider.addService'), subLabel: t('dashboard.provider.createNewListing'), icon: '+' },
            { to: '/app/projects', label: t('dashboard.provider.findProjects'), subLabel: t('dashboard.provider.browseAndBid'), icon: '🔍' },
            { to: '/app/bids', label: t('dashboard.provider.myBids'), subLabel: t('dashboard.provider.trackSubmissions'), icon: '📝' },
            { to: '/app/settings', label: t('dashboard.provider.editProfile'), subLabel: t('dashboard.provider.updateSkills'), icon: '⚙️' },
          ].map((action) => (
            <Link key={action.to} to={action.to} className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-gray-600 rounded-lg hover:border-purple-500 hover:bg-[#252a3a] transition-colors">
              <div className="text-purple-500 text-2xl">{action.icon}</div>
              <div className="text-center">
                <div className="font-semibold">{action.label}</div>
                <div className="text-xs text-gray-400">{action.subLabel}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Skills */}
      {profile?.skills?.length > 0 && (
        <div className="bg-[#1c1f2a] rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">{t('dashboard.provider.yourSkills')}</h2>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill) => <SkillBadge key={skill.id} skill={skill} />)}
          </div>
        </div>
      )}

      {/* Recent Services & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Services */}
        <div className="bg-[#1c1f2a] rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">{t('dashboard.provider.myServices')}</h2>
          {recentServices.length === 0 ? (
            <div className="text-center py-8 text-gray-400">{t('dashboard.provider.noServicesYet')}</div>
          ) : (
            <div className="space-y-3">{recentServices.map(service => (
              <Link key={service.id} to={`/app/services/${service.id}`} className="block p-4 border border-gray-700 rounded-lg hover:border-purple-500 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">{service.name}</h3>
                  <span className="text-sm font-bold">{service.packages?.[0]?.price ? `$${service.packages[0].price}` : 'N/A'}</span>
                </div>
                <p className="text-sm text-gray-400 line-clamp-2">{service.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{service.packages?.length || 0} {t('dashboard.provider.packages')}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${service.is_active ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-200'}`}>
                    {service.is_active ? t('common.active') : t('common.inactive')}
                  </span>
                </div>
              </Link>
            ))}</div>
          )}
        </div>

        {/* AI Recommendations */}
        <div className="bg-[#1c1f2a] rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center"><Sparkles className="mr-2 text-purple-500" />{t('dashboard.provider.recommendedForYou')}</h2>
            <Button variant="ghost" size="sm" onClick={handleRefreshRecommendations} disabled={recommendationsLoading} className="flex items-center gap-1">
              <RefreshCw className={`h-4 w-4 ${recommendationsLoading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
          </div>
          {recommendationsLoading ? (
            <RecommendationSkeleton count={3} />
          ) : recommendations?.recommendations?.length > 0 ? (
            <div className="space-y-3">{recommendations.recommendations.map(rec => (
              <Link key={rec.project.id} to={`/app/projects/${rec.project.id}`} className="block p-4 border-l-4 border-purple-400 bg-[#252a3a] rounded-lg hover:bg-[#2c3142] transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">{rec.project.title}</h3>
                  <span className="text-sm font-bold text-purple-400">{(rec.match_score * 100).toFixed(0)}% {t('dashboard.provider.match')}</span>
                </div>
                <p className="text-sm text-gray-400 line-clamp-2">{rec.project.description}</p>
              </Link>
            ))}</div>
          ) : <p className="text-center text-gray-500 py-8">{t('dashboard.provider.noRecommendations')}</p>}
        </div>
      </div>
    </div>
  );
};

export default ProviderDashboard;
