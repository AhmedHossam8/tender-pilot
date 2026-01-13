import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { messagingService } from '@/services/messaging.service';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/contexts/authStore';
import { toast } from "sonner";
import { EmptyState } from '@/components/common';

const ChatPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);

  const { data: messages = [], isLoading, error, isError } = useQuery({
    queryKey: ['messages', id],
    queryFn: async () => {
      try {
        const res = await messagingService.getMessages(id);
        return res.results || [];
      } catch (err) {
        console.error('Error fetching messages:', err);
        throw err;
      }
    },
    refetchInterval: 5000,
    retry: 2,
    retryDelay: 1000,
    enabled: !!id,
    staleTime: 1000,
  });

  const sendMutation = useMutation({
    mutationFn: (content) => messagingService.sendMessage(id, content),
    onSuccess: () => {
      queryClient.invalidateQueries(['messages', id]);
      queryClient.invalidateQueries(['conversations']);
      queryClient.invalidateQueries(['unread-count']);
      setMessage('');
    },
    onError: (error) => {
      console.error('Error sending message:', error);
      toast.error(t('notifications.error'));
    }
  });

  const handleSend = (e) => {
    e.preventDefault();
    if (message.trim() && !sendMutation.isPending) {
      sendMutation.mutate(message);
    }
  };

  useEffect(() => {
    if (messages && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (isError) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <Card className="bg-gray-900 text-white">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <h2 className="text-xl font-semibold text-destructive">
                Failed to load conversation
              </h2>
              <p className="text-gray-300">
                {error?.message || 'An error occurred while loading messages'}
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => navigate('/app/messages')} variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Messages
                </Button>
                <Button onClick={() => queryClient.invalidateQueries(['messages', id])}>
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    try {
      return new Date(timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (err) {
      return '';
    }
  };

  return (
    <div className="container mx-auto p-4 h-screen flex flex-col max-w-4xl bg-[#101825]">
      {/* Header */}
      <Card className="mb-4 bg-gray-900 text-white">
        <CardHeader className="flex flex-row items-center gap-4 py-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/app/messages')}
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </Button>
          <CardTitle className="text-xl text-white">
            {t('chat.title', 'Conversation')}
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Messages Area */}
      <Card className="flex-1 flex flex-col overflow-hidden bg-gray-900 text-white">
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-3/4 bg-gray-700" />
              ))}
            </div>
          ) : !messages || messages.length === 0 ? (
            <EmptyState
              illustration="no-results"
              title={t('chat.noMessages', 'No messages yet')}
              description={t('chat.startConversation', 'Start typing below to send a message.')}
            />
          ) : (
            messages.map((msg) => {
              const isOwnMessage = msg.sender === user?.id;

              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex flex-col max-w-[70%]",
                    isOwnMessage ? "ml-auto items-end" : "mr-auto items-start"
                  )}
                >
                  <div
                    className={cn(
                      "rounded-lg px-4 py-2",
                      isOwnMessage
                        ? "bg-primary text-white"
                        : "bg-gray-700 text-white"
                    )}
                  >
                    {!isOwnMessage && msg.sender_name && (
                      <div className="text-xs font-semibold mb-1 text-gray-300">
                        {msg.sender_name}
                      </div>
                    )}
                    <div className="break-words">{msg.content}</div>
                  </div>
                  <div className="text-xs text-gray-400 mt-1 px-2">
                    {formatTime(msg.timestamp)}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </CardContent>

        {/* Input Area */}
        <div className="border-t border-gray-700 p-4">
          <form onSubmit={handleSend} className="flex gap-2">
            <Input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('chat.placeholder', 'Type a message...')}
              disabled={sendMutation.isPending || isLoading}
              className="flex-1 bg-gray-800 text-white placeholder-gray-400 border-gray-600 focus:border-primary focus:ring-primary"
              autoFocus
            />
            <Button
              type="submit"
              disabled={sendMutation.isPending || !message.trim() || isLoading}
              size="icon"
            >
              {sendMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin text-white" />
              ) : (
                <Send className="h-4 w-4 text-white" />
              )}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default ChatPage;
