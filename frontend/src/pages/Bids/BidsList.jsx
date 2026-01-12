/**
 * BidsList Page
 * 
 * Displays a list of bids with tabs to switch between:
 * - Sent Bids: Bids submitted by the current user (as a service provider)
 * - Received Bids: Bids received on the user's projects (as a client)
 * 
 * Features:
 * - Tab-based navigation
 * - Status filtering
 * - Search functionality
 * - Responsive card layout
 * - Status badges with color coding
 * - AI match score display
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import bidService from '../../services/bid.service';
import { AIMatchScore } from '../../components/ai';

const BidsList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // State management
  const [activeTab, setActiveTab] = useState('sent'); // 'sent' or 'received'
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  /**
   * Load bids from the API based on current filters.
   * This function is called whenever the tab or filter changes.
   */
  useEffect(() => {
    loadBids();
  }, [activeTab, statusFilter]);

  const loadBids = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = {
        type: activeTab, // 'sent' or 'received'
      };

      // Add status filter if not 'all'
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      // Fetch bids from API
      const response = await bidService.getBids(params);
      // Handle both array and paginated response formats
      const bidsData = Array.isArray(response.data) ? response.data : (response.data?.results ?? []);
      setBids(bidsData);
    } catch (err) {
      console.error('Error loading bids:', err);
      setError('Failed to load bids. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get the appropriate CSS class for status badges.
   * Different statuses have different colors for visual distinction.
   */
  const getStatusBadgeClass = (status) => {
    const baseClass = 'px-3 py-1 rounded-full text-sm font-medium';
    switch (status) {
      case 'pending':
        return `${baseClass} bg-yellow-100 text-yellow-800`;
      case 'shortlisted':
        return `${baseClass} bg-blue-100 text-blue-800`;
      case 'accepted':
        return `${baseClass} bg-green-100 text-green-800`;
      case 'rejected':
        return `${baseClass} bg-red-100 text-red-800`;
      case 'withdrawn':
        return `${baseClass} bg-gray-100 text-gray-800`;
      default:
        return `${baseClass} bg-gray-100 text-gray-800`;
    }
  };

  /**
   * Format currency for display.
   */
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  /**
   * Navigate to bid details page when a bid card is clicked.
   */
  const handleBidClick = (bidId) => {
    navigate(`/bids/${bidId}`);
  };

  /**
   * Navigate to create bid page.
   */
  const handleCreateBid = () => {
    navigate('/app/bids/create');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {t('bids.title')}
        </h1>
        <button
          onClick={handleCreateBid}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          disabled={handleCreateBid.isPending}
        >
          {handleCreateBid.isPending ? (
            <LoadingSpinner className="h-4 w-4 mr-2" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          {t('bids.create', 'Submit New Bid')}
        </button>
      </div>

      {/* Tabs: Sent vs Received */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('sent')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'sent'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            disabled={loading}
          >
            {t('bids.sentBids')}
          </button>
          <button
            onClick={() => setActiveTab('received')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'received'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            disabled={loading}
          >
            {t('bids.receivedBids')}
          </button>
        </nav>
      </div>

      {/* Status Filter */}
      <div className="mb-6">
        <label className="text-sm font-medium text-gray-700 mr-3">
          {t('bids.filterByStatus')}:
        </label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">{t('bids.allStatuses')}</option>
          <option value="pending">{t('status.pending')}</option>
          <option value="shortlisted">{t('bids.shortlist')}</option>
          <option value="accepted">{t('status.accepted', 'Accepted')}</option>
          <option value="rejected">{t('status.rejected', 'Rejected')}</option>
          <option value="withdrawn">{t('bids.withdrawBid', 'Withdrawn')}</option>
        </select>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">{t('common.loading')}</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
          <button
            onClick={loadBids}
            className="mt-2 text-red-600 hover:text-red-800 font-medium"
            disabled={loadBids.isPending}
          >
            {loadBids.isPending ? (
              <LoadingSpinner className="h-4 w-4 mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {t('common.tryAgain', 'Try Again')}
          </button>
        </div>
      )}

      {/* Bids List */}
      {!loading && !error && (
        <>
          {bids.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {t('bids.noBids')}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {activeTab === 'sent'
                  ? t('bids.noSentBids')
                  : t('bids.noReceivedBids')}
              </p>
              {activeTab === 'sent' && (
                <button
                  onClick={handleCreateBid}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  disabled={handleCreateBid.isPending}
                >
                  {handleCreateBid.isPending ? (
                    <LoadingSpinner className="h-4 w-4 mr-2" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  {t('bids.submitFirst', 'Submit Your First Bid')}
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bids.map((bid) => (
                <div
                  key={bid.id}
                  onClick={() => handleBidClick(bid.id)}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
                >
                  <div className="p-6">
                    {/* Project Title */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {bid.project_title}
                    </h3>

                    {/* Service Provider Name (for received bids) */}
                    {activeTab === 'received' && (
                      <p className="text-sm text-gray-600 mb-3">
                        {t('bids.applicant', 'By')}: {bid.service_provider_name}
                      </p>
                    )}

                    {/* Amount and Timeline */}
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <p className="text-sm text-gray-500">
                          {t('bids.amount')}
                        </p>
                        <p className="text-xl font-bold text-gray-900">
                          {formatCurrency(bid.proposed_amount)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          {t('bids.deliveryTime')}
                        </p>
                        <p className="text-lg font-semibold text-gray-900">
                          {bid.proposed_timeline} {t('bids.days')}
                        </p>
                      </div>
                    </div>

                    {/* AI Match Score (if available) */}
                    {bid.ai_score && (
                      <div className="mb-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-3 border border-purple-100">
                        <AIMatchScore
                          score={bid.ai_score}
                          recommendation={bid.ai_feedback?.recommendation || bid.ai_recommendation}
                          showDetails={true}
                          feedback={bid.ai_feedback}
                          size="small"
                        />
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="flex justify-between items-center">
                      <span className={getStatusBadgeClass(bid.status)}>
                        {bid.status_display || bid.status}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(bid.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BidsList;
