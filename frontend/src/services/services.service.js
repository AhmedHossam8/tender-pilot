import api from "@/lib/api";

export const serviceService = {
    // Services
    getAll: () => api.get("/services/services/"),
    getById: (id) => api.get(`/services/services/${id}/`),
    create: (data) => api.post("/services/services/", data),
    update: (id, data) => api.patch(`/services/services/${id}/`, data),
    delete: (id) => api.delete(`/services/services/${id}/`),

    // Service Packages
    // getPackages: () => api.get("/services/packages/"),
    // getPackageById: (id) => api.get(`/services/packages/${id}/`),
    // createPackage: (data) => api.post("/services/packages/", data),
    // updatePackage: (id, data) => api.patch(`/services/packages/${id}/`, data),
    // deletePackage: (id) => api.delete(`/services/packages/${id}/`),

    // Bookings
    getBookings: () => api.get("/services/bookings/"),
    getBookingById: (id) => api.get(`/services/bookings/${id}/`),
    createBooking: (data) => api.post("/services/bookings/", data),
    updateBooking: (id, data) => api.patch(`/services/bookings/${id}/`, data),
    deleteBooking: (id) => api.delete(`/services/bookings/${id}/`),
};
