import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messagingService } from '@/services/messaging.service';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/contexts/authStore';

export const useMessages = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { user } = useAuthStore();

    // Fetch conversations
    const conversationsQuery = useQuery({
        queryKey: ['conversations'],
        queryFn: () => messagingService.getConversations().then(res => res.data.results),
    });

    // Fetch unread count
    const unreadCountQuery = useQuery({
        queryKey: ['unread-count'],
        queryFn: () => messagingService.getUnreadCount().then(res => res.data.results),
    });

    // Create a new conversation
    const createConversationMutation = useMutation({
        mutationFn: (participants) => messagingService.createConversation(participants),
        onSuccess: (data) => {
            queryClient.invalidateQueries(['conversations']);
            toast.success('Conversation started!');
            navigate(`/messages/${data.data.id}`); // navigate to new conversation
        },
        onError: () => toast.error('Failed to start conversation'),
    });

    return {
        conversationsQuery,
        unreadCountQuery,
        createConversationMutation,
    };
};
