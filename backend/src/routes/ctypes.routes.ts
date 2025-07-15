import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();
const adminController = new AdminController();

// Ruta pública para obtener CTypes disponibles (para ciudadanos y attesters)
router.get('/available',
  authMiddleware.verifyToken,
  adminController.getAvailableCTypes.bind(adminController)
);

// Ruta para obtener un CType específico por ID
router.get('/:ctypeId',
  authMiddleware.verifyToken,
  adminController.getCTypeById.bind(adminController)
);

export default router; 