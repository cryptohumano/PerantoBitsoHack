import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { API_URL } from '../config/api';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { jwt } = useAuth();

  const fetchNotifications = async () => {
    if (!jwt) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/api/notifications`, {
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error al obtener notificaciones');
      }

      const data = await response.json();
      setNotifications(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    if (!jwt) return;
    
    try {
      const response = await fetch(`${API_URL}/api/notifications/unread-count`, {
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error al obtener conteo de notificaciones');
      }

      const data = await response.json();
      setUnreadCount(data.data?.count || 0);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!jwt) return;
    
    try {
      const response = await fetch(`${API_URL}/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error al marcar notificación como leída');
      }

      // Actualizar el estado local
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true }
            : notification
        )
      );
      
      // Actualizar el conteo de no leídas
      await fetchUnreadCount();
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    if (!jwt) return;
    
    try {
      const response = await fetch(`${API_URL}/api/notifications/mark-all-read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error al marcar todas las notificaciones como leídas');
      }

      // Actualizar el estado local
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    if (!jwt) return;
    
    try {
      const response = await fetch(`${API_URL}/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error al eliminar notificación');
      }

      // Actualizar el estado local
      setNotifications(prev => 
        prev.filter(notification => notification.id !== notificationId)
      );
      
      // Actualizar el conteo de no leídas
      await fetchUnreadCount();
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  // Cargar notificaciones al montar el componente
  useEffect(() => {
    if (jwt) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [jwt]);

  // Actualizar notificaciones cada 30 segundos
  useEffect(() => {
    if (!jwt) return;
    
    const interval = setInterval(() => {
      fetchNotifications();
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [jwt]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
} 