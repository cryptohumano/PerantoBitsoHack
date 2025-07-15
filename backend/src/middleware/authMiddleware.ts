import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { prisma } from '../prisma';
import { Role } from '@prisma/client';

// Extender la interfaz Request para incluir el usuario
declare global {
  namespace Express {
    interface Request {
      user?: {
        did: string;
        roles: Role[];
        primaryRole: Role;
      };
    }
  }
}

export const authMiddleware = {
  // Middleware para verificar token
  verifyToken: async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[AuthMiddleware] Verificando token...');
      console.log('[AuthMiddleware] Headers:', req.headers);
      
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        console.log('[AuthMiddleware] No token proporcionado');
        return res.status(401).json({ error: 'Token no proporcionado' });
      }

      console.log('[AuthMiddleware] Token encontrado, verificando...');
      const payload = AuthService.verifyToken(token);
      console.log('[AuthMiddleware] Token válido, payload:', payload);
      
      // Obtener usuario completo con roles desde la base de datos
      const user = await prisma.user.findUnique({
        where: { did: payload.did },
        include: { roles: true }
      });

      if (!user) {
        console.log('[AuthMiddleware] Usuario no encontrado en BD');
        return res.status(401).json({ error: 'Usuario no encontrado' });
      }

      console.log('[AuthMiddleware] Usuario encontrado:', user.did, 'Roles:', user.roles.map(r => r.role));

      req.user = {
        did: user.did,
        roles: user.roles.map(role => role.role),
        primaryRole: user.roles.length > 0 ? user.roles[0].role : 'USER'
      };
      
      console.log('[AuthMiddleware] Usuario asignado a req.user:', req.user);
      next();
    } catch (error) {
      console.error('[AuthMiddleware] Error verificando token:', error);
      return res.status(401).json({ error: 'Token inválido' });
    }
  },

  // Middleware para verificar rol (acepta múltiples roles)
  requireRole: (allowedRoles: Role[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
      const dappDid = process.env.DAPP_DID_URI;
      
      if (!req.user) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      // Permitir si el usuario tiene alguno de los roles requeridos
      const hasRequiredRole = req.user.roles.some(role => allowedRoles.includes(role));
      
      // O permitir si el DID es el de la dApp (superadmin)
      const isDappDid = dappDid && req.user.did === dappDid;
      
      if (hasRequiredRole || isDappDid) {
        return next();
      }
      
      return res.status(403).json({ 
        error: 'No autorizado', 
        requiredRoles: allowedRoles,
        userRoles: req.user.roles 
      });
    };
  },

  // Middleware para verificar si es attester de un CType específico
  requireAttesterForCType: async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      const ctypeId = req.params.ctypeId || req.body.ctypeId;
      if (!ctypeId) {
        return res.status(400).json({ error: 'ID de CType no proporcionado' });
      }

      const isAttester = await AuthService.isAttesterForCType(req.user.did, ctypeId);
      if (!isAttester) {
        return res.status(403).json({ error: 'No autorizado como attester para este CType' });
      }

      next();
    } catch (error) {
      return res.status(500).json({ error: 'Error al verificar permisos de attester' });
    }
  },

  // Middleware para verificar si el usuario es propietario del recurso
  requireOwnership: (resourceField: string = 'owner') => {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      const resourceOwner = req.params[resourceField] || req.body[resourceField];
      const isOwner = req.user.did === resourceOwner;
      const isAdmin = req.user.roles.includes('ADMIN');
      const isDappDid = process.env.DAPP_DID_URI && req.user.did === process.env.DAPP_DID_URI;

      if (isOwner || isAdmin || isDappDid) {
        return next();
      }

      return res.status(403).json({ error: 'No autorizado para acceder a este recurso' });
    };
  },

  // Middleware para logging de acceso
  logAccess: (req: Request, res: Response, next: NextFunction) => {
    const userDid = req.user?.did || 'anonymous';
    const userRoles = req.user?.roles || [];
    const method = req.method;
    const path = req.path;
    
    console.log(`[AUTH] ${method} ${path} - User: ${userDid}, Roles: [${userRoles.join(', ')}]`);
    next();
  }
}; 