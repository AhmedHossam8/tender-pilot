import api from "../lib/api";

/**
 * Service for handling projects API requests.
 * All methods return the raw API response data.
 */
export const projectService = {
  // Fetch all projects, optionally with query parameters
  getProjects: (params = {}) => api.get("/projects/", { params }),

  // Fetch a single project by ID
  getProject: (id) => api.get(`/projects/${id}`),

  // Create a new project
  createProject: (data) =>
    api.post("/projects/", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),

  // Update an existing project completely
  updateProject: (id, data) => api.put(`/projects/${id}/`, data),

  // Partially update an existing project
  patchProject: (id, data) => api.patch(`/projects/${id}/`, data),

  // Update project status
  updateProjectStatus: (id, status) => api.patch(`/projects/${id}/`, { status }),

  // Delete a project
  deleteProject: (id) => api.delete(`/projects/${id}/`),

  startConversation: (projectId, providerId) => {
    return api.post(`/projects/${projectId}/start-conversation/`, { provider_id: providerId });
  },
};
