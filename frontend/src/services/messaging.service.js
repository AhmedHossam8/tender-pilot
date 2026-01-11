import api from "../lib/api";

export const messagingService = {
  // Get list of all conversations
  getConversations: async () => {
    try {
      const res = await api.get('/messaging/conversations/', {
        timeout: 30000, // Increase timeout to 30 seconds
      });
      return res?.data || [];
    } catch (err) {
      if (err.code === 'ECONNABORTED') {
      }
      throw err; // Re-throw to let React Query handle it
    }
  },

  // Create a new conversation
  createConversation: async (participants) => {
    try {
      const res = await api.post('/messaging/conversations/', { participants });
      return { data: res?.data || null };
    } catch (err) {
      throw err;
    }
  },

  // Get messages for a conversation
  getMessages: async (conversationId) => {
    try {
      const res = await api.get(`/messaging/conversations/${conversationId}/messages/`, {
        timeout: 30000,
      });
      return { results: res?.data || [] };
    } catch (err) {
      throw err; // Re-throw instead of returning empty results
    }
  },

  // Send a message
  sendMessage: async (conversationId, content) => {
    try {
      const res = await api.post(`/messaging/conversations/${conversationId}/send_message/`, { content });
      return { data: res?.data || null };
    } catch (err) {
      throw err;
    }
  },

  // Get unread count
  getUnreadCount: async () => {
    try {
      const res = await api.get('/messaging/unread-count/', {
        timeout: 30000,
      });
      return { count: res?.data?.count ?? 0 };
    } catch (err) {
      // Don't throw, just return 0 for unread count
      return { count: 0 };
    }
  },

  startConversation: async (projectId, providerId) => {
    try {
      const res = await api.post(`/messaging/conversations/`, {
        participants: [providerId],
        project_id: projectId,
      });
      return res?.data; // Make sure this returns the conversation object with id
    } catch (err) {
      throw err;
    }
  },
};