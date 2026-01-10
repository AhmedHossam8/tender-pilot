import api from '@/lib/api';

/**
 * User Service - API endpoints for user management
 */
export const userService = {
  /**
   * Get current user info
   */
  getCurrentUser: async () => {
    return api.get('/users/me/');
  },

  /**
   * Update current user basic info
   */
  updateUserInfo: async (data) => {
    return api.patch('/users/me/update-info/', data);
  },

  /**
   * Get current user's profile
   */
  getMyProfile: async () => {
    return api.get('/users/me/profile/');
  },

  /**
   * Update current user's profile
   */
  updateProfile: async (data) => {
    return api.patch('/users/me/profile/', data);
  },

  /**
   * Change password
   */
  changePassword: async (currentPassword, newPassword) => {
    return api.post('/users/me/change-password/', {
      current_password: currentPassword,
      new_password: newPassword,
    });
  },

  /**
   * Get public profile
   */
  getPublicProfile: async (userId) => {
    return api.get(`/users/profiles/${userId}/`);
  },

  /**
   * Get provider stats
   */
  getProviderStats: async (userId) => {
    return api.get(`/users/profiles/${userId}/provider-stats/`);
  },

  /**
   * Get client stats
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
};

export default userService;
