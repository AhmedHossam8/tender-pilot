import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messagingService } from '@/services/messaging.service';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/contexts/authStore';

export const useMessages = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { user } = useAuthStore();

    const conversationsQuery = useQuery({
        queryKey: ['conversations'],
        queryFn: async () => {
            const data = await messagingService.getConversations();
            return data.results || []; // always return array
        },
    });

    const unreadCountQuery = useQuery({
        queryKey: ['unread-count'],
        queryFn: async () => {
            const count = await messagingService.getUnreadCount();
            return count ?? 0; // always return number
        },
    });

    const createConversationMutation = useMutation({
        mutationFn: ({ participants, projectId }) =>
            messagingService.createConversation(participants, projectId),
        onSuccess: (data) => {
            queryClient.invalidateQueries(['conversations']);
            queryClient.invalidateQueries(['unread-count']);
            toast.success('Conversation started!');
            navigate(`/messages/${data?.data?.id}`);
        },
        onError: () => toast.error('Failed to start conversation'),
    });

    return {
        conversationsQuery,
        unreadCountQuery,
        createConversationMutation,
    };
};
