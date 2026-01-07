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
