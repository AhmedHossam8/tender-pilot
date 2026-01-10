import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../contexts/authStore';
import { bookingService } from '../../services/booking.service';
import { projectService } from '../../services/project.services';
import DashboardCard from '../../components/dashboard/DashboardCard';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

/**
 * ClientDashboard
 * Dashboard for clients showing their projects, bookings, and activity
 */
const ClientDashboard = () => {
  const { t } = useTranslation();
  const { user, profile } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeProjects: 0,
    totalProjects: 0,
    activeBookings: 0,
    totalBookings: 0,
    totalSpent: 0,
    pendingBids: 0,
  });

  // Placeholder data - will be replaced when projects/bookings modules are ready
  // const [recentProjects] = useState([]);

  // Fetch recent bookings
  const { data: bookingsData, isLoading: bookingsLoading } = useQuery({
    queryKey: ['bookings'],
    queryFn: async () => {
      const res = await bookingService.getAll();
      return res.data.results ?? res.data;
    },
  });

  // Fetch recent projects
  const { data: projectsData, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await projectService.getProjects();
      return res.data.results ?? res.data;
    },
  });

  const recentBookings = bookingsData?.slice(0, 5) || [];
  const recentProjects = projectsData?.slice(0, 5) || [];

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // TODO: Replace with actual API calls when projects/bookings are implemented
      // const projectsRes = await projectService.getMyProjects();
      // const bookingsRes = await bookingService.getMyBookings();
      // const statsRes = await userService.getClientStats(user.id);
      
      // For now, use placeholder data
      setStats({
        activeProjects: projectsData?.filter(p => p.status === 'open').length || 0,
        totalProjects: projectsData?.length || 0,
        activeBookings: bookingsData?.filter(b => b.status === 'confirmed' || b.status === 'pending').length || 0,
        totalBookings: bookingsData?.length || 0,
        totalSpent: 0,
        pendingBids: 0,
      });
      
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading || bookingsLoading || projectsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t('dashboard.title')}
        </h1>
        <p className="text-gray-600">
          {t('dashboard.welcome', { name: user?.full_name || t('common.user') })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <DashboardCard
          title={t('dashboard.activeProjects')}
          value={stats.activeProjects}
          subtitle={t('dashboard.activeProjectsDesc')}
          color="blue"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />

        <DashboardCard
          title={t('dashboard.totalProjects')}
          value={stats.totalProjects}
          subtitle={t('dashboard.totalProjectsDesc')}
          color="indigo"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          }
        />

        <DashboardCard
          title={t('dashboard.pendingBids')}
          value={stats.pendingBids}
          subtitle={t('dashboard.pendingBidsDesc')}
          color="yellow"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        <DashboardCard
          title={t('dashboard.activeBookings')}
          value={stats.activeBookings}
          subtitle={t('dashboard.activeBookingsDesc')}
          color="green"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          }
        />

        <DashboardCard
          title="Total Bookings"
          value={stats.totalBookings}
          subtitle="All time"
          color="purple"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />

        <DashboardCard
          title="Total Spent"
          value={`$${stats.totalSpent.toLocaleString()}`}
          subtitle="Lifetime spending"
          color="red"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">{t('dashboard.quickActions')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/app/projects/create"
            className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <div>
              <div className="font-semibold text-gray-900">{t('dashboard.postProject')}</div>
              <div className="text-sm text-gray-600">{t('dashboard.postProjectDesc')}</div>
            </div>
          </Link>

          <Link
            to="/services"
            className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <div>
              <div className="font-semibold text-gray-900">{t('dashboard.browseServices')}</div>
              <div className="text-sm text-gray-600">{t('dashboard.browseServicesDesc')}</div>
            </div>
          </Link>

          <Link
            to="/profile/edit"
            className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <div>
              <div className="font-semibold text-gray-900">{t('dashboard.editProfile')}</div>
              <div className="text-sm text-gray-600">{t('dashboard.editProfileDesc')}</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">{t('dashboard.recentProjects')}</h2>
            <Link to="/app/projects" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              {t('dashboard.viewAll')}
            </Link>
          </div>
          
          {recentProjects.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500 mb-2">{t('dashboard.noProjects')}</p>
              <Link to="/app/projects/create" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                {t('dashboard.postFirstProject')}
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentProjects.map((project) => (
                <div key={project.id} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900">{project.title}</h3>
                    <span className="text-sm text-gray-500">{project.bids_count} {t('dashboard.bids')}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{project.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{new Date(project.created_at).toLocaleDateString()}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      project.status === 'open' ? 'bg-green-100 text-green-800' :
                      project.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {t(`dashboard.status.${project.status}`)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Bookings */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">{t('dashboard.recentBookings')}</h2>
            <Link to="/app/bookings" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              {t('dashboard.viewAll')}
            </Link>
          </div>
          
          {recentBookings.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-gray-500 mb-2">{t('dashboard.noBookings')}</p>
              <Link to="/services" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                {t('dashboard.browseServicesLink')}
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentBookings.map((booking) => (
                <div key={booking.id} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900">{booking.package?.service?.name || 'Service'}</h3>
                    <span className="text-sm font-bold text-gray-900">${booking.package?.price || 0}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{booking.package?.name || 'Package'}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{new Date(booking.scheduled_for).toLocaleDateString()}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      booking.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                      booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                      booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {t(`dashboard.status.${booking.status}`)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
