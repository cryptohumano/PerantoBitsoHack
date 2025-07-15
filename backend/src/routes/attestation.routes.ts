import { Router } from 'express';
import { AttestationController } from '../controllers/attestation.controller';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();
const attestationController = new AttestationController();

// Rutas protegidas por autenticación
router.use(authMiddleware.verifyToken);

// Iniciar flujo de attestación
router.post('/start', attestationController.startAttestation.bind(attestationController));

// Obtener attestaciones del usuario
router.get('/user', attestationController.getUserAttestations.bind(attestationController));

// Obtener attestaciones pendientes (para attesters)
router.get('/pending', attestationController.getPendingAttestations.bind(attestationController));

export default router; 