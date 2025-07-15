import { Router } from 'express';
import { credentialController } from '../controllers/credentialController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Rutas para CTypes
router.post('/ctypes', 
  authMiddleware.verifyToken,
  authMiddleware.requireRole(['ADMIN']),
  credentialController.createCType
);
router.get('/ctypes', credentialController.listCTypes);
router.put('/ctypes/:id', 
  authMiddleware.verifyToken,
  authMiddleware.requireRole(['ADMIN']),
  credentialController.updateCType
);
router.patch('/ctypes/:id', 
  authMiddleware.verifyToken,
  authMiddleware.requireRole(['ADMIN']),
  credentialController.patchCType
);
router.delete('/ctypes/:id', 
  authMiddleware.verifyToken,
  authMiddleware.requireRole(['ADMIN']),
  credentialController.deleteCType
);

// Rutas para Claims
router.post('/claims', 
  authMiddleware.verifyToken,
  credentialController.createClaim
);
router.get('/claims', credentialController.listClaims);
router.put('/claims/:id', 
  authMiddleware.verifyToken,
  credentialController.updateClaim
);
router.patch('/claims/:id', 
  authMiddleware.verifyToken,
  credentialController.patchClaim
);
router.delete('/claims/:id', 
  authMiddleware.verifyToken,
  credentialController.deleteClaim
);

// Rutas para Attestations
router.post('/attestations',
  authMiddleware.verifyToken,
  authMiddleware.requireRole(['ATTESTER', 'ADMIN']),
  authMiddleware.requireAttesterForCType,
  credentialController.attestClaim
);
router.get('/attestations', credentialController.listAttestations);
router.patch('/attestations/:id/revoke', 
  authMiddleware.verifyToken,
  authMiddleware.requireRole(['ATTESTER', 'ADMIN']),
  credentialController.revokeAttestation
);
router.delete('/attestations/:id', 
  authMiddleware.verifyToken,
  authMiddleware.requireRole(['ATTESTER', 'ADMIN']),
  credentialController.deleteAttestation
);

export default router; 