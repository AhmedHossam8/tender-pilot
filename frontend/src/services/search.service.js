import api from '../lib/api';

/**
 * Search Service
 * Handles all search-related API calls
 */
const SearchService = {
  /**
   * Unified search across projects, services, and providers
   */
  search: async (query, options = {}) => {
    try {
      const params = new URLSearchParams({
        q: query,
        ...options
      });
      
      const response = await api.get(`/ai/search/?${params.toString()}`);
      return response.data || { projects: [], services: [], providers: [] };
    } catch (error) {
      console.error('Search error:', error);
      return { projects: [], services: [], providers: [] };
    }
  },

  /**
   * Get similar items based on an item
   */
  getSimilarItems: async (type, id, limit = 5) => {
    const response = await api.get('/ai/search/similar/', {
      params: { type, id, limit }
    });
    return response.data;
  },

  /**
   * Auto-categorize content
   */
  autoCategorize: async (text, contentType) => {
    const response = await api.post('/ai/search/auto-categorize/', {
      text,
      content_type: contentType
    });
    return response.data;
  },

  /**
   * Extract skills from text
   */
  extractSkills: async (text, maxSkills = 10) => {
    const response = await api.post('/ai/search/extract-skills/', {
      text,
      max_skills: maxSkills
    });
    return response.data;
  }
};

export default SearchService;
