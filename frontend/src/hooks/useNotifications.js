import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/services/notification.service";

export function useNotifications() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await notificationService.getNotifications();
      return res.data;
    },
    // refetchInterval: 1500, // uncomment if you want "real-time"
  });

  const markRead = useMutation({
    mutationFn: (id) => notificationService.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  // Ensure notifications is always an array
  const notifications = Array.isArray(query.data)
    ? query.data
    : query.data?.results ?? [];

  // Compute unread notifications
  const unread = notifications.filter((n) => !n.is_read);
  const unreadCount = unread.length;

  return { ...query, notifications, unread, unreadCount, markRead };
}
