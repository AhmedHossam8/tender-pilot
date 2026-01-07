import api from './api';

/**
 * Bid Comparison Service
 * Handles API calls for comparing bids
 */

const bidComparisonService = {
  /**
   * Compare multiple bids
   * @param {Array} bidIds - Array of bid IDs to compare
   * @returns {Promise} Comparison result with recommendations
   */
  compareBids(bidIds) {
    return api.post('/bids/compare/', { bid_ids: bidIds });
  },

  /**
   * Get insights for all bids on a project
   * @param {number} projectId - Project ID
   * @returns {Promise} Bid insights
   */
  getProjectBidsInsights(projectId) {
    return api.get(`/projects/${projectId}/bids/insights/`);
  }
};

export default bidComparisonService;
