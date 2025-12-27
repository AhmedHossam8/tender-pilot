import api from "./api";

/**
 * AI Engine Service
 * Handles all AI-related API calls
 */
export const aiService = {
  // Health check
  checkHealth: () => api.get("/ai/health/"),

  // Tender analysis
  analyzeTender: (tenderId, payload = {}) =>
    api.post(`/ai/tender/${tenderId}/analyze/`, payload),

  // Compliance check
  checkCompliance: (tenderId, payload = {}) =>
    api.post(`/ai/tender/${tenderId}/compliance/`, payload),

  // Generate proposal outline
  generateOutline: (tenderId, payload = {}) =>
    api.post(`/ai/tender/${tenderId}/outline/`, payload),

  // Regenerate AI response
  regenerateResponse: (responseId, payload = {}) =>
    api.post(`/ai/response/${responseId}/regenerate/`, payload),

  // Get regeneration history
  getRegenerationHistory: (responseId) =>
    api.get(`/ai/response/${responseId}/history/`),

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
};
