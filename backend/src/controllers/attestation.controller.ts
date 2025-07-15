import { Request, Response } from 'express';
import { AttestationService, IAttestationRequest } from '../services/attestationService';
import { PrismaClient } from '@prisma/client';
import type { DidUrl } from '@kiltprotocol/types';

const prisma = new PrismaClient();

export class AttestationController {
  /**
   * Inicia el flujo de attestación para un claim
   */
  public async startAttestation(req: Request, res: Response) {
    try {
      const { claimId, attesterDid, quote } = req.body;
      const claimerDid = req.user?.did;

      if (!claimerDid || !attesterDid || !claimId) {
        return res.status(400).json({
          success: false,
          error: 'Faltan parámetros requeridos: claimId, attesterDid'
        });
      }

      // Verificar que el claim existe y pertenece al usuario
      const claim = await prisma.claim.findFirst({
        where: {
          id: claimId,
          owner: {
            did: claimerDid
          }
        },
        include: {
          cType: true
        }
      });

      if (!claim) {
        return res.status(404).json({
          success: false,
          error: 'Claim no encontrado o no tienes permisos'
        });
      }

      // Verificar que el attester tiene permisos para este CType
      const attester = await prisma.user.findFirst({
        where: {
          did: attesterDid,
          roles: {
            some: {
              role: 'ATTESTER'
            }
          }
        }
      });

      if (!attester) {
        return res.status(403).json({
          success: false,
          error: 'El DID especificado no es un attester válido'
        });
      }

      // Preparar la solicitud de attestación
      const attestationRequest: IAttestationRequest = {
        claimerDid: claimerDid as DidUrl,
        attesterDid: attesterDid as DidUrl,
        ctypeId: claim.cType.id,
        claimContents: claim.contents as any,
        quote: quote,
        network: claim.cType.network.toLowerCase() as 'spiritnet' | 'peregrine'
      };

      // Iniciar el flujo de attestación
      const result = await AttestationService.startAttestationFlow(attestationRequest);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error || 'Error en el flujo de attestación'
        });
      }

      // Actualizar el claim en la base de datos
      await prisma.claim.update({
        where: { id: claimId },
        data: {
          status: 'APPROVED',
          attestedAt: new Date(),
          transactionHash: result.transactionHash
        }
      });

      // Crear la attestación en la base de datos
      await prisma.attestation.create({
        data: {
          claimId: claimId,
          attesterId: attester.id,
          ctypeId: claim.cTypeId,
          revoked: false
        }
      });

      res.json({
        success: true,
        data: {
          attestationHash: result.attestationHash,
          credentialHash: result.credentialHash,
          transactionHash: result.transactionHash
        },
        message: 'Attestación completada exitosamente'
      });

    } catch (error) {
      console.error('[AttestationController] Error en startAttestation:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtiene las attestaciones de un usuario
   */
  public async getUserAttestations(req: Request, res: Response) {
    try {
      const userDid = req.user?.did;

      if (!userDid) {
        return res.status(401).json({
          success: false,
          error: 'Usuario no autenticado'
        });
      }

      const attestations = await prisma.attestation.findMany({
        where: {
          claim: {
            owner: {
              did: userDid
            }
          }
        },
        include: {
          claim: {
            include: {
              cType: true
            }
          },
          attester: {
            select: {
              did: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      res.json({
        success: true,
        data: attestations,
        total: attestations.length
      });

    } catch (error) {
      console.error('[AttestationController] Error obteniendo attestaciones:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtiene las attestaciones pendientes para un attester
   */
  public async getPendingAttestations(req: Request, res: Response) {
    try {
      const attesterDid = req.user?.did;

      if (!attesterDid) {
        return res.status(401).json({
          success: false,
          error: 'Usuario no autenticado'
        });
      }

      // Verificar que el usuario es attester
      const attester = await prisma.user.findFirst({
        where: {
          did: attesterDid,
          roles: {
            some: {
              role: 'ATTESTER'
            }
          }
        }
      });

      if (!attester) {
        return res.status(403).json({
          success: false,
          error: 'No tienes permisos de attester'
        });
      }

      const pendingClaims = await prisma.claim.findMany({
        where: {
          status: 'PENDING',
          cType: {
            rolePermissions: {
              some: {
                role: 'ATTESTER'
              }
            }
          }
        },
        include: {
          owner: {
            select: {
              did: true
            }
          },
          cType: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      res.json({
        success: true,
        data: pendingClaims,
        total: pendingClaims.length
      });

    } catch (error) {
      console.error('[AttestationController] Error obteniendo attestaciones pendientes:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }
} 