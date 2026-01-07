import api from './api';

/**
 * AI Analytics Service
 * Handles all API calls related to AI analytics and metrics
 */

const aiAnalyticsService = {
  /**
   * Get aggregated usage statistics
   * @param {Object} params - Query parameters
   * @param {string} params.start_date - Start date (ISO format)
   * @param {string} params.end_date - End date (ISO format)
   * @param {number} params.days - Number of days (alternative to dates)
   * @returns {Promise} Usage statistics
   */
  getUsageStats(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.days) queryParams.append('days', params.days);
    if (params.start_date) queryParams.append('start_date', params.start_date);
    if (params.end_date) queryParams.append('end_date', params.end_date);
    
    return api.get(`/ai/analytics/stats/?${queryParams.toString()}`);
  },

  /**
   * Get match prediction accuracy statistics
   * @returns {Promise} Accuracy metrics
   */
  getMatchAccuracy() {
    return api.get('/ai/analytics/match-accuracy/');
  },

  /**
   * Get daily summaries
   * @param {number} days - Number of days to include
   * @returns {Promise} Daily summaries
   */
  getDailySummaries(days = 30) {
    return api.get(`/ai/analytics/daily-summary/?days=${days}`);
  },

  /**
   * Get cost trend data
   * @param {number} days - Number of days to include
   * @returns {Promise} Cost trend data
   */
  getCostTrend(days = 30) {
    return api.get(`/ai/analytics/cost-trend/?days=${days}`);
  },

  /**
   * Get feature usage breakdown
   * @param {number} days - Number of days to include
   * @returns {Promise} Feature usage data
   */
  getFeatureUsage(days = 30) {
    return api.get(`/ai/analytics/feature-usage/?days=${days}`);
  },

  /**
   * Generate daily summary (admin only)
   * @param {string} date - Date to generate summary for (ISO format)
   * @returns {Promise} Generated summary
   */
  generateDailySummary(date = null) {
    return api.post('/ai/analytics/generate-summary/', { date });
  }
};

export default aiAnalyticsService;
