import api from "../lib/api";

export const messagingService = {
  // Get list of all conversations
  getConversations: async () => {
    try {
      const res = await api.get('/messaging/conversations/');
      return { results: res?.data?.results || [] };
    } catch (err) {
      console.error("Failed to fetch conversations", err);
      return { results: [] };
    }
  },

  // Get conversations for a specific project
  getProjectConversations: async (projectId) => {
    try {
      const res = await api.get(`/messaging/conversations/?project_id=${projectId}`);
      return { results: res?.data?.results || [] };
    } catch (err) {
      console.error(`Failed to fetch conversations for project ${projectId}`, err);
      return { results: [] };
    }
  },

  // Create a new conversation
  createConversation: async (participants, projectId) => {
    try {
      const res = await api.post('/messaging/conversations/', {
        participants,
        project_id: projectId,
      });
      return { data: res?.data || null };
    } catch (err) {
      console.error("Failed to create conversation", err);
      throw err; // still throw so React Query can catch
    }
  },

  // Get messages for a conversation
  getMessages: async (conversationId) => {
    try {
      const res = await api.get(`/messaging/conversations/${conversationId}/messages/`);
      return { results: res?.data?.results || [] };
    } catch (err) {
      console.error(`Failed to fetch messages for conversation ${conversationId}`, err);
      return { results: [] };
    }
  },

  // Send a message
  sendMessage: async (conversationId, content) => {
    try {
      const res = await api.post(`/messaging/conversations/${conversationId}/send_message/`, { content });
      return { data: res?.data || null };
    } catch (err) {
      console.error(`Failed to send message to conversation ${conversationId}`, err);
      throw err;
    }
  },

  // Get unread count
  getUnreadCount: async () => {
    try {
      const res = await api.get('/messaging/unread-count/');
      // Ensure count is always a number
      return res?.data?.count ?? 0;
    } catch (err) {
      console.error("Failed to fetch unread count", err);
      return 0;
    }
  },
};
