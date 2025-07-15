import { PrismaClient, NotificationType } from '@prisma/client';

const prisma = new PrismaClient();

export interface NotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
}

export class NotificationService {
  // Crear una nueva notificación
  static async createNotification(notificationData: NotificationData) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: notificationData.userId,
          type: notificationData.type,
          title: notificationData.title,
          message: notificationData.message,
          data: notificationData.data ? JSON.stringify(notificationData.data) : undefined
        }
      });

      console.log(`[NotificationService] Notificación creada: ${notification.id} para usuario ${notificationData.userId}`);
      return notification;
    } catch (error) {
      console.error('[NotificationService] Error creando notificación:', error);
      throw error;
    }
  }

  // Crear notificación de cambio de rol
  static async createRoleChangeNotification(
    userId: string, 
    oldRoles: string[], 
    newRoles: string[], 
    changedBy: string
  ) {
    const addedRoles = newRoles.filter(role => !oldRoles.includes(role));
    const removedRoles = oldRoles.filter(role => !newRoles.includes(role));

    let title = 'Cambio de Roles';
    let message = '';

    if (addedRoles.length > 0 && removedRoles.length > 0) {
      message = `Tus roles han sido actualizados. Roles agregados: ${addedRoles.join(', ')}. Roles removidos: ${removedRoles.join(', ')}.`;
    } else if (addedRoles.length > 0) {
      message = `Se te han asignado nuevos roles: ${addedRoles.join(', ')}.`;
    } else if (removedRoles.length > 0) {
      message = `Se te han removido los siguientes roles: ${removedRoles.join(', ')}.`;
    } else {
      message = 'Tus roles han sido actualizados.';
    }

    message += ` Cambio realizado por: ${changedBy}`;

    return this.createNotification({
      userId,
      type: 'ROLE_CHANGE',
      title,
      message,
      data: {
        oldRoles,
        newRoles,
        addedRoles,
        removedRoles,
        changedBy,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Obtener notificaciones de un usuario
  static async getUserNotifications(userId: string, limit: number = 50) {
    try {
      const notifications = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit
      });

      return notifications;
    } catch (error) {
      console.error('[NotificationService] Error obteniendo notificaciones:', error);
      throw error;
    }
  }

  // Marcar notificación como leída
  static async markAsRead(notificationId: string) {
    try {
      const notification = await prisma.notification.update({
        where: { id: notificationId },
        data: { read: true }
      });

      return notification;
    } catch (error) {
      console.error('[NotificationService] Error marcando notificación como leída:', error);
      throw error;
    }
  }

  // Marcar todas las notificaciones de un usuario como leídas
  static async markAllAsRead(userId: string) {
    try {
      await prisma.notification.updateMany({
        where: { 
          userId,
          read: false
        },
        data: { read: true }
      });

      console.log(`[NotificationService] Todas las notificaciones marcadas como leídas para usuario ${userId}`);
    } catch (error) {
      console.error('[NotificationService] Error marcando todas las notificaciones como leídas:', error);
      throw error;
    }
  }

  // Obtener conteo de notificaciones no leídas
  static async getUnreadCount(userId: string) {
    try {
      const count = await prisma.notification.count({
        where: { 
          userId,
          read: false
        }
      });

      return count;
    } catch (error) {
      console.error('[NotificationService] Error obteniendo conteo de notificaciones:', error);
      throw error;
    }
  }

  // Eliminar notificación
  static async deleteNotification(notificationId: string, userId: string) {
    try {
      const notification = await prisma.notification.delete({
        where: { 
          id: notificationId,
          userId // Asegurar que solo el propietario pueda eliminar
        }
      });

      return notification;
    } catch (error) {
      console.error('[NotificationService] Error eliminando notificación:', error);
      throw error;
    }
  }

  // Crear notificación de claim aprobado
  static async createClaimApprovedNotification(
    userId: string, 
    ctypeName: string, 
    approvedBy: string
  ) {
    return this.createNotification({
      userId,
      type: 'CLAIM_APPROVED',
      title: 'Claim Aprobado',
      message: `Tu claim para "${ctypeName}" ha sido aprobado por ${approvedBy}.`,
      data: {
        ctypeName,
        approvedBy,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Crear notificación de claim rechazado
  static async createClaimRejectedNotification(
    userId: string, 
    ctypeName: string, 
    reason: string, 
    rejectedBy: string
  ) {
    return this.createNotification({
      userId,
      type: 'CLAIM_REJECTED',
      title: 'Claim Rechazado',
      message: `Tu claim para "${ctypeName}" ha sido rechazado por ${rejectedBy}. Motivo: ${reason}`,
      data: {
        ctypeName,
        reason,
        rejectedBy,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Crear notificación de credencial revocada
  static async createCredentialRevokedNotification(
    userId: string, 
    ctypeName: string, 
    revokedBy: string
  ) {
    return this.createNotification({
      userId,
      type: 'CLAIM_REJECTED', // Usamos el mismo tipo ya que no hay uno específico para revocación
      title: 'Credencial Revocada',
      message: `Tu credencial para "${ctypeName}" ha sido revocada por ${revokedBy}.`,
      data: {
        ctypeName,
        revokedBy,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Crear notificación de claim cancelado
  static async createClaimCancelledNotification(
    userId: string, 
    ctypeName: string
  ) {
    return this.createNotification({
      userId,
      type: 'CLAIM_CANCELLED',
      title: 'Claim Cancelado',
      message: `Has cancelado tu claim para "${ctypeName}". El proceso ha sido terminado.`,
      data: {
        ctypeName,
        action: 'cancelled'
      }
    });
  }
} 