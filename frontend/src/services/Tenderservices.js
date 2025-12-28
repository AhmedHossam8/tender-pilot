import api from "../lib/api";

/**
 * Service for handling tenders API requests.
 * All methods return the raw API response data.
 */
export const tenderService = {
  // Fetch all tenders, optionally with query parameters
  getTenders: (params = {}) => api.get("/tenders", { params }),

  // Fetch a single tender by ID
  getTender: (id) => api.get(`/tenders/${id}`),

  // Create a new tender
  createTender: (data) => api.post("/tenders", data),

  // Update an existing tender completely
  updateTender: (id, data) => api.put(`/tenders/${id}`, data),

  // Partially update an existing tender
  patchTender: (id, data) => api.patch(`/tenders/${id}`, data),

  // Delete a tender
  deleteTender: (id) => api.delete(`/tenders/${id}`),
};
