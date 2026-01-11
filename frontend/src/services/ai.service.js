import api from "../lib/api";

/**
 * AI Engine Service
 * Handles all AI-related API calls
 */
export const aiService = {
  // Health check
  checkHealth: () => api.get("/ai/health/"),

  // Project analysis
  analyzeProject: (projectId, payload = {}) =>
    api.post(`/ai/project/${projectId}/analyze/`, payload),

  // Compliance check
  checkCompliance: (projectId, payload = {}) =>
    api.post(`/ai/project/${projectId}/compliance/`, payload),

  // Generate proposal outline
  generateOutline: (projectId, payload = {}) =>
    api.post(`/ai/project/${projectId}/outline/`, payload),

  // Legacy aliases for backward compatibility
  analyzeTender: (projectId, payload = {}) =>
    api.post(`/ai/project/${projectId}/analyze/`, payload),

  // Regenerate AI response
  regenerateResponse: (responseId, payload = {}) =>
    api.post(`/ai/response/${responseId}/regenerate/`, payload),

  // Get regeneration history
  getRegenerationHistory: (responseId) =>
    api.get(`/ai/response/${responseId}/history/`),

  // Service description & packages optimization
  optimizeService: (payload = {}) => api.post("/ai/service/optimize/", payload),

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
  
  // Bid Optimization endpoints
  analyzeBidStrength: (bidId) =>
    api.post(`/ai/bids/${bidId}/analyze-strength/`),
  
  getRealtimeBidSuggestions: (bidData) =>
    api.post("/ai/bids/realtime-suggestions/", bidData),
  
  optimizeBidPricing: (bidId) =>
    api.post(`/ai/bids/${bidId}/optimize-pricing/`),
  
  predictBidSuccess: (bidId) =>
    api.post(`/ai/bids/${bidId}/predict-success/`),
  
  // Smart Recommendations endpoints
  getPersonalizedRecommendations: (params = {}) =>
    api.get("/ai/recommendations/for-me/", { params }),
  
  getTrendingOpportunities: (params = {}) =>
    api.get("/ai/recommendations/trending/", { params }),
  
  getProjectOptimization: (projectId) =>
    api.get(`/ai/recommendations/optimize-project/${projectId}/`),
};
