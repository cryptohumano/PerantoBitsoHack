import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();
const notificationController = new NotificationController();

// Todas las rutas requieren autenticación
router.use(authMiddleware.verifyToken);

// Obtener notificaciones del usuario
router.get('/', notificationController.getUserNotifications.bind(notificationController));

// Marcar notificación como leída
router.patch('/:notificationId/read', notificationController.markAsRead.bind(notificationController));

// Marcar todas las notificaciones como leídas
router.patch('/mark-all-read', notificationController.markAllAsRead.bind(notificationController));

// Obtener conteo de notificaciones no leídas
router.get('/unread-count', notificationController.getUnreadCount.bind(notificationController));

// Eliminar notificación
router.delete('/:notificationId', notificationController.deleteNotification.bind(notificationController));

export default router; 