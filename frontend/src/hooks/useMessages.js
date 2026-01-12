import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messagingService } from '@/services/messaging.service';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export const useMessages = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const conversationsQuery = useQuery({
        queryKey: ['conversations'],
        queryFn: async () => {
            try {
                const data = await messagingService.getConversations();
                return Array.isArray(data) ? data : [];
            } catch (error) {
                console.error('Error fetching conversations:', error);
                throw error;
            }
        },
        retry: 2,
        retryDelay: 1000,
        staleTime: 5000,
    });

    const unreadCountQuery = useQuery({
        queryKey: ['unread-count'],
        queryFn: async () => {
            try {
                const result = await messagingService.getUnreadCount();
                return result;
            } catch (error) {
                console.error('Failed to fetch unread count:', error);
                return { count: 0 };
            }
        },
        retry: 1,
        retryDelay: 1000,
        staleTime: 5000,
    });

    const createConversationMutation = useMutation({
        mutationFn: ({ participants }) =>
            messagingService.createConversation(participants),
        onSuccess: (data) => {
            queryClient.invalidateQueries(['conversations']);
            queryClient.invalidateQueries(['unread-count']);
            toast.success('Conversation started!');
            if (data?.data?.id) {
                navigate(`/app/messages/${data.data.id}`);
            }
        },
        onError: (error) => {
            console.error('Error creating conversation:', error);
            toast.error('Failed to start conversation');
        },
    });

    const deleteConversationMutation = useMutation({
        mutationFn: messagingService.deleteConversation,
        onSuccess: () => {
            queryClient.invalidateQueries(["conversations"]);
            queryClient.invalidateQueries(["unread-count"]);
        },
    });

    return {
        conversationsQuery,
        unreadCountQuery,
        createConversationMutation,
        deleteConversationMutation,
    };
};