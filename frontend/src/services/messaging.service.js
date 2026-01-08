import api from "../lib/api";

export const messagingService = {
  // Get list of conversations
  getConversations: () => api.get('/messaging/conversations/'),

  // Create a new conversation
  createConversation: (participants) => api.post('/messaging/conversations/', { participants }),

  // Get messages for a conversation
  getMessages: (conversationId) => api.get(`/messaging/conversations/${conversationId}/messages/`),

  // Send a message
  sendMessage: (conversationId, content) => api.post(`/messaging/conversations/${conversationId}/send_message/`, { content }),

  // Get unread count
  getUnreadCount: () => api.get('/messaging/unread-count/'),
};