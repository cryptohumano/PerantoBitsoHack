import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { z } from 'zod';
import { ClaimStatus, KiltNetwork } from '@prisma/client';
import { NotificationService } from '../services/notificationService';

// Schemas de validación
const createClaimSchema = z.object({
  cTypeId: z.string().uuid().optional(),
  ctypeId: z.string().uuid().optional(),
  contents: z.record(z.any()),
  network: z.enum(['SPIRITNET', 'PEREGRINE']),
  ipfsCid: z.string().optional(),
}).refine((data) => data.cTypeId || data.ctypeId, {
  message: "Se requiere cTypeId o ctypeId"
});

const updateClaimStatusSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'REVOKED']),
  rejectionReason: z.string().optional(),
});

const updateClaimSchema = z.object({
  cTypeId: z.string().uuid().optional(),
  ctypeId: z.string().uuid().optional(),
  contents: z.record(z.any()).optional(),
  network: z.enum(['SPIRITNET', 'PEREGRINE']).optional(),
  ipfsCid: z.string().optional(),
}).refine((data) => !data.cTypeId || !data.ctypeId || data.cTypeId || data.ctypeId, {
  message: "Se requiere cTypeId o ctypeId"
});

export class ClaimController {
  // Crear un nuevo claim
  async createClaim(req: Request, res: Response) {
    try {
      const parseResult = createClaimSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          success: false, 
          error: 'Datos inválidos', 
          details: parseResult.error.errors 
        });
      }

      const { cTypeId, ctypeId, contents, network, ipfsCid } = parseResult.data;
      const finalCTypeId = cTypeId || ctypeId; // Usar cualquiera de los dos
      const ownerDid = req.user?.did;

      if (!ownerDid) {
        return res.status(401).json({ 
          success: false, 
          error: 'Usuario no autenticado' 
        });
      }

      if (!finalCTypeId) {
        return res.status(400).json({ 
          success: false, 
          error: 'Se requiere cTypeId' 
        });
      }

      // Verificar que el usuario existe
      const owner = await prisma.user.findUnique({
        where: { did: ownerDid }
      });

      if (!owner) {
        return res.status(404).json({ 
          success: false, 
          error: 'Usuario no encontrado' 
        });
      }

      // Verificar que el CType existe
      const cType = await prisma.cType.findUnique({
        where: { id: finalCTypeId }
      });

      if (!cType) {
        return res.status(404).json({ 
          success: false, 
          error: 'CType no encontrado' 
        });
      }

      // Crear el claim
      const claim = await prisma.claim.create({
        data: {
          ownerId: owner.id,
          cTypeId: finalCTypeId,
          contents,
          network,
          ipfsCid,
          status: 'PENDING'
        },
        include: {
          owner: {
            select: {
              id: true,
              did: true
            }
          },
          cType: {
            select: {
              id: true,
              name: true,
              ctypeHash: true
            }
          }
        }
      });

      // Notificar a los atestadores autorizados
      await this.notifyAttesters(claim);

      res.status(201).json({
        success: true,
        data: claim,
        message: 'Claim creado exitosamente'
      });

    } catch (error) {
      console.error('[ClaimController] Error creating claim:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error interno del servidor' 
      });
    }
  }

  // Obtener todos los claims (con filtros)
  async getClaims(req: Request, res: Response) {
    try {
      const { 
        status, 
        ownerId, 
        cTypeId, 
        network,
        page = '1',
        limit = '10'
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      // Construir filtros
      const where: any = {};
      
      if (status) {
        where.status = status as ClaimStatus;
      }
      
      if (ownerId) {
        where.ownerId = ownerId as string;
      }
      
      if (cTypeId) {
        where.cTypeId = cTypeId as string;
      }
      
      if (network) {
        where.network = network as KiltNetwork;
      }

      // Obtener claims con paginación
      const [claims, total] = await Promise.all([
        prisma.claim.findMany({
          where,
          include: {
            owner: {
              select: {
                id: true,
                did: true
              }
            },
            cType: {
              select: {
                id: true,
                name: true,
                ctypeHash: true
              }
            },
            attestations: {
              include: {
                attester: {
                  select: {
                    id: true,
                    did: true
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limitNum
        }),
        prisma.claim.count({ where })
      ]);

      res.json({
        success: true,
        data: claims,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      });

    } catch (error) {
      console.error('[ClaimController] Error getting claims:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error interno del servidor' 
      });
    }
  }

  // Obtener un claim específico
  async getClaim(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const claim = await prisma.claim.findUnique({
        where: { id },
        include: {
          owner: {
            select: {
              id: true,
              did: true
            }
          },
          cType: {
            select: {
              id: true,
              name: true,
              ctypeHash: true,
              schema: true
            }
          },
          attestations: {
            include: {
              attester: {
                select: {
                  id: true,
                  did: true
                }
              }
            }
          }
        }
      });

      if (!claim) {
        return res.status(404).json({ 
          success: false, 
          error: 'Claim no encontrado' 
        });
      }

      res.json({
        success: true,
        data: claim
      });

    } catch (error) {
      console.error('[ClaimController] Error getting claim:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error interno del servidor' 
      });
    }
  }

  // Actualizar estado de un claim (para atestadores)
  async updateClaimStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const parseResult = updateClaimStatusSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({ 
          success: false, 
          error: 'Datos inválidos', 
          details: parseResult.error.errors 
        });
      }

      const { status, rejectionReason } = parseResult.data;
      const attesterDid = req.user?.did;

      if (!attesterDid) {
        return res.status(401).json({ 
          success: false, 
          error: 'Usuario no autenticado' 
        });
      }

      // Verificar que el claim existe
      const existingClaim = await prisma.claim.findUnique({
        where: { id },
        include: {
          owner: true,
          cType: true
        }
      });

      if (!existingClaim) {
        return res.status(404).json({ 
          success: false, 
          error: 'Claim no encontrado' 
        });
      }

      // Verificar que el usuario es atestador
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
          error: 'No tienes permisos para atestar claims' 
        });
      }

      // Preparar datos de actualización
      const updateData: any = {
        status,
        updatedAt: new Date()
      };

      if (status === 'APPROVED') {
        updateData.attestedAt = new Date();
      } else if (status === 'REJECTED') {
        updateData.rejectionReason = rejectionReason || 'Rechazado por el atestador';
      } else if (status === 'REVOKED') {
        updateData.revokedAt = new Date();
      }

      // Actualizar el claim
      const updatedClaim = await prisma.claim.update({
        where: { id },
        data: updateData,
        include: {
          owner: {
            select: {
              id: true,
              did: true
            }
          },
          cType: {
            select: {
              id: true,
              name: true,
              ctypeHash: true
            }
          }
        }
      });

      // Notificar al propietario del claim
      await this.notifyClaimOwner(updatedClaim, status);

      res.json({
        success: true,
        data: updatedClaim,
        message: `Claim ${status.toLowerCase()} exitosamente`
      });

    } catch (error) {
      console.error('[ClaimController] Error updating claim status:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error interno del servidor' 
      });
    }
  }

  // Actualizar un claim (para propietarios)
  async updateClaim(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const parseResult = updateClaimSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({ 
          success: false, 
          error: 'Datos inválidos', 
          details: parseResult.error.errors 
        });
      }

      const updateData = parseResult.data;
      const ownerDid = req.user?.did;

      if (!ownerDid) {
        return res.status(401).json({ 
          success: false, 
          error: 'Usuario no autenticado' 
        });
      }

      // Verificar que el claim existe y pertenece al usuario
      const existingClaim = await prisma.claim.findFirst({
        where: {
          id,
          owner: {
            did: ownerDid
          }
        }
      });

      if (!existingClaim) {
        return res.status(404).json({ 
          success: false, 
          error: 'Claim no encontrado o no tienes permisos' 
        });
      }

      // Solo permitir actualización si está pendiente
      if (existingClaim.status !== 'PENDING') {
        return res.status(400).json({ 
          success: false, 
          error: 'Solo se pueden actualizar claims pendientes' 
        });
      }

      // Actualizar el claim
      const updatedClaim = await prisma.claim.update({
        where: { id },
        data: {
          ...updateData,
          updatedAt: new Date()
        },
        include: {
          owner: {
            select: {
              id: true,
              did: true
            }
          },
          cType: {
            select: {
              id: true,
              name: true,
              ctypeHash: true
            }
          }
        }
      });

      res.json({
        success: true,
        data: updatedClaim,
        message: 'Claim actualizado exitosamente'
      });

    } catch (error) {
      console.error('[ClaimController] Error updating claim:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error interno del servidor' 
      });
    }
  }

  // Eliminar un claim (solo propietario)
  async deleteClaim(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const ownerDid = req.user?.did;

      if (!ownerDid) {
        return res.status(401).json({ 
          success: false, 
          error: 'Usuario no autenticado' 
        });
      }

      // Verificar que el claim existe y pertenece al usuario
      const existingClaim = await prisma.claim.findFirst({
        where: {
          id,
          owner: {
            did: ownerDid
          }
        }
      });

      if (!existingClaim) {
        return res.status(404).json({ 
          success: false, 
          error: 'Claim no encontrado o no tienes permisos' 
        });
      }

      // Solo permitir eliminación si está pendiente
      if (existingClaim.status !== 'PENDING') {
        return res.status(400).json({ 
          success: false, 
          error: 'Solo se pueden eliminar claims pendientes' 
        });
      }

      // Eliminar el claim
      await prisma.claim.delete({
        where: { id }
      });

      res.json({
        success: true,
        message: 'Claim eliminado exitosamente'
      });

    } catch (error) {
      console.error('[ClaimController] Error deleting claim:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error interno del servidor' 
      });
    }
  }

  // Métodos privados para notificaciones
  private async notifyAttesters(claim: any) {
    try {
      // Buscar atestadores autorizados para este CType
      const atestadores = await prisma.user.findMany({
        where: {
          roles: {
            some: {
              role: 'ATTESTER'
            }
          }
        }
      });

      // Crear notificaciones para cada atestador
      for (const atestador of atestadores) {
        await NotificationService.createNotification({
          userId: atestador.id,
          type: 'CLAIM_SUBMITTED',
          title: 'Nuevo Claim Pendiente',
          message: `Se ha recibido un nuevo claim para el CType "${claim.cType.name}"`,
          data: {
            claimId: claim.id,
            cTypeName: claim.cType.name,
            ownerDid: claim.owner.did
          }
        });
      }
    } catch (error) {
      console.error('[ClaimController] Error notifying attesters:', error);
    }
  }

  private async notifyClaimOwner(claim: any, status: string) {
    try {
      const statusMessages = {
        'APPROVED': 'Tu claim ha sido aprobado',
        'REJECTED': 'Tu claim ha sido rechazado',
        'REVOKED': 'Tu claim ha sido revocado'
      };

      await NotificationService.createNotification({
        userId: claim.ownerId,
        type: status === 'APPROVED' ? 'CLAIM_APPROVED' : 'CLAIM_REJECTED',
        title: `Claim ${status.toLowerCase()}`,
        message: statusMessages[status as keyof typeof statusMessages] || `Tu claim ha sido ${status.toLowerCase()}`,
        data: {
          claimId: claim.id,
          cTypeName: claim.cType.name,
          status
        }
      });
    } catch (error) {
      console.error('[ClaimController] Error notifying claim owner:', error);
    }
  }

  // Obtener claims del usuario autenticado
  async getUserClaims(req: Request, res: Response) {
    try {
      const userDid = req.user?.did;

      if (!userDid) {
        return res.status(401).json({ 
          success: false, 
          error: 'Usuario no autenticado' 
        });
      }

      // Verificar que el usuario existe
      const user = await prisma.user.findUnique({
        where: { did: userDid }
      });

      if (!user) {
        return res.status(404).json({ 
          success: false, 
          error: 'Usuario no encontrado' 
        });
      }

      // Obtener claims del usuario
      const claims = await prisma.claim.findMany({
        where: {
          ownerId: user.id
        },
        include: {
          cType: {
            select: {
              id: true,
              name: true
            }
          },
          attestations: {
            include: {
              attester: {
                select: {
                  id: true,
                  did: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Formatear la respuesta
      const claimsWithDetails = claims.map(claim => ({
        id: claim.id,
        ctypeId: claim.cTypeId,
        ctypeName: claim.cType.name,
        status: claim.status,
        createdAt: claim.createdAt,
        updatedAt: claim.updatedAt,
        data: claim.contents,
        attesterId: claim.attestations[0]?.attesterId,
        attesterDid: claim.attestations[0]?.attester?.did,
        attestationDate: claim.attestedAt,
        rejectionReason: claim.rejectionReason
      }));

      res.json({
        success: true,
        data: claimsWithDetails,
        total: claimsWithDetails.length
      });

    } catch (error) {
      console.error('[ClaimController] Error getting user claims:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error interno del servidor' 
      });
    }
  }

  // Cancelar claim (solo el propietario puede cancelar claims pendientes)
  async cancelClaim(req: Request, res: Response) {
    try {
      const { claimId } = req.params;
      const userDid = req.user?.did;

      if (!userDid) {
        return res.status(401).json({
          success: false,
          error: 'Usuario no autenticado'
        });
      }

      // Buscar el claim y verificar que pertenece al usuario
      const claim = await prisma.claim.findUnique({
        where: { id: claimId },
        include: {
          owner: true,
          cType: true
        }
      });

      if (!claim) {
        return res.status(404).json({
          success: false,
          error: 'Claim no encontrado'
        });
      }

      // Verificar que el claim pertenece al usuario autenticado
      if (claim.owner.did !== userDid) {
        return res.status(403).json({
          success: false,
          error: 'No tienes permisos para cancelar este claim'
        });
      }

      // Verificar que el claim está pendiente
      if (claim.status !== 'PENDING') {
        return res.status(400).json({
          success: false,
          error: 'Solo se pueden cancelar claims pendientes'
        });
      }

      // Actualizar el estado del claim a CANCELLED
      const updatedClaim = await prisma.claim.update({
        where: { id: claimId },
        data: {
          status: 'CANCELLED',
          updatedAt: new Date()
        },
        include: {
          owner: {
            select: {
              id: true,
              did: true
            }
          },
          cType: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      // Crear notificación para el usuario
      try {
        await NotificationService.createClaimCancelledNotification(
          claim.owner.id,
          claim.cType.name
        );
      } catch (notificationError) {
        console.error('[ClaimController] Error creando notificación de cancelación:', notificationError);
      }

      res.json({
        success: true,
        message: 'Claim cancelado exitosamente',
        data: updatedClaim
      });

    } catch (error) {
      console.error('[ClaimController] Error cancelando claim:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }
}

export const claimController = new ClaimController(); 