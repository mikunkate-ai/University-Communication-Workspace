import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { messageService } from '../services/apiService';

export const useMessage = () => {
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { token, user } = useAuth();

  const fetchConversations = useCallback(async () => {
    if (!token) return [];
    setLoading(true);
    setError(null);
    try {
      const response = await messageService.getConversations();
      setConversations(response.data.conversations || []);
      return response.data.conversations || [];
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to fetch conversations';
      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchMessages = useCallback(async (userId, params = {}) => {
    if (!token) return [];
    setLoading(true);
    setError(null);
    try {
      const response = await messageService.getDirectMessages(userId, params);
      const raw = response.data.messages || [];
      const currentUserId = user?._id?.toString();
      const withOwn = raw.map(msg => ({
        ...msg,
        isOwn: (msg.senderId?._id || msg.senderId)?.toString() === currentUserId,
      }));
      setMessages(withOwn);
      return withOwn;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to fetch messages';
      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  const sendMessage = useCallback(async (recipientId, content, attachments = []) => {
    if (!token) return null;
    setError(null);
    try {
      const response = await messageService.send({ recipientId, content, attachments });
      // Handle different API response shapes
      const msgData = response.data.data || response.data.message || response.data;
      const sent = { ...msgData, isOwn: true, content };
      setMessages(prev => [...prev, sent]);
      return sent;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to send message';
      setError(message);
      return null;
    }
  }, [token]);

  const markAsRead = useCallback(async (messageId) => {
    if (!token) return;
    try {
      await messageService.markAsRead(messageId);
    } catch (err) {
      // silently ignore — read receipts are non-critical
    }
  }, [token]);

  const appendIncomingMessage = useCallback((msg) => {
    const currentUserId = user?._id?.toString();
    const withOwn = {
      ...msg,
      isOwn: (msg.senderId?._id || msg.senderId)?.toString() === currentUserId,
    };
    setMessages(prev => [...prev, withOwn]);
  }, [user]);

  // Add or update the sender's entry in the sidebar conversation list.
  // Called on every incoming socket message so the recipient sees the
  // conversation appear immediately without needing a page refresh.
  const upsertConversation = useCallback((msg) => {
    const senderId = (msg.senderId?._id || msg.senderId)?.toString();
    const senderInfo = typeof msg.senderId === 'object' ? msg.senderId : null;

    setConversations(prev => {
      const exists = prev.some(c => (c.user?._id || c._id)?.toString() === senderId);
      if (exists) {
        return prev.map(c => {
          const cId = (c.user?._id || c._id)?.toString();
          return cId === senderId ? { ...c, lastMessage: msg } : c;
        });
      }
      // New sender — prepend a conversation entry built from the message
      return [
        {
          _id: senderInfo?._id || senderId,
          user: senderInfo || { _id: senderId },
          lastMessage: msg,
        },
        ...prev,
      ];
    });
  }, []);

  // Clear only the messages in the chat — keeps the contact in the sidebar
  const clearMessages = useCallback(async (userId) => {
    if (!token) return false;
    // Clear local state immediately so the UI updates right away
    setMessages([]);
    try {
      const response = await messageService.getDirectMessages(userId, { limit: 1000 });
      const msgs = response.data.messages || [];
      await Promise.allSettled(msgs.map(msg => messageService.delete(msg._id)));
    } catch (err) {
      // Even if API fails, local state is already cleared
    }
    return true;
  }, [token]);

  // Delete contact — removes messages AND removes the conversation from the sidebar
  const deleteContact = useCallback(async (userId) => {
    if (!token) return false;
    // Remove from sidebar immediately (optimistic update)
    setConversations(prev => prev.filter(c => (c.user?._id || c.user)?.toString() !== userId?.toString()));
    setMessages([]);
    try {
      const response = await messageService.getDirectMessages(userId, { limit: 1000 });
      const msgs = response.data.messages || [];
      await Promise.allSettled(msgs.map(msg => messageService.delete(msg._id)));
    } catch (err) {
      // Local state is already updated — contact is removed from sidebar
    }
    return true;
  }, [token]);

  return {
    messages,
    conversations,
    loading,
    error,
    fetchConversations,
    fetchMessages,
    sendMessage,
    markAsRead,
    appendIncomingMessage,
    upsertConversation,
    clearMessages,
    deleteContact,
    setMessages,
  };
};
