import api from "../lib/api";

export const projectMatchingService = {
  getMatches: (projectId, params = {}) =>
    api.get(`/projects/${projectId}/match-providers/`, { params }),
};