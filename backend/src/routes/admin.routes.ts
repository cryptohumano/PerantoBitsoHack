import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();
const adminController = new AdminController();

// Middleware para verificar que sea admin
const requireAdmin = authMiddleware.requireRole(['ADMIN']);

// Rutas de gestión de usuarios
router.get('/users', 
  authMiddleware.verifyToken,
  requireAdmin,
  adminController.getAllUsers.bind(adminController)
);

router.patch('/users/:userId/roles',
  authMiddleware.verifyToken,
  requireAdmin,
  adminController.updateUserRoles.bind(adminController)
);

router.delete('/users/:userId',
  authMiddleware.verifyToken,
  requireAdmin,
  adminController.deleteUser.bind(adminController)
);

// Rutas de gestión de attesters
router.get('/attesters',
  authMiddleware.verifyToken,
  requireAdmin,
  adminController.getAllAttesters.bind(adminController)
);

// Rutas de gestión de CTypes
router.get('/ctypes',
  authMiddleware.verifyToken,
  requireAdmin,
  adminController.getAllCTypes.bind(adminController)
);

router.post('/ctypes',
  authMiddleware.verifyToken,
  requireAdmin,
  adminController.createCType.bind(adminController)
);

router.delete('/ctypes/:ctypeId',
  authMiddleware.verifyToken,
  requireAdmin,
  adminController.deleteCType.bind(adminController)
);

// Rutas de gestión de Claims
router.get('/claims',
  authMiddleware.verifyToken,
  requireAdmin,
  adminController.getAllClaims.bind(adminController)
);

router.post('/claims/:claimId/approve',
  authMiddleware.verifyToken,
  requireAdmin,
  adminController.approveClaim.bind(adminController)
);

router.post('/claims/:claimId/reject',
  authMiddleware.verifyToken,
  requireAdmin,
  adminController.rejectClaim.bind(adminController)
);

// Rutas de gestión de Credenciales
router.get('/credentials',
  authMiddleware.verifyToken,
  requireAdmin,
  adminController.getAllCredentials.bind(adminController)
);

router.post('/credentials/:credentialId/revoke',
  authMiddleware.verifyToken,
  requireAdmin,
  adminController.revokeCredential.bind(adminController)
);

// Rutas de estadísticas del sistema
router.get('/stats',
  authMiddleware.verifyToken,
  requireAdmin,
  adminController.getSystemStats.bind(adminController)
);

// Rutas de gestión de pagos (CRM)
router.get('/payments',
  authMiddleware.verifyToken,
  requireAdmin,
  adminController.getAllPayments.bind(adminController)
);

// Nuevas rutas para transacciones firmadas por usuario
router.post('/ctypes/prepare',
  authMiddleware.verifyToken,
  requireAdmin,
  adminController.prepareCTypeTransaction.bind(adminController)
);

router.post('/ctypes/submit',
  authMiddleware.verifyToken,
  requireAdmin,
  adminController.submitCTypeTransaction.bind(adminController)
);

export default router; 