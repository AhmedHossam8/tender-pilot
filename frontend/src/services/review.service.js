/**
 * Review Service
 * API client for review and rating operations
 */
import api from '@/lib/api';

const reviewService = {
  /**
   * Create a new review
   * @param {Object} reviewData - Review data
   * @param {number} reviewData.reviewee - ID of user being reviewed
   * @param {number} reviewData.rating - Rating 1-5
   * @param {string} reviewData.comment - Review text
   * @param {number} [reviewData.project] - Optional project ID
   * @param {number} [reviewData.booking] - Optional booking ID
   * @param {boolean} [reviewData.is_public=true] - Public visibility
   * @returns {Promise<Object>} Created review
   */
  createReview: async (reviewData) => {
    const response = await api.post('/users/reviews/', reviewData);
    return response.data;
  },

  /**
   * Get all reviews with optional filters
   * @param {Object} params - Query parameters
   * @param {number} [params.reviewee] - Filter by reviewee ID
   * @param {number} [params.reviewer] - Filter by reviewer ID
   * @param {number} [params.project] - Filter by project ID
   * @param {number} [params.booking] - Filter by booking ID
   * @returns {Promise<Array>} Array of reviews
   */
  getReviews: async (params = {}) => {
    const response = await api.get('/users/reviews/', { params });
    return response.data;
  },

  /**
   * Get a specific review by ID
   * @param {number} reviewId - Review ID
   * @returns {Promise<Object>} Review details
   */
  getReview: async (reviewId) => {
    const response = await api.get(`/users/reviews/${reviewId}/`);
    return response.data;
  },

  /**
   * Update a review
   * @param {number} reviewId - Review ID
   * @param {Object} updateData - Fields to update
   * @returns {Promise<Object>} Updated review
   */
  updateReview: async (reviewId, updateData) => {
    const response = await api.patch(`/users/reviews/${reviewId}/`, updateData);
    return response.data;
  },

  /**
   * Delete a review
   * @param {number} reviewId - Review ID
   * @returns {Promise<void>}
   */
  deleteReview: async (reviewId) => {
    await api.delete(`/users/reviews/${reviewId}/`);
  },

  /**
   * Get review summary/statistics for a user
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Review summary with average_rating, total_reviews, rating_distribution, recent_reviews
   */
  getReviewSummary: async (userId) => {
    const response = await api.get('/users/reviews/summary/', {
      params: { user_id: userId }
    });
    return response.data;
  },

  /**
   * Respond to a review (reviewee only)
   * @param {number} reviewId - Review ID
   * @param {string} responseText - Response content
   * @returns {Promise<Object>} Created response
   */
  respondToReview: async (reviewId, responseText) => {
    const response = await api.post(`/users/reviews/${reviewId}/respond/`, {
      response_text: responseText
    });
    return response.data;
  },

  /**
   * Get AI-suggested response to a review (reviewee only)
   * @param {number} reviewId - Review ID
   * @returns {Promise<Object>} Object with suggested_response text
   */
  getSuggestedResponse: async (reviewId) => {
    const response = await api.get(`/users/reviews/${reviewId}/suggest-response/`);
    return response.data;
  },

  /**
   * Flag a review for moderation
   * @param {number} reviewId - Review ID
   * @returns {Promise<Object>} Status message
   */
  flagReview: async (reviewId) => {
    const response = await api.post(`/users/reviews/${reviewId}/flag/`);
    return response.data;
  },

  /**
   * Check if user can review another user for a project/booking
   * @param {number} revieweeId - ID of user to review
   * @param {number} projectId - Project ID (if applicable)
   * @param {number} bookingId - Booking ID (if applicable)
   * @returns {Promise<boolean>} Whether user can review
   */
  canReview: async (revieweeId, projectId = null, bookingId = null) => {
    try {
      const params = { reviewee: revieweeId };
      if (projectId) params.project = projectId;
      if (bookingId) params.booking = bookingId;
      
      const reviews = await reviewService.getReviews(params);
      // If any review exists, user already reviewed
      return reviews.length === 0;
    } catch (error) {
      console.error('Error checking review eligibility:', error);
      return false;
    }
  }
};

export default reviewService;
