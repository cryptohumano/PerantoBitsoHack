import { Request, Response } from 'express';
import { NotificationService } from '../services/notificationService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class NotificationController {
  // Obtener notificaciones del usuario
  async getUserNotifications(req: Request, res: Response) {
    try {
      const userId = req.user?.did;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Usuario no autenticado'
        });
      }

      // Obtener el ID del usuario por su DID
      const user = await prisma.user.findUnique({
        where: { did: userId },
        select: { id: true }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado'
        });
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const notifications = await NotificationService.getUserNotifications(user.id, limit);

      res.json({
        success: true,
        data: notifications,
        total: notifications.length
      });
    } catch (error) {
      console.error('[NotificationController] Error obteniendo notificaciones:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }

  // Marcar notificación como leída
  async markAsRead(req: Request, res: Response) {
    try {
      const { notificationId } = req.params;
      const userId = req.user?.did;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Usuario no autenticado'
        });
      }

      // Obtener el ID del usuario por su DID
      const user = await prisma.user.findUnique({
        where: { did: userId },
        select: { id: true }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado'
        });
      }

      const notification = await NotificationService.markAsRead(notificationId);

      res.json({
        success: true,
        data: notification,
        message: 'Notificación marcada como leída'
      });
    } catch (error) {
      console.error('[NotificationController] Error marcando notificación como leída:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }

  // Marcar todas las notificaciones como leídas
  async markAllAsRead(req: Request, res: Response) {
    try {
      const userId = req.user?.did;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Usuario no autenticado'
        });
      }

      // Obtener el ID del usuario por su DID
      const user = await prisma.user.findUnique({
        where: { did: userId },
        select: { id: true }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado'
        });
      }

      await NotificationService.markAllAsRead(user.id);

      res.json({
        success: true,
        message: 'Todas las notificaciones marcadas como leídas'
      });
    } catch (error) {
      console.error('[NotificationController] Error marcando todas las notificaciones como leídas:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }

  // Obtener conteo de notificaciones no leídas
  async getUnreadCount(req: Request, res: Response) {
    try {
      const userId = req.user?.did;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Usuario no autenticado'
        });
      }

      // Obtener el ID del usuario por su DID
      const user = await prisma.user.findUnique({
        where: { did: userId },
        select: { id: true }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado'
        });
      }

      const count = await NotificationService.getUnreadCount(user.id);

      res.json({
        success: true,
        data: { count }
      });
    } catch (error) {
      console.error('[NotificationController] Error obteniendo conteo de notificaciones:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }

  // Eliminar notificación
  async deleteNotification(req: Request, res: Response) {
    try {
      const { notificationId } = req.params;
      const userId = req.user?.did;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Usuario no autenticado'
        });
      }

      // Obtener el ID del usuario por su DID
      const user = await prisma.user.findUnique({
        where: { did: userId },
        select: { id: true }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado'
        });
      }

      const notification = await NotificationService.deleteNotification(notificationId, user.id);

      res.json({
        success: true,
        data: notification,
        message: 'Notificación eliminada'
      });
    } catch (error) {
      console.error('[NotificationController] Error eliminando notificación:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }
} 