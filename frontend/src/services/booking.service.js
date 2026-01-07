import api from "@/lib/api";

export const bookingService = {
    getAll: () => api.get("/services/bookings/"),
    create: (data) => api.post("/services/bookings/", data),
    update: (id, data) => api.patch(`/services/bookings/${id}/`, data),
};
