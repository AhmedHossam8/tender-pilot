/**
 * Bid Service
 * 
 * Handles all API calls related to bids in the ServiceHub marketplace.
 * This service provides methods to:
 * - List bids (sent by providers or received by clients)
 * - Create new bids
 * - Retrieve bid details
 * - Update bids
 * - Change bid status
 * - Manage bid attachments
 * - Access AI-powered bid assistance features
 */

import api from './api';

/**
 * Get a list of bids based on filter criteria.
 * 
 * @param {Object} params - Query parameters for filtering
 * @param {string} params.type - Filter type: 'sent', 'received', or 'all'
 * @param {string} params.status - Filter by status: 'pending', 'shortlisted', 'accepted', 'rejected', 'withdrawn'
 * @param {string} params.project - Filter by project ID
 * @returns {Promise} Response with array of bids
 * 
 * Example:
 * const sentBids = await bidService.getBids({ type: 'sent', status: 'pending' });
 */
export const getBids = (params = {}) => {
  return api.get('/bids/bids/', { params });
};

/**
 * Get detailed information about a specific bid.
 * 
 * @param {string|number} bidId - The ID of the bid to retrieve
 * @returns {Promise} Response with bid details including attachments, milestones, and audit logs
 * 
 * Example:
 * const bidDetails = await bidService.getBidById(123);
 */
export const getBidById = (bidId) => {
  return api.get(`/bids/bids/${bidId}/`);
};

/**
 * Create a new bid on a project.
 * 
 * @param {Object} bidData - The bid data
 * @param {string|number} bidData.project - Project ID to bid on
 * @param {string} bidData.cover_letter - Cover letter text
 * @param {number} bidData.proposed_amount - Proposed price
 * @param {number} bidData.proposed_timeline - Number of days to complete
 * @param {Array} bidData.milestone_details - Optional array of milestone objects
 * @returns {Promise} Response with created bid
 * 
 * Example:
 * const newBid = await bidService.createBid({
 *   project: 456,
 *   cover_letter: 'I am interested in this project...',
 *   proposed_amount: 5000,
 *   proposed_timeline: 30,
 *   milestone_details: [
 *     { order: 1, title: 'Phase 1', duration_days: 10, amount: 2000, description: '...' }
 *   ]
 * });
 */
export const createBid = (bidData) => {
  return api.post('/bids/bids/', bidData);
};

/**
 * Update an existing bid (only works if bid is in 'pending' status).
 * 
 * @param {string|number} bidId - The ID of the bid to update
 * @param {Object} bidData - The updated bid data
 * @param {string} bidData.cover_letter - Updated cover letter
 * @param {number} bidData.proposed_amount - Updated price
 * @param {number} bidData.proposed_timeline - Updated timeline
 * @returns {Promise} Response with updated bid
 */
export const updateBid = (bidId, bidData) => {
  return api.patch(`/bids/bids/${bidId}/`, bidData);
};

/**
 * Change the status of a bid.
 * 
 * @param {string|number} bidId - The ID of the bid
 * @param {string} newStatus - The new status ('shortlisted', 'accepted', 'rejected', 'withdrawn')
 * @param {string} reason - Optional reason for the status change
 * @returns {Promise} Response with updated bid
 * 
 * Example:
 * await bidService.changeBidStatus(123, 'shortlisted', 'Good match for our project');
 */
export const changeBidStatus = (bidId, newStatus, reason = '') => {
  return api.post(`/bids/bids/${bidId}/change-status/`, {
    status: newStatus,
    reason: reason,
  });
};

/**
 * Withdraw a bid (service provider only).
 * 
 * @param {string|number} bidId - The ID of the bid to withdraw
 * @param {string} reason - Optional reason for withdrawal
 * @returns {Promise} Response confirming withdrawal
 */
export const withdrawBid = (bidId, reason = '') => {
  return api.post(`/bids/bids/${bidId}/withdraw/`, { reason });
};

/**
 * Get statistics for a specific bid.
 * 
 * @param {string|number} bidId - The ID of the bid
 * @returns {Promise} Response with bid statistics
 */
export const getBidStatistics = (bidId) => {
  return api.get(`/bids/bids/${bidId}/statistics/`);
};

/**
 * Add an attachment to a bid.
 * 
 * @param {string|number} bidId - The ID of the bid
 * @param {File} file - The file to upload
 * @param {string} description - Optional description of the file
 * @returns {Promise} Response with created attachment
 * 
 * Example:
 * const formData = new FormData();
 * formData.append('file', fileObject);
 * formData.append('bid', bidId);
 * formData.append('description', 'Portfolio sample');
 * await bidService.addAttachment(bidId, formData);
 */
export const addAttachment = (bidId, formData) => {
  return api.post('/bids/attachments/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

/**
 * Get AI-powered matching score for a project.
 * Uses AI to calculate how well the current user matches a project.
 * 
 * @param {string|number} projectId - The ID of the project
 * @param {number} limit - Maximum number of matches to return
 * @returns {Promise} Response with ranked provider matches
 * 
 * Example:
 * const matches = await bidService.getAIMatches(456, 10);
 */
export const getAIMatches = (projectId, limit = 10) => {
  return api.post(`/ai/match/project/${projectId}/providers/`, {}, {
    params: { limit }
  });
};

/**
 * Generate an AI-powered cover letter for a bid.
 * 
 * @param {string|number} projectId - The ID of the project
 * @returns {Promise} Response with generated cover letter text
 * 
 * Example:
 * const { data } = await bidService.generateCoverLetter(456);
 * setCoverLetter(data.cover_letter);
 */
export const generateCoverLetter = (projectId) => {
  return api.post('/ai/bid/generate-cover-letter/', {
    project_id: projectId,
  });
};

/**
 * Get AI-suggested pricing for a bid.
 * 
 * @param {string|number} projectId - The ID of the project
 * @returns {Promise} Response with pricing suggestions and analysis
 * 
 * Example:
 * const { data } = await bidService.suggestPricing(456);
 * setSuggestedPrice(data.suggested_amount);
 */
export const suggestPricing = (projectId) => {
  return api.post('/ai/bid/suggest-pricing/', {
    project_id: projectId,
  });
};

const bidService = {
  getBids,
  getBidById,
  createBid,
  updateBid,
  changeBidStatus,
  withdrawBid,
  getBidStatistics,
  addAttachment,
  getAIMatches,
  generateCoverLetter,
  suggestPricing,
};

export default bidService;
