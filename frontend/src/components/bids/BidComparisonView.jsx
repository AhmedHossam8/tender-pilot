import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Target,
  DollarSign,
  Clock,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Star,
  Award
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import bidComparisonService from '@/services/bidComparison.service';
import { LoadingSpinner } from '@/components/common';

/**
 * Bid Comparison View
 * Allows clients to compare multiple bids side-by-side with AI insights
 */
const BidComparisonView = ({ bidIds, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [comparisonData, setComparisonData] = useState(null);

  useEffect(() => {
    if (bidIds && bidIds.length >= 2) {
      loadComparison();
    }
  }, [bidIds]);

  const loadComparison = async () => {
    try {
      setLoading(true);
      const response = await bidComparisonService.compareBids(bidIds);
      setComparisonData(response.data);
    } catch (error) {
      console.error('Error loading comparison:', error);
      toast.error('Failed to load bid comparison');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="large" message="Comparing bids..." />
      </div>
    );
  }

  if (!comparisonData) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No comparison data available</p>
      </div>
    );
  }

  const { bids, comparison, recommendation } = comparisonData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          Bid Comparison
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        )}
      </div>

      {/* AI Recommendation Banner */}
      {recommendation && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <Award className="h-8 w-8 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                AI Recommendation
              </h3>
              <p className="text-gray-700 mb-3">
                {recommendation.summary}
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                {recommendation.reasons.map((reason, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-white border border-purple-200 rounded-full text-sm text-purple-700"
                  >
                    ✓ {reason}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="font-medium text-gray-700">
                  Confidence: <span className={`font-bold ${
                    recommendation.confidence === 'high' ? 'text-green-600' :
                    recommendation.confidence === 'medium' ? 'text-yellow-600' :
                    'text-gray-600'
                  }`}>{recommendation.confidence.toUpperCase()}</span>
                </span>
                <span className="font-medium text-gray-700">
                  Score: <span className="font-bold text-purple-600">
                    {recommendation.composite_score}/100
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-gray-600">Price Range</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            ${comparison.price.min.toLocaleString()} - ${comparison.price.max.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Avg: ${comparison.price.avg.toFixed(0).toLocaleString()}
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-600">Timeline Range</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {comparison.timeline.min} - {comparison.timeline.max} days
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Avg: {comparison.timeline.avg.toFixed(0)} days
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <Target className="h-5 w-5 text-purple-600" />
            <span className="text-sm font-medium text-gray-600">AI Match Score</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {comparison.ai_score.avg.toFixed(1)}/100
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Range: {comparison.ai_score.min} - {comparison.ai_score.max}
          </div>
        </div>
      </div>

      {/* Bids Comparison Table */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Provider
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timeline
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  AI Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Overall
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {bids.map((bid) => (
                <tr
                  key={bid.id}
                  className={`hover:bg-gray-50 transition-colors ${
                    recommendation && bid.id === recommendation.recommended_bid_id
                      ? 'bg-purple-50'
                      : ''
                  }`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {recommendation && bid.id === recommendation.recommended_bid_id && (
                        <Award className="h-5 w-5 text-purple-600 flex-shrink-0" />
                      )}
                      <div>
                        <div className="font-medium text-gray-900">
                          {bid.provider_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {bid.provider_email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      ${bid.proposed_amount.toLocaleString()}
                    </div>
                    {bid.proposed_amount === comparison.price.min && (
                      <span className="text-xs text-green-600">Lowest</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {bid.proposed_timeline} days
                    </div>
                    {bid.proposed_timeline === comparison.timeline.min && (
                      <span className="text-xs text-blue-600">Fastest</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            bid.ai_score >= 80 ? 'bg-green-500' :
                            bid.ai_score >= 60 ? 'bg-blue-500' :
                            'bg-yellow-500'
                          }`}
                          style={{ width: `${bid.ai_score}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {bid.ai_score}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-500 h-2 rounded-full"
                          style={{ width: `${bid.value_score}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {bid.value_score}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {bid.composite_score && (
                        <>
                          <Star className={`h-4 w-4 ${
                            bid.composite_score >= 80 ? 'text-yellow-500 fill-yellow-500' :
                            bid.composite_score >= 60 ? 'text-yellow-500' :
                            'text-gray-400'
                          }`} />
                          <span className="text-sm font-semibold text-gray-900">
                            {bid.composite_score.toFixed(1)}
                          </span>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Comparison Cards (Mobile friendly) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:hidden">
        {bids.map((bid) => (
          <div
            key={bid.id}
            className={`bg-white border-2 rounded-lg p-6 ${
              recommendation && bid.id === recommendation.recommended_bid_id
                ? 'border-purple-500'
                : 'border-gray-200'
            }`}
          >
            {recommendation && bid.id === recommendation.recommended_bid_id && (
              <div className="flex items-center gap-2 mb-4 text-purple-600">
                <Award className="h-5 w-5" />
                <span className="font-semibold">Recommended</span>
              </div>
            )}

            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {bid.provider_name}
            </h3>

            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-600 mb-1">Price</div>
                <div className="text-xl font-bold text-gray-900">
                  ${bid.proposed_amount.toLocaleString()}
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-600 mb-1">Timeline</div>
                <div className="text-lg font-semibold text-gray-900">
                  {bid.proposed_timeline} days
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-600 mb-1">AI Match Score</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        bid.ai_score >= 80 ? 'bg-green-500' :
                        bid.ai_score >= 60 ? 'bg-blue-500' :
                        'bg-yellow-500'
                      }`}
                      style={{ width: `${bid.ai_score}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold">{bid.ai_score}/100</span>
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-600 mb-1">Overall Score</div>
                <div className="text-2xl font-bold text-purple-600">
                  {bid.composite_score?.toFixed(1) || 'N/A'}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

BidComparisonView.propTypes = {
  bidIds: PropTypes.arrayOf(PropTypes.number).isRequired,
  onClose: PropTypes.func
};

export default BidComparisonView;
