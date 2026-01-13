import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import bidService from '../../services/bid.service';
import { AIMatchScore } from '../../components/ai';
import { Plus, RefreshCw } from 'lucide-react';
import {
  Button,
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  Skeleton,
  Badge,
} from '@/components/ui';

const BidsList = ({ userRole }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Default tab based on user role
  const defaultTab = userRole === 'provider' ? 'sent' : 'received';
  const [activeTab, setActiveTab] = useState(defaultTab);
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

      // Build params
      let params = {};
      if (userRole === 'provider') {
        params.type = 'sent';
      } else if (userRole === 'client') {
        params.type = 'received';
      }

      if (statusFilter !== 'all') params.status = statusFilter;

      const response = await bidService.getBids(params);

      // Check structure
      const bidsData = Array.isArray(response.data)
        ? response.data
        : response.data?.results ?? [];

      setBids(bidsData);
    } catch (err) {
      setError('Failed to load bids. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-600 text-gray-900';
      case 'shortlisted':
        return 'bg-blue-600 text-white';
      case 'accepted':
        return 'bg-green-600 text-white';
      case 'rejected':
        return 'bg-red-600 text-white';
      case 'withdrawn':
        return 'bg-gray-600 text-white';
      default:
        return 'bg-gray-700 text-white';
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const handleBidClick = (bidId) => navigate(`/app/bids/${bidId}`);
  const handleCreateBid = () => navigate('/app/bids/create');

  return (
    <div className="container mx-auto px-4 py-8 bg-[#101825] min-h-screen text-gray-300 text-sm">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('bids.title')}</h1>
        {userRole == 'client' && (
          <Button onClick={handleCreateBid} className="flex items-center" variant="default">
            <Plus className="h-4 w-4 mr-2" />
            {t('bids.create', 'Submit New Bid')}
          </Button>
        )}
      </div>

      {/* Tabs (only show if userRole is not restricted to one tab) */}
      {userRole === 'admin' && (
        <div className="mb-6 border-b border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {['sent', 'received'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 px-1 border-b-2 font-medium text-xs ${activeTab === tab
                  ? 'border-blue-500 text-white'
                  : 'border-transparent text-gray-400 hover:text-white hover:border-gray-600'
                  }`}
              >
                {tab === 'sent' ? t('bids.sentBids') : t('bids.receivedBids')}
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* Status Filter */}
      <div className="mb-6 flex items-center gap-3">
        <label className="text-xs font-medium text-gray-400">{t('bids.filterByStatus')}:</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1 bg-gray-800 text-gray-300 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
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
        <div className="py-12">
          <Skeleton className="h-6 w-1/3 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-36 rounded-lg" />
            ))}
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="bg-red-900 border-red-700 mb-6">
          <CardContent>
            <p className="text-red-100 text-sm">{error}</p>
            <Button onClick={loadBids} variant="outline" className="mt-2 flex items-center text-sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('common.tryAgain', 'Try Again')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Bids List */}
      {!loading && !error && (
        <>
          {bids.length === 0 ? (
            <Card className="bg-gray-900 text-center py-12">
              <CardContent>
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
                <h3 className="mt-2 text-sm font-medium text-gray-300">{t('bids.noBids')}</h3>
                <p className="mt-1 text-xs text-gray-400">
                  {activeTab === 'sent' ? t('bids.noSentBids') : t('bids.noReceivedBids')}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bids.map((bid) => (
                <Card
                  key={bid.id}
                  className="bg-gray-900 cursor-pointer hover:shadow-lg overflow-hidden"
                  onClick={() => handleBidClick(bid.id)}
                >
                  <CardContent>
                    <CardTitle className="text-gray-350 mb-2 line-clamp-2 text-md mt-4">
                      {bid.project_title}
                    </CardTitle>

                    {activeTab === 'received' && (
                      <p className="text-xs text-gray-400 mb-3">
                        {t('bids.applicant', 'By')}: {bid.service_provider_name}
                      </p>
                    )}

                    <div className="flex justify-between items-center mb-3 text-xs">
                      <div>
                        <p className="text-gray-400">{t('bids.amount')}</p>
                        <p className="text-sm font-bold text-gray-350">
                          {formatCurrency(bid.proposed_amount)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-400">{t('bids.deliveryTime')}</p>
                        <p className="text-sm font-semibold text-gray-200">
                          {bid.proposed_timeline} {t('bids.days')}
                        </p>
                      </div>
                    </div>

                    {bid.ai_score && (
                      <div className="mb-3 bg-gray-800 rounded-lg p-2 border border-gray-700">
                        <AIMatchScore
                          score={bid.ai_score}
                          recommendation={bid.ai_feedback?.recommendation || bid.ai_recommendation}
                          showDetails
                          feedback={bid.ai_feedback}
                          size="small"
                        />
                      </div>
                    )}

                    <div className="flex justify-between items-center text-xs">
                      <Badge className={getStatusBadgeClass(bid.status)}>
                        {bid.status_display || bid.status}
                      </Badge>
                      <span className="text-gray-400">
                        {new Date(bid.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BidsList;
