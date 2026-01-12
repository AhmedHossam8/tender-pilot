import api from "../lib/api";


/**
 * Get all bids (filtered by type and status)
 * @param {Object} params - Query parameters
 * @param {string} params.type - Filter type: 'sent', 'received', or 'all'
 * @param {string} params.status - Filter by status: 'pending', 'shortlisted', 'accepted', etc.
 * @param {number} params.project - Filter by project ID
 * @returns {Promise} Array of bids
 */
export const getBids = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const url = queryString ? `/bids/?${queryString}` : `/bids/`;
  return api.get(url);
};

/**
 * Get a single bid by ID
 * @param {number} id - Bid ID
 * @returns {Promise} Bid details
 */
export const getBidById = async (id) => {
  return api.get(`/bids/${id}/`);
};

// Alias for backwards compatibility
export const getBid = getBidById;

/**
 * Create a new bid
 * @param {Object} bidData - Bid creation data
 * @param {number} bidData.project - Project ID
 * @param {string} bidData.cover_letter - Cover letter text
 * @param {number} bidData.proposed_amount - Proposed price
 * @param {number} bidData.proposed_timeline - Proposed timeline in days
 * @param {Array} bidData.milestone_details - Optional array of milestones
 * @returns {Promise} Created bid
 */
export const createBid = async (bidData) => {
  return api.post("/bids/", bidData);
};

/**
 * Update an existing bid (only if status is pending)
 * @param {number} id - Bid ID
 * @param {Object} bidData - Updated bid data
 * @returns {Promise} Updated bid
 */
export const updateBid = async (id, bidData) => {
  return api.patch(`/bids/${id}/`, bidData);
};

/**
 * Change bid status
 * @param {number} id - Bid ID
 * @param {string} status - New status
 * @param {string} reason - Optional reason for status change
 * @returns {Promise} Updated bid
 */
export const changeBidStatus = async (id, status, reason = "") => {
  return api.post(`/bids/${id}/change-status/`, { status, reason });
};

/**
 * Withdraw a bid (service provider only)
 * @param {number} id - Bid ID
 * @param {string} reason - Optional reason for withdrawal
 * @returns {Promise} Updated bid
 */
export const withdrawBid = async (id, reason = "") => {
  return api.post(`/bids/${id}/withdraw/`, { reason });
};

/**
 * Get bid statistics
 * @param {number} id - Bid ID
 * @returns {Promise} Bid statistics
 */
export const getBidStatistics = async (id) => {
  return api.get(`/bids/${id}/statistics/`);
};

/**
 * Get bid milestones
 * @param {number} bidId - Bid ID
 * @returns {Promise} Array of milestones
 */
export const getBidMilestones = async (bidId) => {
  return api.get(`/bids/milestones/?bid=${bidId}`);
};

/**
 * Create a bid milestone
 * @param {Object} milestoneData - Milestone data
 * @returns {Promise} Created milestone
 */
export const createBidMilestone = async (milestoneData) => {
  return api.post("/bids/milestones/", milestoneData);
};

/**
 * Update a bid milestone
 * @param {number} id - Milestone ID
 * @param {Object} milestoneData - Updated milestone data
 * @returns {Promise} Updated milestone
 */
export const updateBidMilestone = async (id, milestoneData) => {
  return api.patch(`/bids/milestones/${id}/`, milestoneData);
};

/**
 * Delete a bid milestone
 * @param {number} id - Milestone ID
 * @returns {Promise} Success response
 */
export const deleteBidMilestone = async (id) => {
  return api.delete(`/bids/milestones/${id}/`);
};

/**
 * Upload bid attachment
 * @param {number} bidId - Bid ID
 * @param {File} file - File to upload
 * @param {string} description - Optional file description
 * @returns {Promise} Created attachment
 */
export const uploadBidAttachment = async (bidId, file, description = "") => {
  const formData = new FormData();
  formData.append("bid", bidId);
  formData.append("file", file);
  formData.append("file_name", file.name);
  formData.append("file_type", file.type);
  formData.append("file_size", file.size);
  if (description) {
    formData.append("description", description);
  }

  return api.post("/bids/attachments/", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

/**
 * Get bid attachments
 * @param {number} bidId - Bid ID
 * @returns {Promise} Array of attachments
 */
export const getBidAttachments = async (bidId) => {
  return api.get(`/bids/attachments/?bid=${bidId}`);
};

/**
 * Delete bid attachment
 * @param {number} id - Attachment ID
 * @returns {Promise} Success response
 */
export const deleteBidAttachment = async (id) => {
  return api.delete(`/bids/attachments/${id}/`);
};

/**
 * AI-powered features for bids
 * Note: These endpoints are under the AI engine app
 */

/**
 * Generate AI cover letter for a bid
 * @param {number} projectId - Project ID
 * @param {Object} providerProfile - Service provider profile data
 * @returns {Promise} Generated cover letter
 */
export const generateAICoverLetter = async (projectId, providerProfile) => {
  return api.post("/ai/bid/generate/", {
    project_id: projectId,
    provider_profile: providerProfile,
  });
};

/**
 * Get AI pricing suggestion for a bid
 * @param {number} projectId - Project ID
 * @param {Object} providerHistory - Provider's past work history
 * @returns {Promise} Pricing suggestion
 */
export const getAIPricingSuggestion = async (projectId, providerHistory) => {
  return api.post("/ai/bid/pricing/", {
    project_id: projectId,
    provider_history: providerHistory,
  });
};

/**
 * Get AI match score for provider and project
 * @param {number} projectId - Project ID
 * @param {number} providerId - Service provider ID
 * @returns {Promise} Match score and analysis
 */
export const getAIMatchScore = async (projectId, providerId) => {
  return api.get(`/ai/match/?project=${projectId}&provider=${providerId}`);
};

/**
 * Compare multiple bids
 * @param {Array<number>} bidIds - Array of bid IDs to compare
 * @returns {Promise} Comparison data with AI insights
 */
export const compareBids = async (bidIds) => {
  return api.post("/bids/compare/", { bid_ids: bidIds });
};

export default {
  getBids,
  getBid,
  getBidById,
  createBid,
  updateBid,
  changeBidStatus,
  withdrawBid,
  getBidStatistics,
  getBidMilestones,
  createBidMilestone,
  updateBidMilestone,
  deleteBidMilestone,
  uploadBidAttachment,
  getBidAttachments,
  deleteBidAttachment,
  generateAICoverLetter,
  getAIPricingSuggestion,
  getAIMatchScore,
  compareBids,
};