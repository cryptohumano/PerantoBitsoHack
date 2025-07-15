import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { PrismaClient } from '@prisma/client';
import type { DidUrl } from '@kiltprotocol/types';

const prisma = new PrismaClient();

// Interfaces para sesiones KILT
interface ISessionRequest {
  name: string;
  encryptionKeyUri: DidUrl;
  challenge: string;
}

interface ISessionResponse {
  encryptionKeyUri: DidUrl;
  encryptedChallenge: string;
  nonce: string;
}

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = AuthService.getInstance();
  }

  public async getChallenge(req: Request, res: Response) {
    try {
      console.log('[AuthController] getChallenge: solicitando challenge...');
      const sessionRequest = await this.authService.getChallenge();
      console.log('[AuthController] getChallenge: sessionRequest generado:', sessionRequest);
      res.json(sessionRequest);
    } catch (error) {
      console.error('[AuthController] Error generando challenge:', error);
      res.status(500).json({ error: 'Error interno del servidor', details: (error as Error).message });
    }
  }

  public async verifySession(req: Request, res: Response) {
    try {
      console.log('[AuthController] verifySession: body recibido:', req.body);
      const { sessionRequest, sessionResponse, userDid } = req.body;
      
      if (!sessionRequest || !sessionResponse || !userDid) {
        return res.status(400).json({ 
          error: 'Datos incompletos', 
          details: 'Se requieren sessionRequest, sessionResponse y userDid' 
        });
      }

      const result = await this.authService.verifySession(sessionRequest, sessionResponse, userDid);
      console.log('[AuthController] verifySession: resultado:', result);
      res.json(result);
    } catch (error) {
      console.error('[AuthController] Error verificando sesión:', error);
      res.status(500).json({ error: 'Error interno del servidor', details: (error as Error).message });
    }
  }

  // Endpoint para agregar roles a un usuario
  public async addRoles(req: Request, res: Response) {
    try {
      const { did, roles } = req.body;
      
      if (!did || !roles || !Array.isArray(roles)) {
        return res.status(400).json({ error: 'DID y roles son requeridos' });
      }
      
      // Buscar el usuario con sus roles actuales
      const user = await prisma.user.findUnique({
        where: { did },
        include: {
          roles: true
        }
      });
      
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      
      // Crear nuevos roles para el usuario
      const userRoles = roles.map(role => ({
        userId: user.id,
        role: role
      }));
      
      // Eliminar roles existentes y crear los nuevos
      await prisma.userRole.deleteMany({
        where: { userId: user.id }
      });
      
      await prisma.userRole.createMany({
        data: userRoles
      });
      
      // Obtener el usuario actualizado
      const updatedUser = await prisma.user.findUnique({
        where: { did },
        include: {
          roles: true
        }
      });
      
      res.json({
        message: 'Roles actualizados exitosamente',
        user: {
          did: updatedUser?.did,
          roles: updatedUser?.roles.map(ur => ur.role)
        }
      });
    } catch (error) {
      console.error('[AuthController] Error agregando roles:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
} 