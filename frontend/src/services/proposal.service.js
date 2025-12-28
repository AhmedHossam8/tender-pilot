import api from "../lib/api";

export const proposalService = {
  getProposals: (params = {}) => api.get("/proposals", { params }),

  getProposal: (id) => api.get(`/proposals/${id}`),

  generateProposal: (tenderId, payload) =>
    api.post(`/proposals/generate-from-tender/${tenderId}/`, payload),

  submitForReview: (id) => api.post(`/proposals/${id}/submit_for_review/`),

  approveProposal: (id) => api.post(`/proposals/${id}/approve/`),

  rejectProposal: (id) => api.post(`/proposals/${id}/reject/`),
  submitProposal: (id) => api.post(`/proposals/${id}/submit/`),

  regenerateSection: (proposalId, sectionId) =>
    api.post(`/proposals/${proposalId}/sections/${sectionId}/regenerate/`),

  generateDocument: (id) => api.post(`/proposals/${id}/generate-document/`),

  generateFeedback: (id) => api.post(`/proposals/${id}/generate_feedback/`),

  generateChecklist: (id) => api.post(`/proposals/${id}/generate-checklist/`),

  previewProposal: (id) =>
    api.get(`/proposals/${id}/preview/`, { responseType: "blob" }),

  getSectionFeedback: (sectionId) =>
    api.get(`/proposals/sections/${sectionId}/ai_feedback/`),
};
