import { useMessages } from '../../hooks/useMessages';
import { EmptyState } from '@/components/common';
import { Card, CardContent, Badge, Button } from '@/components/ui';
import { toast } from "sonner";
import { cn } from '@/lib/utils';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { User, Clock, Trash2, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/contexts/authStore';
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/Dialog";

const formatTimestamp = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const MessagesList = ({ providerId }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const { conversationsQuery, unreadCountQuery, createConversationMutation, deleteConversationMutation } = useMessages();
  const { data: conversationsRaw, isLoading: isLoadingConversations } = conversationsQuery;
  const { data: unreadCountData } = unreadCountQuery;
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const conversations = Array.isArray(conversationsRaw?.results ?? conversationsRaw)
    ? conversationsRaw?.results ?? conversationsRaw
    : [];

  const unreadCount = unreadCountData?.count ?? 0;

  if (isLoadingConversations) return <Card className="p-6 animate-pulse h-32" />;

  return (
    <div className="container mx-auto p-4 max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">{t('messages.title', 'Messages')}</h1>
        {unreadCount > 0 && (
          <Badge variant="destructive" className="text-lg px-3 py-1">
            {unreadCount} {t('messages.unread', 'unread')}
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

            createConversationMutation.mutate({ participants: [providerId] }, {
              onSuccess: (data) => {
                toast.success("Conversation started!");
                const conversationId = data?.data?.id;
                if (conversationId) navigate(`/app/messages/${conversationId}`);
              },
              onError: () => toast.error("Failed to start conversation"),
            });
          }}
        />
      ) : (
        <div className="space-y-4">
          {conversations.map((conv) => {
            const otherParticipants = conv.participants
              .filter(p => p.user !== user?.id)
              .map(p => p.name || `User ${p.user}`)
              .join(', ');

            return (
              <Card
                key={conv.id}
                className={cn(
                  "relative p-4 hover:shadow-lg transition-shadow cursor-pointer rounded-lg",
                  conv.unread_count > 0 && "border-primary"
                )}
              >
                <Link to={`/app/messages/${conv.id}`} className="block">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="h-4 w-4 text-gray-300 flex-shrink-0" />
                        <span className="font-semibold text-white truncate">{otherParticipants || 'Unknown'}</span>
                      </div>

                      {conv.last_message ? (
                        <p className="text-sm text-gray-300 truncate">
                          <span className="font-medium text-white">{conv.last_message?.sender_name || 'Unknown'}:</span> {conv.last_message.content}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-400 italic">{t('messages.noMessages', 'No messages yet')}</p>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-1 ml-4">
                      {conv.last_message && (
                        <span className="flex items-center gap-1 text-xs text-gray-400 whitespace-nowrap">
                          <Clock className="h-3 w-3" />
                          {formatTimestamp(conv.last_message.timestamp)}
                        </span>
                      )}
                      {conv.unread_count > 0 && (
                        <Badge variant="destructive" className="h-6 min-w-6">
                          {conv.unread_count > 99 ? '99+' : conv.unread_count}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Delete button */}
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDeleteTargetId(conv.id);
                    }}
                    className="absolute bottom-3 right-3 shadow-sm hover:bg-gray-500 text-destructive z-10 rounded-full mt-4"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </Link>
              </Card>
            );
          })}

          {/* Delete Dialog */}
          <Dialog
            open={deleteTargetId !== null}
            onOpenChange={(open) => {
              if (deleteConversationMutation.isPending) return;
              if (!open) setDeleteTargetId(null);
            }}
          >
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-white">{t("messages.deleteTitle", "Delete conversation")}</DialogTitle>
                <DialogDescription className="text-gray-300">
                  {t(
                    "messages.deleteDescription",
                    "This conversation will be permanently removed. This action cannot be undone."
                  )}
                </DialogDescription>
              </DialogHeader>

              <DialogFooter className="flex justify-end gap-2">
                <DialogClose asChild>
                  <Button variant="outline" disabled={deleteConversationMutation.isPending}>
                    {t("common.cancel", "Cancel")}
                  </Button>
                </DialogClose>

                <Button
                  variant="destructive"
                  disabled={deleteConversationMutation.isPending}
                  onClick={() => {
                    deleteConversationMutation.mutate(deleteTargetId, {
                      onSuccess: () => {
                        toast.success("Conversation deleted");
                        setDeleteTargetId(null);
                      },
                      onError: () => toast.error("Failed to delete conversation"),
                    });
                  }}
                >
                  {deleteConversationMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("common.deleting", "Deleting...")}
                    </>
                  ) : t("common.delete", "Delete")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
};

export default MessagesList;
