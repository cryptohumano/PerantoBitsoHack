import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';

const router = Router();
const authController = new AuthController();

// Ruta para generar un nuevo challenge (sessionRequest)
router.get('/challenge', authController.getChallenge.bind(authController));

// Ruta para verificar sesión
router.post('/verify-session', authController.verifySession.bind(authController));

// Ruta para agregar roles a un usuario
router.post('/add-roles', authController.addRoles.bind(authController));

export default router; 