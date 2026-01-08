import { useMessages } from '../../hooks/useMessages';
import { EmptyState } from '@/components/common';
import { Skeleton, Card, CardContent, Badge } from '@/components/ui';
import { toast } from "sonner";
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { User, Clock } from 'lucide-react';

const MessagesList = () => {
  const { t } = useTranslation();
  const { conversationsQuery, unreadCountQuery, createConversationMutation } = useMessages();

  const { data: conversations, isLoading: isLoadingConversations, error } = conversationsQuery;
  const { data: unreadCount } = unreadCountQuery;

  if (isLoadingConversations) {
    return (
      <div className="container mx-auto p-4 space-y-4">
        <Skeleton className="h-10 w-64" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now - date;
    const diffInHours = diffInMs / (1000 * 60 * 60);
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString();
  };

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
          action={() => createConversationMutation.mutate([/* participant IDs here */])}
        />
      ) : (
        <div className="space-y-3">
          {conversations.map((conv) => (
            <Link key={conv.id} to={`/app/messages/${conv.id}`} className="block">
              <Card className={cn(
                "hover:shadow-md transition-shadow cursor-pointer",
                conv.unread_count > 0 && "border-primary"
              )}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="font-semibold truncate">
                          {conv.participants.map(p => p.user).join(', ') || `Conversation ${conv.id}`}
                        </span>
                      </div>

                      {conv.last_message ? (
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium">{conv.last_message.sender}:</span>{' '}
                          <span className="truncate">{conv.last_message.content}</span>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground italic">
                          {t('messages.noMessages', 'No messages yet')}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2 ml-4">
                      {conv.last_message && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                          <Clock className="h-3 w-3" />
                          {formatTimestamp(conv.last_message.timestamp)}
                        </div>
                      )}
                      {conv.unread_count > 0 && (
                        <Badge variant="destructive" className="h-6 min-w-6">
                          {conv.unread_count > 99 ? '99+' : conv.unread_count}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default MessagesList;