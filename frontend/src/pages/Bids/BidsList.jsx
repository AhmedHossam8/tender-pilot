import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import bidService from '../../services/bid.service';
import { Plus, RefreshCw } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const BidsList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('sent'); // 'sent' or 'received'
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadBids();
  }, [activeTab, statusFilter]);

  const loadBids = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = { type: activeTab };
      if (statusFilter !== 'all') params.status = statusFilter;
      const response = await bidService.getBids(params);
      const bidsData = Array.isArray(response.data) ? response.data : (response.data?.results ?? []);
      setBids(bidsData);
    } catch (err) {
      console.error('Error loading bids:', err);
      setError('Failed to load bids. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    const baseClass = 'px-3 py-1 rounded-full text-sm font-medium';
    switch (status) {
      case 'pending': return `${baseClass} bg-yellow-600 text-gray-900`;
      case 'shortlisted': return `${baseClass} bg-blue-600 text-white`;
      case 'accepted': return `${baseClass} bg-green-600 text-white`;
      case 'rejected': return `${baseClass} bg-red-600 text-white`;
      case 'withdrawn': return `${baseClass} bg-gray-600 text-white`;
      default: return `${baseClass} bg-gray-700 text-white`;
    }
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);

  const handleBidClick = (bidId) => navigate(`/bids/${bidId}`);
  const handleCreateBid = () => navigate('/app/bids/create');

  return (
    <div className="container mx-auto px-4 py-8 bg-[#101825] min-h-screen text-white">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">{t('bids.title')}</h1>
        <button
          onClick={handleCreateBid}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t('bids.create', 'Submit New Bid')}
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('sent')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'sent'
                ? 'border-blue-500 text-white'
                : 'border-transparent text-gray-400 hover:text-white hover:border-gray-600'
              }`}
          >
            {t('bids.sentBids')}
          </button>
          <button
            onClick={() => setActiveTab('received')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'received'
                ? 'border-blue-500 text-white'
                : 'border-transparent text-gray-400 hover:text-white hover:border-gray-600'
              }`}
          >
            {t('bids.receivedBids')}
          </button>
        </nav>
      </div>

      {/* Status Filter */}
      <div className="mb-6 flex items-center gap-3 flex-wrap">
        <label className="text-sm font-medium text-gray-300">
          {t('bids.filterByStatus')}
        </label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-gray-800 text-white border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm min-w-[180px]"
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
          <p className="mt-4 text-gray-300">{t('common.loading')}</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-900 border border-red-700 rounded-lg p-4 mb-6 text-red-100">
          <p>{error}</p>
          <button
            onClick={loadBids}
            className="mt-2 text-red-200 hover:text-white font-medium flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('common.tryAgain', 'Try Again')}
          </button>
        </div>
      )}

      {/* Bids List */}
      {!loading && !error && (
        <>
          {bids.length === 0 ? (
            <div className="text-center py-12 bg-gray-900 rounded-lg">
              <svg
                className="mx-auto h-12 w-12 text-gray-500"
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
              <h3 className="mt-2 text-sm font-medium text-white">
                {t('bids.noBids')}
              </h3>
              <p className="mt-1 text-sm text-gray-400">
                {activeTab === 'sent'
                  ? t('bids.noSentBids')
                  : t('bids.noReceivedBids')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bids.map((bid) => (
                <div
                  key={bid.id}
                  onClick={() => handleBidClick(bid.id)}
                  className="bg-gray-900 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
                >
                  <div className="p-6">
                    {/* Project Title */}
                    <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
                      {bid.project_title}
                    </h3>

                    {/* Service Provider Name (for received bids) */}
                    {activeTab === 'received' && (
                      <p className="text-sm text-gray-400 mb-3">
                        {t('bids.applicant', 'By')}: {bid.service_provider_name}
                      </p>
                    )}

                    {/* Amount and Timeline */}
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <p className="text-sm text-gray-400">{t('bids.amount')}</p>
                        <p className="text-xl font-bold text-white">
                          {formatCurrency(bid.proposed_amount)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-400">{t('bids.deliveryTime')}</p>
                        <p className="text-lg font-semibold text-white">
                          {bid.proposed_timeline} {t('bids.days')}
                        </p>
                      </div>
                    </div>

                    {/* AI Match Score */}
                    {bid.ai_score !== undefined && bid.ai_score !== null && (
                      <div className="mb-3 bg-gray-800/70 rounded-lg p-3 border border-gray-700/80">
                        <div className="flex items-center justify-between text-xs text-gray-300 font-medium">
                          <span>{t('bids.aiScore')}</span>
                          <span className="text-white">{Math.round(bid.ai_score)}/100</span>
                        </div>
                        <div className="mt-2 h-2 rounded-full bg-gray-900 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-400"
                            style={{ width: `${Math.min(Math.max(bid.ai_score, 0), 100)}%` }}
                          />
                        </div>
                        {bid.ai_feedback?.recommendation && (
                          <p className="text-[11px] text-gray-400 mt-2 line-clamp-1">
                            {bid.ai_feedback.recommendation}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="flex justify-between items-center">
                      <span className={getStatusBadgeClass(bid.status)}>
                        {bid.status_display || bid.status}
                      </span>
                      <span className="text-xs text-gray-400">
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
