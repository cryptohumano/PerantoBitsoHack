import { Router } from 'express';
import { claimController } from '../controllers/claimController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Middleware de autenticación para todas las rutas
router.use(authMiddleware.verifyToken);

// Rutas para Claims
// POST /api/claims - Crear un nuevo claim (solo usuarios)
router.post('/', 
  authMiddleware.requireRole(['USER']),
  claimController.createClaim.bind(claimController)
);

// GET /api/claims - Obtener claims (con filtros)
router.get('/', 
  claimController.getClaims.bind(claimController)
);

// GET /api/claims/my-claims - Obtener claims del usuario autenticado
router.get('/my-claims', 
  authMiddleware.requireRole(['USER']),
  claimController.getUserClaims.bind(claimController)
);

// GET /api/claims/:id - Obtener un claim específico
router.get('/:id', 
  claimController.getClaim.bind(claimController)
);

// PATCH /api/claims/:id/status - Actualizar estado de claim (solo atestadores)
router.patch('/:id/status', 
  authMiddleware.requireRole(['ATTESTER', 'ADMIN']),
  claimController.updateClaimStatus.bind(claimController)
);

// PUT /api/claims/:id - Actualizar claim (solo propietario)
router.put('/:id', 
  authMiddleware.requireRole(['USER']),
  claimController.updateClaim.bind(claimController)
);

// DELETE /api/claims/:id - Eliminar claim (solo propietario)
router.delete('/:id', 
  authMiddleware.requireRole(['USER']),
  claimController.deleteClaim.bind(claimController)
);

// Cancelar claim (solo el propietario)
router.post('/:claimId/cancel', 
  authMiddleware.requireRole(['USER']),
  claimController.cancelClaim.bind(claimController)
);

export default router; 