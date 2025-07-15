import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import credentialRoutes from './routes/credentialRoutes';
import claimRoutes from './routes/claimRoutes';
import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';
import notificationRoutes from './routes/notification.routes';
import ctypesRoutes from './routes/ctypes.routes';
import attestationRoutes from './routes/attestation.routes';
import paymentRoutes from './routes/paymentRoutes';

const app = express();

// Middleware básico
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const allowedOrigins = config.cors.origin.split(',').map(origin => origin.trim());
console.log('[CORS] Orígenes permitidos:', allowedOrigins);

app.use(cors({
  origin: (origin, callback) => {
    console.log('[CORS] Petición desde origen:', origin);
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      console.error(`[CORS] Origen bloqueado: ${origin}. No está en la lista de permitidos.`);
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(helmet());
app.use(morgan('dev'));

// Rate limiting general
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max
});

// Rate limiting específico para endpoints de KILT (menos restrictivo)
const kiltLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 30 // 30 requests por minuto para endpoints de KILT
});

app.use(limiter);

// Rutas
app.use('/api/credentials', credentialRoutes);
app.use('/api/claims', claimRoutes);
app.use('/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ctypes', ctypesRoutes);
app.use('/api/attestations', attestationRoutes);
app.use('/api/payments', paymentRoutes);

// Ruta de salud
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Manejo de errores
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: config.nodeEnv === 'development' ? err.message : undefined
  });
});

export default app; 