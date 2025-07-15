import { Router } from 'express';
import { PaymentController } from '../controllers/paymentController';
import { authMiddleware } from '../middleware/authMiddleware';
import bitsoWebhookController from '../controllers/webhook.bitso.controller';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rutas públicas para pagos
router.post('/initiate', PaymentController.initiatePayment);
router.get('/status/:paymentId', PaymentController.checkPaymentStatus);
router.post('/confirm', PaymentController.confirmPayment);

// Endpoint para listar CLABEs de Bitso
router.get('/clabes', PaymentController.listClabes);

// Endpoint para crear mock deposits (solo desarrollo)
router.post('/mock-deposit', PaymentController.createMockDeposit);

// Endpoint para registrar webhooks con Bitso
router.post('/register-webhook', PaymentController.registerWebhook);

// Endpoint para consultar depósitos en Bitso
router.get('/deposits', PaymentController.getDeposits);

// Endpoint para iniciar pago one-time con Bitso
router.post('/one-time-payment', PaymentController.initiateOneTimePayment);

// Webhook de Bitso (sin autenticación)
router.post('/bitso-webhook', PaymentController.bitsoWebhook);

// Webhook de Bitso para pagos SPEI/MXNB
router.post('/webhooks/bitso-webhook', bitsoWebhookController.handleBitsoWebhook);

// Rate limiting específico para endpoints de KILT
const kiltLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 30 // 30 requests por minuto
});

// Rutas protegidas
router.get('/onboarding-status', authMiddleware.verifyToken, PaymentController.getOnboardingStatus);
router.get('/kilt-transaction-status', kiltLimiter, PaymentController.getKiltTransactionStatus);
router.post('/update-did-status', authMiddleware.verifyToken, PaymentController.updateDidStatus);

export default router; 