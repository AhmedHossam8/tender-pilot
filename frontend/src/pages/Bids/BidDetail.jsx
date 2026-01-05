/**
 * BidDetail Page
 * 
 * Displays detailed information about a specific bid.
 * 
 * Features:
 * - Full bid details (cover letter, amount, timeline)
 * - Service provider information
 * - Project information
 * - AI match score with visual indicator
 * - Status badge and history
 * - Action buttons based on user role:
 *   - Client: Shortlist, Accept, Reject
 *   - Service Provider: Withdraw, Edit
 * - Attachments viewer
 * - Audit log/timeline
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import bidService from '../../services/bid.service';
import { toast } from 'react-toastify';

const BidDetail = () => {
  const { t } = useTranslation();
  const { bidId } = useParams();
  const navigate = useNavigate();

  const [bid, setBid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawReason, setWithdrawReason] = useState('');

  /**
   * Load bid details when component mounts or bidId changes.
   */
  useEffect(() => {
    loadBidDetails();
  }, [bidId]);

  const loadBidDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await bidService.getBidById(bidId);
      setBid(response.data);
    } catch (err) {
      console.error('Error loading bid:', err);
      setError('Failed to load bid details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle status change actions (shortlist, accept, reject).
   * Only available to project owners.
   */
  const handleStatusChange = async (newStatus, reason = '') => {
    try {
      setActionLoading(true);
      await bidService.changeBidStatus(bidId, newStatus, reason);
      toast.success(t(`bids.status${newStatus}Success`, `Bid ${newStatus} successfully`));
      await loadBidDetails(); // Reload to show updated status
    } catch (error) {
      console.error('Error changing bid status:', error);
      toast.error(
        error.response?.data?.error ||
          t('bids.errors.statusChangeFailed', 'Failed to change bid status')
      );
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Handle bid withdrawal.
   * Only available to the service provider who submitted the bid.
   */
  const handleWithdraw = async () => {
    try {
      setActionLoading(true);
      await bidService.withdrawBid(bidId, withdrawReason);
      toast.success(t('bids.withdrawSuccess', 'Bid withdrawn successfully'));
      setShowWithdrawModal(false);
      await loadBidDetails();
    } catch (error) {
      console.error('Error withdrawing bid:', error);
      toast.error(
        error.response?.data?.error ||
          t('bids.errors.withdrawFailed', 'Failed to withdraw bid')
      );
    } finally {
      setActionLoading(false);
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
   * Get status badge color class.
   */
  const getStatusBadgeClass = (status) => {
    const baseClass = 'px-4 py-2 rounded-full text-sm font-medium inline-block';
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
   * Get AI match score color based on score value.
   */
  const getMatchScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  /**
   * Get match score bar color.
   */
  const getMatchScoreBarColor = (score) => {
    if (score >= 80) return 'bg-green-600';
    if (score >= 60) return 'bg-blue-600';
    if (score >= 40) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">{t('common.loading', 'Loading...')}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !bid) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-800">{error || 'Bid not found'}</p>
          <button
            onClick={() => navigate('/bids')}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            {t('common.goBack', 'Go Back')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/bids')}
          className="text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t('common.back', 'Back to Bids')}
        </button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {t('bids.bidDetails', 'Bid Details')}
            </h1>
            <p className="text-gray-600">{bid.project_title}</p>
          </div>
          <span className={getStatusBadgeClass(bid.status)}>
            {bid.status_display || bid.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Match Score (if available) */}
          {bid.ai_score && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {t('bids.aiMatchScore', 'AI Match Score')}
              </h2>
              <div className="flex items-center gap-4">
                <div className={`text-5xl font-bold ${getMatchScoreColor(bid.ai_score)}`}>
                  {bid.ai_score}
                  <span className="text-2xl text-gray-500">/100</span>
                </div>
                <div className="flex-1">
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className={`h-4 rounded-full ${getMatchScoreBarColor(bid.ai_score)}`}
                      style={{ width: `${bid.ai_score}%` }}
                    ></div>
                  </div>
                  {bid.ai_feedback && bid.ai_feedback.recommendation && (
                    <p className="mt-2 text-sm text-gray-600">
                      {bid.ai_feedback.recommendation}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Cover Letter */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {t('bids.coverLetter', 'Cover Letter')}
            </h2>
            <div className="prose max-w-none whitespace-pre-wrap text-gray-700">
              {bid.cover_letter}
            </div>
          </div>

          {/* Milestones (if available) */}
          {bid.milestone_details && bid.milestone_details.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {t('bids.milestones', 'Milestones')}
              </h2>
              <div className="space-y-4">
                {bid.milestone_details.map((milestone, index) => (
                  <div key={milestone.id} className="border-l-4 border-blue-500 pl-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {index + 1}. {milestone.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(milestone.amount)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {milestone.duration_days} {t('bids.days', 'days')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attachments */}
          {bid.attachments && bid.attachments.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {t('bids.attachments', 'Attachments')}
              </h2>
              <div className="space-y-2">
                {bid.attachments.map((attachment) => (
                  <a
                    key={attachment.id}
                    href={attachment.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{attachment.file_name}</p>
                      {attachment.description && (
                        <p className="text-xs text-gray-500">{attachment.description}</p>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Right Column */}
        <div className="space-y-6">
          {/* Bid Summary Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {t('bids.summary', 'Bid Summary')}
            </h2>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">{t('bids.amount', 'Amount')}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(bid.proposed_amount)}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600">{t('bids.timeline', 'Timeline')}</p>
                <p className="text-xl font-semibold text-gray-900">
                  {bid.proposed_timeline} {t('bids.days', 'days')}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600">{t('bids.submittedOn', 'Submitted On')}</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(bid.created_at).toLocaleString()}
                </p>
              </div>

              {bid.service_provider && (
                <div>
                  <p className="text-sm text-gray-600">{t('bids.serviceProvider', 'Service Provider')}</p>
                  <p className="text-sm font-medium text-gray-900">
                    {bid.service_provider.first_name} {bid.service_provider.last_name}
                  </p>
                  <p className="text-xs text-gray-500">{bid.service_provider.email}</p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {bid.status === 'pending' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {t('bids.actions', 'Actions')}
              </h3>
              <div className="space-y-3">
                {/* TODO: Add role-based rendering */}
                <button
                  onClick={() => handleStatusChange('shortlisted')}
                  disabled={actionLoading}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {t('bids.shortlist', 'Shortlist')}
                </button>
                <button
                  onClick={() => handleStatusChange('accepted')}
                  disabled={actionLoading}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                >
                  {t('bids.accept', 'Accept Bid')}
                </button>
                <button
                  onClick={() => handleStatusChange('rejected')}
                  disabled={actionLoading}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
                >
                  {t('bids.reject', 'Reject')}
                </button>
                <button
                  onClick={() => setShowWithdrawModal(true)}
                  disabled={actionLoading}
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:bg-gray-100"
                >
                  {t('bids.withdraw', 'Withdraw Bid')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {t('bids.confirmWithdraw', 'Confirm Withdrawal')}
            </h3>
            <p className="text-gray-600 mb-4">
              {t('bids.withdrawDescription', 'Are you sure you want to withdraw this bid? This action cannot be undone.')}
            </p>
            <textarea
              value={withdrawReason}
              onChange={(e) => setWithdrawReason(e.target.value)}
              placeholder={t('bids.withdrawReasonPlaceholder', 'Optional: Reason for withdrawal')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
              rows={3}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                onClick={handleWithdraw}
                disabled={actionLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
              >
                {actionLoading ? t('bids.withdrawing', 'Withdrawing...') : t('bids.confirmWithdrawButton', 'Withdraw')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BidDetail;
