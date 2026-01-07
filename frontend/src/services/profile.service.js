import api from '../lib/api';

/**
 * Profile Management Service
 * Handles all profile-related API calls
 */
const ProfileService = {
  /**
   * Get current user's full profile
   */
  getMyProfile: async () => {
    return api.get('/users/me/profile/');
  },

  /**
   * Update current user's profile
   * @param {Object} profileData - Profile fields to update
   */
  updateMyProfile: async (profileData) => {
    return api.patch('/users/me/profile/', profileData);
  },

  /**
   * Get public profile of any user
   * @param {number} userId - User ID
   */
  getPublicProfile: async (userId) => {
    return api.get(`/users/profiles/${userId}/`);
  },

  /**
   * Get provider statistics
   * @param {number} userId - User ID
   */
  getProviderStats: async (userId) => {
    return api.get(`/users/profiles/${userId}/provider-stats/`);
  },

  /**
   * Get client statistics
   * @param {number} userId - User ID
   */
  getClientStats: async (userId) => {
    return api.get(`/users/profiles/${userId}/client-stats/`);
  },

  /**
   * Get all available skills
   */
  getSkills: async () => {
    return api.get('/users/skills/');
  },

  /**
   * Upload profile avatar
   * @param {File} file - Image file
   */
  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.patch('/users/me/profile/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export default ProfileService;
