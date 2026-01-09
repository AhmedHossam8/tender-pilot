import { useMessages } from '../../hooks/useMessages';
import { EmptyState } from '@/components/common';
import { Skeleton, Card, CardContent, Badge } from '@/components/ui';
import { toast } from "sonner";
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { User, Clock } from 'lucide-react';

const MessagesList = ({ providerId, projectId }) => {
  const { t } = useTranslation();
  const { conversationsQuery, unreadCountQuery, createConversationMutation } = useMessages();
  const { data: conversations, isLoading: isLoadingConversations } = conversationsQuery;
  const { data: unreadCount } = unreadCountQuery;
  const navigate = useNavigate();

  if (isLoadingConversations) return <Skeleton />;

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">{t('messages.title', 'Messages')}</h1>
        {unreadCount?.unread_count > 0 && (
          <Badge variant="destructive" className="text-lg px-3 py-1">
            {unreadCount.unread_count} {t('messages.unread', 'unread')}
          </Badge>
        )}
      </div>

      {!conversations || conversations.length === 0 ? (
        <EmptyState
          illustration="no-results"
          title={t('messages.noConversations', 'No conversations yet')}
          description={t('messages.noMessages', 'Start a conversation to see messages here.')}
          actionLabel={t('messages.startConversation', 'Start Conversation')}
          action={() => {
            if (!providerId) return toast.error("No provider selected");

            createConversationMutation.mutate([providerId], {
              onSuccess: (data) => {
                toast.success("Conversation started!");
                navigate(`/messages/${data.data.id}`);
              },
              onError: () => toast.error("Failed to start conversation"),
            });
          }}
        />
      ) : (
        conversations.map((conv) => (
          <Link key={conv.id} to={`/messages/${conv.id}`}>
            {/* render conversation card */}
          </Link>
        ))
      )}
    </div>
  );
};

export default MessagesList;