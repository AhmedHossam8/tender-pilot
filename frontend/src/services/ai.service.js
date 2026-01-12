import api from "../lib/api";
import i18n from "../i18n";

/**
 * Get current language for AI prompts
 */
const getCurrentLanguage = () => {
  const currentLang = i18n.language || 'en';
  return currentLang === 'ar' ? 'arabic' : 'english';
};

/**
 * Add language context to AI requests
 */
const addLanguageContext = (payload = {}) => {
  return {
    ...payload,
    language: getCurrentLanguage(),
    locale: i18n.language || 'en'
  };
};

/**
 * AI Engine Service
 * Handles all AI-related API calls with automatic language support
 */
export const aiService = {
  // Health check
  checkHealth: () => api.get("/ai/health/"),

  // Project analysis
  analyzeProject: (projectId, payload = {}) =>
    api.post(`/ai/project/${projectId}/analyze/`, addLanguageContext(payload)),

  // Compliance check
  checkCompliance: (projectId, payload = {}) =>
    api.post(`/ai/project/${projectId}/compliance/`, addLanguageContext(payload)),

  // Generate proposal outline
  generateOutline: (projectId, payload = {}) =>
    api.post(`/ai/project/${projectId}/outline/`, addLanguageContext(payload)),

  // Legacy aliases for backward compatibility
  analyzeTender: (projectId, payload = {}) =>
    api.post(`/ai/project/${projectId}/analyze/`, addLanguageContext(payload)),

  // Regenerate AI response
  regenerateResponse: (responseId, payload = {}) =>
    api.post(`/ai/response/${responseId}/regenerate/`, addLanguageContext(payload)),

  // Get regeneration history
  getRegenerationHistory: (responseId) =>
    api.get(`/ai/response/${responseId}/history/`),

  // Service description & packages optimization
  optimizeService: (payload = {}) => 
    api.post("/ai/service/optimize/", addLanguageContext(payload)),

  // Analytics endpoints
  getUsageAnalytics: (params = {}) =>
    api.get("/ai/analytics/usage", { params }),

  getUserUsageAnalytics: (userId, params = {}) =>
    api.get(`/ai/analytics/usage/user/${userId}`, { params }),

  getPerformanceAnalytics: (params = {}) =>
    api.get("/ai/analytics/performance", { params }),

  getCostAnalytics: (params = {}) =>
    api.get("/ai/analytics/costs", { params }),

  getPromptPerformance: (params = {}) =>
    api.get("/ai/analytics/prompts", { params }),
  
  // Bid Optimization endpoints with language support
  analyzeBidStrength: (bidId, payload = {}) =>
    api.post(`/ai/bids/${bidId}/analyze-strength/`, addLanguageContext(payload)),
  
  getRealtimeBidSuggestions: (bidData) =>
    api.post("/ai/bids/realtime-suggestions/", addLanguageContext(bidData)),
  
  optimizeBidPricing: (bidId, payload = {}) =>
    api.post(`/ai/bids/${bidId}/optimize-pricing/`, addLanguageContext(payload)),
  
  predictBidSuccess: (bidId, payload = {}) =>
    api.post(`/ai/bids/${bidId}/predict-success/`, addLanguageContext(payload)),
  
  // Smart Recommendations endpoints
  getPersonalizedRecommendations: (params = {}) => {
    const langParams = { ...params, language: getCurrentLanguage() };
    return api.get("/ai/recommendations/for-me/", { params: langParams });
  },
  
  getTrendingOpportunities: (params = {}) => {
    const langParams = { ...params, language: getCurrentLanguage() };
    return api.get("/ai/recommendations/trending/", { params: langParams });
  },
  
  getProjectOptimization: (projectId, params = {}) => {
    const langParams = { ...params, language: getCurrentLanguage() };
    return api.get(`/ai/recommendations/optimize-project/${projectId}/`, { params: langParams });
  },
};
