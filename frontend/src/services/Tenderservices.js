import api from "./api";

const TenderServices = {
  getAllTenders: async () => {
    try {
        const response = await api.get("/tenders/");
        console.log("API response data:", response.data);
      return Array.isArray(response.data)
        ? response.data
        : response.data.results || [];
    } catch (err) {
      console.error("Error fetching tenders:", err.response || err);
      throw err;
    }
  },

  getTenderById: async (id) => {
    try {
      const response = await api.get(`/tenders/${id}/`);
      return response.data;
    } catch (err) {
      console.error(`Error fetching tender ${id}:`, err.response || err);
      throw err;
    }
  },

  createTender: async (data) => {
    try {
      const response = await api.post("/tenders/", data);
      return response.data;
    } catch (err) {
      console.error("Error creating tender:", err.response || err);
      throw err;
    }
  },

  updateTender: async (id, data) => {
    try {
      const response = await api.put(`/tenders/${id}/`, data);
      return response.data;
    } catch (err) {
      console.error(`Error updating tender ${id}:`, err.response || err);
      throw err;
    }
  },

  patchTender: async (id, data) => {
    try {
      const response = await api.patch(`/tenders/${id}/`, data);
      return response.data;
    } catch (err) {
      console.error(`Error patching tender ${id}:`, err.response || err);
      throw err;
    }
  },

  deleteTender: async (id) => {
    try {
      const response = await api.delete(`/tenders/${id}/`);
      return response.data;
    } catch (err) {
      console.error(`Error deleting tender ${id}:`, err.response || err);
      throw err;
    }
  },
};

export default TenderServices;
