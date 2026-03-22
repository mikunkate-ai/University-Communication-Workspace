import React, { createContext, useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

export const SocketContext = createContext();

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const { token, user } = useAuth();

  useEffect(() => {
    if (!token || !user) return;

    const newSocket = io(SOCKET_URL, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      console.log('✓ Socket connected:', newSocket.id);
      setIsConnected(true);
      // Register user's personal room for targeted messaging
      newSocket.emit('register_user', user._id);
    });

    newSocket.on('disconnect', () => {
      console.log('✗ Socket disconnected');
      setIsConnected(false);
    });

    // Real-time message events — backend only emits to the recipient's socket
    // room, so every new_message received here is meant for this user
    newSocket.on('new_message', (message) => {
      const senderName = message.senderId?.firstName
        ? `${message.senderId.firstName} ${message.senderId.lastName}`
        : 'Someone';
      setNotifications(prev => [...prev, {
        type: 'message',
        data: {
          ...message,
          senderName,
          preview: message.content?.substring(0, 50) || '',
        },
        timestamp: new Date(),
      }]);
    });

    newSocket.on('message_read', (data) => {
      console.log('Message read:', data);
    });

    newSocket.on('user_typing', (data) => {
      setTypingUsers(prev => ({
        ...prev,
        [data.conversationId]: data,
      }));
    });

    newSocket.on('user_stopped_typing', (data) => {
      setTypingUsers(prev => {
        const updated = { ...prev };
        delete updated[data.conversationId];
        return updated;
      });
    });

    // Task and announcement events
    newSocket.on('task_created', ({ task, assignedTo }) => {
      // Only notify the students who were assigned — not the lecturer who created it
      const isAssigned = assignedTo?.some(id => id?.toString() === user._id?.toString());
      if (!isAssigned) return;
      setNotifications(prev => [...prev, {
        type: 'task',
        data: task,
        timestamp: new Date(),
      }]);
    });

    newSocket.on('new_announcement', (announcement) => {
      if (user?.role !== 'student') return;
      setNotifications(prev => [...prev, {
        type: 'announcement',
        data: announcement,
        timestamp: new Date(),
      }]);
    });

    newSocket.on('project_submission', (submission) => {
      // Only notify the lecturer — students don't need a notification for their own submission
      if (user?.role !== 'lecturer') return;
      setNotifications(prev => [...prev, {
        type: 'project',
        data: submission,
        timestamp: new Date(),
      }]);
    });

    // Appointment events — backend targets the right user room so no role filter needed
    newSocket.on('appointment_created', (appointment) => {
      setNotifications(prev => [...prev, {
        type: 'appointment',
        data: { ...appointment, action: 'created' },
        timestamp: new Date(),
      }]);
    });

    newSocket.on('appointment_status_updated', (appointment) => {
      setNotifications(prev => [...prev, {
        type: 'appointment',
        data: { ...appointment, action: appointment.status },
        timestamp: new Date(),
      }]);
    });

    newSocket.on('appointment_cancelled', (appointment) => {
      setNotifications(prev => [...prev, {
        type: 'appointment',
        data: { ...appointment, action: 'cancelled' },
        timestamp: new Date(),
      }]);
    });

    // Task status updated — notify the lecturer who created the task
    newSocket.on('task_status_updated', (task) => {
      const creatorId = (task.createdBy?._id || task.createdBy)?.toString();
      if (creatorId !== user._id?.toString()) return;
      setNotifications(prev => [...prev, {
        type: 'task',
        data: { ...task, action: 'status_updated' },
        timestamp: new Date(),
      }]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token, user]);

  // Join conversation room
  const joinConversation = useCallback((conversationId) => {
    if (socket && isConnected) {
      socket.emit('join_conversation', conversationId);
    }
  }, [socket, isConnected]);

  // Leave conversation room
  const leaveConversation = useCallback((conversationId) => {
    if (socket && isConnected) {
      socket.emit('leave_conversation', conversationId);
    }
  }, [socket, isConnected]);

  // Join group room
  const joinGroup = useCallback((groupId) => {
    if (socket && isConnected) {
      socket.emit('join_group', groupId);
    }
  }, [socket, isConnected]);

  // Leave group room
  const leaveGroup = useCallback((groupId) => {
    if (socket && isConnected) {
      socket.emit('leave_group', groupId);
    }
  }, [socket, isConnected]);

  // Send typing indicator
  const sendTyping = useCallback((conversationId, userName) => {
    if (socket && isConnected) {
      socket.emit('typing', {
        conversationId,
        userId: user?._id,
        userName,
      });
    }
  }, [socket, isConnected, user]);

  // Send stop typing indicator
  const sendStopTyping = useCallback((conversationId) => {
    if (socket && isConnected) {
      socket.emit('stop_typing', {
        conversationId,
        userId: user?._id,
      });
    }
  }, [socket, isConnected, user]);

  // Clear notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const value = {
    socket,
    isConnected,
    notifications,
    typingUsers,
    joinConversation,
    leaveConversation,
    joinGroup,
    leaveGroup,
    sendTyping,
    sendStopTyping,
    clearNotifications,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = React.useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};
