import api from "@/lib/api";

export const notificationService = {
    getNotifications: () => api.get("/notifications/"),
    markRead: (id) => api.post(`/notifications/${id}/mark_read/`),
    markAllRead: () => api.post("/notifications/mark_all_read/"),
};
