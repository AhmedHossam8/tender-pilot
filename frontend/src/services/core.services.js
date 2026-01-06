import api from "../lib/api";

export const coreService = {
  getCategories: () => api.get("/core/categories/"),
  getSkills: () => api.get("/core/skills/"),
};
