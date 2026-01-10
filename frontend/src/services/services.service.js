import api from "@/lib/api";

export const serviceService = {
    // Services
    getAll: () => api.get("/services/services/"),
    getById: (id) => api.get(`/services/services/${id}/`),
    create: (data) => api.post("/services/services/", data),
    update: (id, data) => api.patch(`/services/services/${id}/`, data),
    delete: (id) => api.delete(`/services/services/${id}/`),

    // Service Packages (nested under service)
    getPackages: (serviceId) => api.get(`/services/services/${serviceId}/packages/`),
    getPackageById: (serviceId, pkgId) => api.get(`/services/services/${serviceId}/packages/${pkgId}/`),
    createPackage: (serviceId, data) => api.post(`/services/services/${serviceId}/packages/`, data),
    updatePackage: (serviceId, pkgId, data) => api.patch(`/services/services/${serviceId}/packages/${pkgId}/`, data),
    deletePackage: (serviceId, pkgId) => api.delete(`/services/services/${serviceId}/packages/${pkgId}/`),

    // Bookings
    getBookings: () => api.get("/services/bookings/"),
    getBookingById: (id) => api.get(`/services/bookings/${id}/`),
    createBooking: (data) => api.post("/services/bookings/", data),
    updateBooking: (id, data) => api.patch(`/services/bookings/${id}/`, data),
    deleteBooking: (id) => api.delete(`/services/bookings/${id}/`),
};
