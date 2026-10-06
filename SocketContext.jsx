import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { api } from '../services/api';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestToast, setLatestToast] = useState(null);

  // Load initial notifications from database
  const loadNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.getMyNotifications();
      if (res.success) {
        setNotifications(res.notifications || []);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    if (!user) {
      if (socket) socket.disconnect();
      setSocket(null);
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    loadNotifications();

    const token = localStorage.getItem('campusflow_token');
    const s = io(window.location.origin, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    s.on('connect', () => {
      console.log('[Socket.IO] Connected to real-time event gateway');
    });

    s.on('notification', (newNotif) => {
      console.log('[Socket.IO] Real-time notification received:', newNotif);
      setNotifications(prev => [newNotif, ...prev]);
      setUnreadCount(prev => prev + 1);
      setLatestToast(newNotif);

      // Auto dismiss toast after 6 seconds
      setTimeout(() => {
        setLatestToast(curr => (curr?.id === newNotif.id ? null : curr));
      }, 6000);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [user]);

  const markAsRead = async (id) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await api.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <SocketContext.Provider value={{
      socket,
      notifications,
      unreadCount,
      latestToast,
      clearToast: () => setLatestToast(null),
      markAsRead,
      markAllAsRead,
      deleteNotification,
      refreshNotifications: loadNotifications
    }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
