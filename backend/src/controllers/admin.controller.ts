import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { Role } from '@prisma/client';
import { NotificationService } from '../services/notificationService';
import { PinataService } from '../services/pinata.service';
import { CType } from '@kiltprotocol/credentials';
import { connect, disconnect, Blockchain } from '@kiltprotocol/chain-helpers';
import * as Did from '@kiltprotocol/did';
import { Crypto } from '@kiltprotocol/utils';
import type { ICType, DidUrl, KiltKeyringPair, SignerInterface, DidDocument, KiltAddress } from '@kiltprotocol/types';
import { config as appConfig } from '../config';
import { encodeAddress } from '@polkadot/util-crypto';
import { KiltService } from '../services/kiltService';

const prisma = new PrismaClient();

type KiltNetworkKey = 'spiritnet' | 'peregrine';

export class AdminController {
  // Gestión de Usuarios
  async getAllUsers(req: Request, res: Response) {
    try {
      const users = await prisma.user.findMany({
        include: {
          roles: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      const usersWithStats = users.map(user => ({
        ...user,
        roles: user.roles.map(role => role.role),
        totalClaims: 0, // Por ahora lo dejamos en 0 hasta que se implemente la relación
        totalAttestations: 0 // Por ahora lo dejamos en 0 hasta que se implemente la relación
      }));

      res.json({
        success: true,
        data: usersWithStats,
        total: usersWithStats.length
      });
    } catch (error) {
      console.error('[AdminController] Error obteniendo usuarios:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error interno del servidor' 
      });
    }
  }

  async updateUserRoles(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { roles } = req.body;
      const currentUserDid = req.user?.did; // DID del admin que hace la petición

      if (!roles || !Array.isArray(roles)) {
        return res.status(400).json({
          success: false,
          error: 'Roles es requerido y debe ser un array'
        });
      }

      // Validar que los roles sean válidos
      const validRoles = ['USER', 'ATTESTER', 'ADMIN'];
      const invalidRoles = roles.filter(role => !validRoles.includes(role));
      if (invalidRoles.length > 0) {
        return res.status(400).json({
          success: false,
          error: `Roles inválidos: ${invalidRoles.join(', ')}`
        });
      }

      // Obtener el usuario a actualizar
      const userToUpdate = await prisma.user.findUnique({
        where: { id: userId },
        include: { roles: true }
      });

      if (!userToUpdate) {
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado'
        });
      }

      // Protección: No permitir quitar rol ADMIN del admin principal
      const isMainAdmin = userToUpdate.did === process.env.ADMIN_DID;
      if (isMainAdmin && !roles.includes('ADMIN')) {
        return res.status(400).json({
          success: false,
          error: 'No se puede quitar el rol ADMIN del administrador principal'
        });
      }

      // Protección: No permitir que un admin se quite sus propios roles
      if (userToUpdate.did === currentUserDid && !roles.includes('ADMIN')) {
        return res.status(400).json({
          success: false,
          error: 'No puedes quitar tu propio rol de administrador'
        });
      }

      // Guardar los roles antiguos para la notificación
      const oldRoles = userToUpdate.roles.map(role => role.role);

      // Eliminar roles existentes y crear nuevos
      await prisma.userRole.deleteMany({
        where: { userId }
      });

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          roles: {
            create: roles.map(role => ({ role: role as Role }))
          }
        },
        include: {
          roles: true
        }
      });

      // Crear notificación para el usuario
      try {
        await NotificationService.createRoleChangeNotification(
          userId,
          oldRoles,
          roles,
          currentUserDid || 'Sistema'
        );
        console.log(`[AdminController] Notificación de cambio de rol creada para usuario ${userToUpdate.did}`);
      } catch (notificationError) {
        console.error('[AdminController] Error creando notificación:', notificationError);
        // No fallamos la operación si la notificación falla
      }

      res.json({
        success: true,
        data: {
          ...updatedUser,
          roles: updatedUser.roles.map(role => role.role)
        },
        message: 'Roles actualizados exitosamente'
      });
    } catch (error) {
      console.error('[AdminController] Error actualizando roles:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error interno del servidor' 
      });
    }
  }

  async deleteUser(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const currentUserDid = req.user?.did;

      // Obtener el usuario a eliminar
      const userToDelete = await prisma.user.findUnique({
        where: { id: userId },
        include: { roles: true }
      });

      if (!userToDelete) {
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado'
        });
      }

      // Protección: No permitir eliminar el admin principal
      const isMainAdmin = userToDelete.did === process.env.ADMIN_DID;
      if (isMainAdmin) {
        return res.status(400).json({
          success: false,
          error: 'No se puede eliminar el administrador principal'
        });
      }

      // Protección: No permitir que un admin se elimine a sí mismo
      if (userToDelete.did === currentUserDid) {
        return res.status(400).json({
          success: false,
          error: 'No puedes eliminar tu propia cuenta'
        });
      }

      // Verificar que no sea el último admin
      const isAdmin = userToDelete.roles.some(role => role.role === 'ADMIN');
      if (isAdmin) {
        const adminCount = await prisma.userRole.count({
          where: { role: 'ADMIN' }
        });

        if (adminCount <= 1) {
          return res.status(400).json({
            success: false,
            error: 'No se puede eliminar el último administrador'
          });
        }
      }

      // Eliminar el usuario (esto también eliminará sus roles por cascada)
      await prisma.user.delete({
        where: { id: userId }
      });

      res.json({
        success: true,
        message: 'Usuario eliminado exitosamente'
      });
    } catch (error) {
      console.error('[AdminController] Error eliminando usuario:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error interno del servidor' 
      });
    }
  }

  // Gestión de Attesters
  async getAllAttesters(req: Request, res: Response) {
    try {
      const attesters = await prisma.user.findMany({
        where: {
          roles: {
            some: {
              role: 'ATTESTER'
            }
          }
        },
        include: {
          roles: true,
          attestations: {
            select: {
              id: true,
              createdAt: true,
              revoked: true,
              ctype: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      const attestersWithStats = attesters.map(attester => {
        const totalAttestations = attester.attestations.length;
        const activeAttestations = attester.attestations.filter(a => !a.revoked).length;
        const successRate = totalAttestations > 0 ? (activeAttestations / totalAttestations) * 100 : 0;

        return {
          ...attester,
          roles: attester.roles.map(role => role.role),
          totalAttestations,
          activeAttestations,
          successRate: Math.round(successRate * 10) / 10,
          attestations: undefined
        };
      });

      res.json({
        success: true,
        data: attestersWithStats,
        total: attestersWithStats.length
      });
    } catch (error) {
      console.error('[AdminController] Error obteniendo attesters:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error interno del servidor' 
      });
    }
  }

  // Gestión de CTypes
  async getAllCTypes(req: Request, res: Response) {
    try {
      const ctypes = await prisma.cType.findMany({
        include: {
          creator: {
            select: {
              id: true,
              did: true
            }
          },
          organization: {
            select: {
              id: true,
              name: true
            }
          },
          rolePermissions: {
            select: {
              id: true,
              role: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      res.json({
        success: true,
        data: ctypes,
        total: ctypes.length
      });
    } catch (error) {
      console.error('[AdminController] Error obteniendo CTypes:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error interno del servidor' 
      });
    }
  }

  // Obtener CTypes disponibles para el usuario actual
  async getAvailableCTypes(req: Request, res: Response) {
    try {
      const userDid = req.user?.did;
      const userRoles = req.user?.roles || [];

      // Obtener todos los CTypes activos
      const allCTypes = await prisma.cType.findMany({
        where: {
          status: 'ACTIVE'
        },
        include: {
          creator: {
            select: {
              id: true,
              did: true
            }
          },
          organization: {
            select: {
              id: true,
              name: true
            }
          },
          rolePermissions: {
            select: {
              id: true,
              role: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Filtrar CTypes disponibles para el usuario
      const availableCTypes = allCTypes.filter(ctype => {
        // Si es público, está disponible para todos
        if (ctype.isPublic) {
          return true;
        }

        // Si es privado, verificar si el usuario tiene permisos
        const authorizedRoles = ctype.rolePermissions.map(rp => rp.role);
        return userRoles.some(role => authorizedRoles.includes(role));
      });

      res.json({
        success: true,
        data: availableCTypes,
        total: availableCTypes.length
      });
    } catch (error) {
      console.error('[AdminController] Error obteniendo CTypes disponibles:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error interno del servidor' 
      });
    }
  }

  // Obtener un CType específico por ID
  async getCTypeById(req: Request, res: Response) {
    try {
      const { ctypeId } = req.params;
      const userDid = req.user?.did;
      const userRoles = req.user?.roles || [];

      const ctype = await prisma.cType.findUnique({
        where: { id: ctypeId },
        include: {
          creator: {
            select: {
              id: true,
              did: true
            }
          },
          organization: {
            select: {
              id: true,
              name: true
            }
          },
          rolePermissions: {
            select: {
              id: true,
              role: true
            }
          }
        }
      });

      if (!ctype) {
        return res.status(404).json({
          success: false,
          error: 'CType no encontrado'
        });
      }

      // Verificar si el usuario tiene acceso al CType
      if (ctype.status !== 'ACTIVE') {
        return res.status(403).json({
          success: false,
          error: 'CType no está activo'
        });
      }

      if (!ctype.isPublic) {
        const authorizedRoles = ctype.rolePermissions.map(rp => rp.role);
        const hasAccess = userRoles.some(role => authorizedRoles.includes(role));
        
        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            error: 'No tienes permisos para acceder a este CType'
          });
        }
      }

      res.json({
        success: true,
        data: ctype
      });
    } catch (error) {
      console.error('[AdminController] Error obteniendo CType por ID:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error interno del servidor' 
      });
    }
  }

  async createCType(req: Request, res: Response) {
    const { name, schema, isPublic, authorizedRoles, network: networkReq, payerType, signerType } = req.body;
    const creatorDid = req.user?.did;

    if (!name || !schema || !creatorDid || !networkReq) {
      return res.status(400).json({ success: false, error: 'Faltan parámetros requeridos: name, schema, creatorDid, network' });
    }

    // Validar y tipar la red
    const network = networkReq as KiltNetworkKey;
    if (network !== 'spiritnet' && network !== 'peregrine') {
      return res.status(400).json({ success: false, error: 'Red inválida. Debe ser "spiritnet" o "peregrine".' });
    }

    try {
      // Determinar el flujo basado en payerType y signerType
      if (payerType === 'user' && signerType === 'user') {
        return this.createCTypeUserPaysAndSigns(req, res);
      } else if (signerType === 'user') {
        return this.createCTypeSystemPaysUserSigns(req, res);
      } else {
        return this.createCTypeSystemOnly(req, res);
      }
    } catch (error) {
      console.error('[AdminController] Error creating CType:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor al crear el CType.';
      res.status(500).json({ success: false, error: errorMessage });
    }
  }

  /**
   * Flujo A: Sistema paga y firma (solo superadmin)
   */
  private async createCTypeSystemOnly(req: Request, res: Response) {
    const { name, schema, isPublic, authorizedRoles, network: networkReq } = req.body;
    const creatorDid = req.user?.did;

    // Verificar que el usuario es superadmin
    const isSuperAdmin = creatorDid === process.env.ADMIN_DID;
    if (!isSuperAdmin) {
      return res.status(403).json({ 
        success: false, 
        error: 'Solo el superadmin puede crear CTypes con firma del sistema. Por favor, selecciona "Mi DID personal" para firmar con tu wallet.' 
      });
    }

    try {
      console.log(`[AdminController] Creando CType con sistema (solo superadmin): ${creatorDid}`);
      
      // 1. Obtener el ID del usuario creador desde la BD
      const creator = await prisma.user.findUnique({
        where: { did: creatorDid },
        select: { id: true },
      });

      if (!creator) {
        return res.status(404).json({ success: false, error: 'Usuario creador no encontrado' });
      }

      // 2. Crear CType usando variables de entorno (sistema firma y paga)
      const onChainData = await KiltService.createCTypeWithSystemPayment(schema as ICType, networkReq as KiltNetworkKey, creatorDid as DidUrl);

      // 3. Guardar el nuevo CType en la Base de Datos
      const newCType = await prisma.cType.create({
        data: {
          name,
          schema,
          ctypeHash: onChainData.ctypeHash,
          ipfsCid: null,
          network: networkReq.toUpperCase() as 'SPIRITNET' | 'PEREGRINE',
          status: 'ACTIVE',
          blockNumber: onChainData.blockNumber,
          blockHash: onChainData.blockHash.toString(),
          transactionHash: onChainData.transactionHash,
          creatorId: creator.id,
          isPublic,
          rolePermissions: {
            create: isPublic ? [] : authorizedRoles?.map((role: Role) => ({ role })) || [],
          },
        },
      });

      console.log(`[AdminController] CType successfully saved to DB with ID: ${newCType.id}`);

      res.status(201).json({ 
        success: true, 
        data: {
          id: newCType.id,
          ctypeHash: onChainData.ctypeHash,
          transactionHash: onChainData.transactionHash,
          blockHash: onChainData.blockHash,
          blockNumber: onChainData.blockNumber,
        } 
      });
    } catch (error) {
      console.error('[AdminController] Error in createCTypeSystemOnly:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor al crear el CType.';
      res.status(500).json({ success: false, error: errorMessage });
    }
  }

  /**
   * Flujo B: Sistema paga, usuario firma
   */
  private async createCTypeSystemPaysUserSigns(req: Request, res: Response) {
    const { name, schema, isPublic, authorizedRoles, network: networkReq, userDid, signedExtrinsic, didKeyUri } = req.body;
    const creatorDid = req.user?.did;

    // Verificar que el DID del usuario coincide con el autenticado
    if (userDid !== creatorDid) {
      return res.status(403).json({ 
        success: false, 
        error: 'El DID de la firma no coincide con tu DID autenticado' 
      });
    }

    try {
      console.log(`[AdminController] Creando CType: sistema paga, usuario firma: ${userDid}`);
      
      // 1. Obtener el ID del usuario creador desde la BD
      const creator = await prisma.user.findUnique({
        where: { did: creatorDid },
        select: { id: true },
      });

      if (!creator) {
        return res.status(404).json({ success: false, error: 'Usuario creador no encontrado' });
      }

      // 2. Enviar la transacción firmada por el usuario
      const onChainData = await KiltService.submitSignedCTypeTransaction(
        schema as ICType,
        networkReq as KiltNetworkKey,
        userDid as DidUrl,
        signedExtrinsic
      );

      // 3. Guardar el nuevo CType en la Base de Datos
      const newCType = await prisma.cType.create({
        data: {
          name,
          schema,
          ctypeHash: onChainData.ctypeHash,
          ipfsCid: null,
          network: networkReq.toUpperCase() as 'SPIRITNET' | 'PEREGRINE',
          status: 'ACTIVE',
          blockNumber: onChainData.blockNumber,
          blockHash: onChainData.blockHash.toString(),
          transactionHash: onChainData.transactionHash,
          creatorId: creator.id,
          isPublic,
          rolePermissions: {
            create: isPublic ? [] : authorizedRoles?.map((role: Role) => ({ role })) || [],
          },
        },
      });

      console.log(`[AdminController] CType successfully saved to DB with ID: ${newCType.id}`);

      res.status(201).json({ 
        success: true, 
        data: {
          id: newCType.id,
          ctypeHash: onChainData.ctypeHash,
          transactionHash: onChainData.transactionHash,
          blockHash: onChainData.blockHash,
          blockNumber: onChainData.blockNumber,
        } 
      });
    } catch (error) {
      console.error('[AdminController] Error in createCTypeSystemPaysUserSigns:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor al crear el CType.';
      res.status(500).json({ success: false, error: errorMessage });
    }
  }

  /**
   * Flujo C: Usuario paga y firma
   */
  private async createCTypeUserPaysAndSigns(req: Request, res: Response) {
    const { name, schema, isPublic, authorizedRoles, network: networkReq, userDid, signedExtrinsic, didKeyUri, submitterAddress } = req.body;
    const creatorDid = req.user?.did;

    // Verificar que el DID del usuario coincide con el autenticado
    if (userDid !== creatorDid) {
      return res.status(403).json({ 
        success: false, 
        error: 'El DID de la firma no coincide con tu DID autenticado' 
      });
    }

    try {
      console.log(`[AdminController] Creando CType: usuario paga y firma: ${userDid}`);
      
      // 1. Obtener el ID del usuario creador desde la BD
      const creator = await prisma.user.findUnique({
        where: { did: creatorDid },
        select: { id: true },
      });

      if (!creator) {
        return res.status(404).json({ success: false, error: 'Usuario creador no encontrado' });
      }

      // 2. Enviar la transacción firmada por el usuario
      const onChainData = await KiltService.submitSignedCTypeTransaction(
        schema as ICType,
        networkReq as KiltNetworkKey,
        userDid as DidUrl,
        signedExtrinsic
      );

      // 3. Guardar el nuevo CType en la Base de Datos
      const newCType = await prisma.cType.create({
        data: {
          name,
          schema,
          ctypeHash: onChainData.ctypeHash,
          ipfsCid: null,
          network: networkReq.toUpperCase() as 'SPIRITNET' | 'PEREGRINE',
          status: 'ACTIVE',
          blockNumber: onChainData.blockNumber,
          blockHash: onChainData.blockHash.toString(),
          transactionHash: onChainData.transactionHash,
          creatorId: creator.id,
          isPublic,
          rolePermissions: {
            create: isPublic ? [] : authorizedRoles?.map((role: Role) => ({ role })) || [],
          },
        },
      });

      console.log(`[AdminController] CType successfully saved to DB with ID: ${newCType.id}`);

      res.status(201).json({ 
        success: true, 
        data: {
          id: newCType.id,
          ctypeHash: onChainData.ctypeHash,
          transactionHash: onChainData.transactionHash,
          blockHash: onChainData.blockHash,
          blockNumber: onChainData.blockNumber,
        } 
      });
    } catch (error) {
      console.error('[AdminController] Error in createCTypeUserPaysAndSigns:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor al crear el CType.';
      res.status(500).json({ success: false, error: errorMessage });
    }
  }

  async deleteCType(req: Request, res: Response) {
    try {
      const { ctypeId } = req.params;

      // Verificar que el CType existe
      const ctype = await prisma.cType.findUnique({
        where: { id: ctypeId }
      });

      if (!ctype) {
        return res.status(404).json({
          success: false,
          error: 'CType no encontrado'
        });
      }

      // Eliminar el CType
      await prisma.cType.delete({
        where: { id: ctypeId }
      });

      res.json({
        success: true,
        message: 'CType eliminado exitosamente'
      });
    } catch (error) {
      console.error('[AdminController] Error eliminando CType:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error interno del servidor' 
      });
    }
  }

  // Estadísticas del Sistema
  async getSystemStats(req: Request, res: Response) {
    try {
      const [
        totalUsers,
        totalAttesters,
        totalAdmins,
        totalCTypes,
        totalClaims,
        totalAttestations
      ] = await Promise.all([
        prisma.user.count(),
        prisma.userRole.count({ where: { role: 'ATTESTER' } }),
        prisma.userRole.count({ where: { role: 'ADMIN' } }),
        prisma.cType.count(),
        prisma.claim.count(),
        prisma.attestation.count()
      ]);

      res.json({
        success: true,
        data: {
          totalUsers,
          totalAttesters,
          totalAdmins,
          totalCTypes,
          totalClaims,
          totalAttestations
        }
      });
    } catch (error) {
      console.error('[AdminController] Error obteniendo estadísticas:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error interno del servidor' 
      });
    }
  }

  // Gestión de Claims
  async getAllClaims(req: Request, res: Response) {
    try {
      const claims = await prisma.claim.findMany({
        include: {
          owner: {
            select: {
              id: true,
              did: true,
              createdAt: true,
              updatedAt: true
            }
          },
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
          createdAt: "desc"
        }
      });

      // Formatear la respuesta para el frontend
      const claimsWithDetails = claims.map(claim => ({
        id: claim.id,
        userId: claim.ownerId,
        userDid: claim.owner.did,
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
      console.error('[AdminController] Error obteniendo claims:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error interno del servidor' 
      });
    }
  }

  async approveClaim(req: Request, res: Response) {
    try {
      const { claimId } = req.params;
      const adminDid = req.user?.did;

      // Obtener el usuario admin para tener su ID
      const adminUser = await prisma.user.findUnique({
        where: { did: adminDid }
      });

      if (!adminUser) {
        return res.status(404).json({
          success: false,
          error: 'Usuario admin no encontrado'
        });
      }

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

      if (claim.status !== 'PENDING') {
        return res.status(400).json({
          success: false,
          error: 'Solo se pueden aprobar claims pendientes'
        });
      }

      // Crear la atestación
      await prisma.attestation.create({
        data: {
          claimId: claimId,
          attesterId: adminUser.id, // Usar el ID del usuario admin
          ctypeId: claim.cTypeId
        }
      });

      // Actualizar el claim como aprobado
      const updatedClaim = await prisma.claim.update({
        where: { id: claimId },
        data: {
          status: 'APPROVED',
          attestedAt: new Date()
        },
        include: {
          owner: true,
          cType: true
        }
      });

      // Crear notificación para el usuario
      try {
        await NotificationService.createClaimApprovedNotification(
          claim.ownerId,
          claim.cType.name,
          adminDid || 'Sistema'
        );
      } catch (notificationError) {
        console.error('[AdminController] Error creando notificación de aprobación:', notificationError);
      }

      res.json({
        success: true,
        data: updatedClaim,
        message: 'Claim aprobado exitosamente'
      });
    } catch (error) {
      console.error('[AdminController] Error aprobando claim:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error interno del servidor' 
      });
    }
  }

  async rejectClaim(req: Request, res: Response) {
    try {
      const { claimId } = req.params;
      const { reason } = req.body;
      const adminDid = req.user?.did;

      if (!reason) {
        return res.status(400).json({
          success: false,
          error: 'Razón de rechazo es requerida'
        });
      }

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

      if (claim.status !== 'PENDING') {
        return res.status(400).json({
          success: false,
          error: 'Solo se pueden rechazar claims pendientes'
        });
      }

      // Actualizar el claim como rechazado
      const updatedClaim = await prisma.claim.update({
        where: { id: claimId },
        data: {
          status: 'REJECTED',
          rejectionReason: reason
        },
        include: {
          owner: true,
          cType: true
        }
      });

      // Crear notificación para el usuario
      try {
        await NotificationService.createClaimRejectedNotification(
          claim.ownerId,
          claim.cType.name,
          reason,
          adminDid || 'Sistema'
        );
      } catch (notificationError) {
        console.error('[AdminController] Error creando notificación de rechazo:', notificationError);
      }

      res.json({
        success: true,
        data: updatedClaim,
        message: 'Claim rechazado exitosamente'
      });
    } catch (error) {
      console.error('[AdminController] Error rechazando claim:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error interno del servidor' 
      });
    }
  }

  // Gestión de Credenciales (Atestaciones)
  async getAllCredentials(req: Request, res: Response) {
    try {
      const attestations = await prisma.attestation.findMany({
        include: {
          claim: {
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
          },
          attester: {
            select: {
              id: true,
              did: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      const credentialsWithDetails = attestations.map(attestation => ({
        id: attestation.id,
        claimId: attestation.claimId,
        userId: attestation.claim.owner.id,
        userDid: attestation.claim.owner.did,
        ctypeId: attestation.claim.cType.id,
        ctypeName: attestation.claim.cType.name,
        attesterId: attestation.attester.id,
        attesterDid: attestation.attester.did,
        status: attestation.revoked ? 'REVOKED' : 'ACTIVE',
        issuedAt: attestation.createdAt,
        expiresAt: null, // No hay campo de expiración en el modelo actual
        revokedAt: attestation.revoked ? attestation.updatedAt : null,
        revocationReason: attestation.revoked ? 'Revocada por el atestador' : null
      }));

      res.json({
        success: true,
        data: credentialsWithDetails,
        total: credentialsWithDetails.length
      });
    } catch (error) {
      console.error('[AdminController] Error obteniendo credenciales:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error interno del servidor' 
      });
    }
  }

  async revokeCredential(req: Request, res: Response) {
    try {
      const { credentialId } = req.params;
      const { reason } = req.body;
      const adminDid = req.user?.did;

      if (!reason) {
        return res.status(400).json({
          success: false,
          error: 'Razón de revocación es requerida'
        });
      }

      const attestation = await prisma.attestation.findUnique({
        where: { id: credentialId },
        include: {
          claim: {
            include: {
              owner: true,
              cType: true
            }
          }
        }
      });

      if (!attestation) {
        return res.status(404).json({
          success: false,
          error: 'Credencial no encontrada'
        });
      }

      if (attestation.revoked) {
        return res.status(400).json({
          success: false,
          error: 'La credencial ya está revocada'
        });
      }

      // Actualizar la atestación como revocada
      const updatedAttestation = await prisma.attestation.update({
        where: { id: credentialId },
        data: {
          revoked: true
        },
        include: {
          claim: {
            include: {
              owner: true,
              cType: true
            }
          }
        }
      });

      // Crear notificación para el usuario
      try {
        await NotificationService.createCredentialRevokedNotification(
          attestation.claim.ownerId,
          attestation.claim.cType.name,
          adminDid || 'Sistema'
        );
      } catch (notificationError) {
        console.error('[AdminController] Error creando notificación de revocación:', notificationError);
      }

      res.json({
        success: true,
        data: updatedAttestation,
        message: 'Credencial revocada exitosamente'
      });
    } catch (error) {
      console.error('[AdminController] Error revocando credencial:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error interno del servidor' 
      });
    }
  }

  /**
   * Prepara una transacción para crear un CType que será firmada por el usuario.
   * @param req Request con los datos del CType
   * @param res Response
   */
  async prepareCTypeTransaction(req: Request, res: Response) {
    const { name, schema, isPublic, authorizedRoles, network: networkReq, userDid, userAccountAddress, paymentType, signerType } = req.body;
    const creatorDid = req.user?.did;

    if (!name || !schema || !creatorDid || !networkReq || !userDid) {
      return res.status(400).json({ success: false, error: 'Faltan parámetros requeridos: name, schema, creatorDid, network, userDid' });
    }

    // Validar y tipar la red
    const network = networkReq as KiltNetworkKey;
    if (network !== 'spiritnet' && network !== 'peregrine') {
      return res.status(400).json({ success: false, error: 'Red inválida. Debe ser "spiritnet" o "peregrine".' });
    }

    try {
      console.log(`[AdminController] Preparando transacción para CType: ${name} con DID: ${userDid}`);
      console.log(`[AdminController] Parámetros recibidos:`, {
        paymentType,
        signerType,
        userAccountAddress,
        network: networkReq
      });

      // Verificar que el DID del usuario coincide con el autenticado
      if (userDid !== creatorDid) {
        return res.status(403).json({ 
          success: false, 
          error: 'El DID de la transacción no coincide con tu DID autenticado' 
        });
      }

      // Preparar la transacción usando el DID del usuario
      const transactionData = await KiltService.prepareCTypeTransaction({
        schema: schema as ICType,
        network,
        userDid: userDid as DidUrl,
        paymentType: paymentType || 'system', // Usar el tipo de pago especificado o por defecto sistema
        signingType: signerType || 'user',    // Usar el tipo de firma especificado o por defecto usuario
        userAccountAddress: userAccountAddress, // Dirección de la cuenta del usuario si paymentType es 'user'
      });

      console.log(`[AdminController] Transacción preparada exitosamente`);
      return res.status(200).json({
        success: true,
        data: transactionData
      });

    } catch (error) {
      console.error('[AdminController] Error preparando transacción:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error interno del servidor'
      });
    }
  }

  /**
   * Envía una transacción firmada por el usuario para crear un CType.
   * @param req Request con la transacción firmada
   * @param res Response
   */
  async submitCTypeTransaction(req: Request, res: Response) {
    const { name, schema, isPublic, authorizedRoles, network: networkReq, userDid, signedExtrinsic, didKeyUri } = req.body;
    const creatorDid = req.user?.did;

    if (!name || !schema || !creatorDid || !networkReq || !userDid || !signedExtrinsic) {
      return res.status(400).json({ success: false, error: 'Faltan parámetros requeridos: name, schema, creatorDid, network, userDid, signedExtrinsic' });
    }

    // Validar y tipar la red
    const network = networkReq as KiltNetworkKey;
    if (network !== 'spiritnet' && network !== 'peregrine') {
      return res.status(400).json({ success: false, error: 'Red inválida. Debe ser "spiritnet" o "peregrine".' });
    }

    try {
      console.log(`[AdminController] Enviando transacción firmada para CType: ${name} con DID: ${userDid}`);

      // Enviar la transacción firmada usando el DID del usuario
      const onChainData = await KiltService.submitSignedCTypeTransaction(
        schema as ICType,
        network,
        userDid as DidUrl,
        signedExtrinsic
      );

      // 1. Obtener el ID del usuario creador desde la BD
      const creatorUser = await prisma.user.findUnique({
        where: { did: creatorDid }
      });

      if (!creatorUser) {
        return res.status(404).json({ success: false, error: 'Usuario creador no encontrado' });
      }

      // 2. Guardar el CType en la base de datos
      const savedCType = await prisma.cType.create({
        data: {
          name: name,
          schema: schema as any,
          ctypeHash: onChainData.ctypeHash,
          ipfsCid: null, // Temporalmente null
          network: network.toUpperCase() as 'SPIRITNET' | 'PEREGRINE',
          status: 'ACTIVE',
          blockNumber: onChainData.blockNumber,
          blockHash: onChainData.blockHash.toString(),
          transactionHash: onChainData.transactionHash,
          creatorId: creatorUser.id,
          isPublic,
          rolePermissions: {
            create: isPublic ? [] : authorizedRoles?.map((role: Role) => ({ role })) || [],
          },
        }
      });

      console.log(`[AdminController] CType successfully saved to DB with ID: ${savedCType.id}`);

      return res.status(201).json({
        success: true,
        data: {
          id: savedCType.id,
          name: savedCType.name,
          schema: savedCType.schema,
          ctypeHash: savedCType.ctypeHash,
          network: savedCType.network,
          status: savedCType.status,
          isPublic: savedCType.isPublic,
          blockNumber: savedCType.blockNumber,
          blockHash: savedCType.blockHash,
          transactionHash: savedCType.transactionHash,
          createdAt: savedCType.createdAt,
          updatedAt: savedCType.updatedAt,
        }
      });

    } catch (error) {
      console.error('[AdminController] Error enviando transacción:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtiene todos los pagos para el CRM
   */
  async getAllPayments(req: Request, res: Response) {
    try {
      console.log('📊 [AdminController] Obteniendo todos los pagos para CRM...');
      
      const payments = await prisma.identityRequest.findMany({
        orderBy: {
          requestedAt: 'desc'
        },
        select: {
          id: true,
          bitsoPaymentId: true,
          kiltAddress: true,
          amount: true,
          clabe: true,
          beneficiary: true,
          paymentStatus: true,
          paymentType: true,
          requestedAt: true,
          updatedAt: true,
          expirationDate: true,
          // Campos de transacción KILT
          kiltTransactionHash: true,
          kiltAmount: true,
          kiltBlockHash: true,
          kiltBlockNumber: true,
          kiltNetwork: true,
          kiltSentAt: true,
          user: {
            select: {
              did: true
            }
          }
        }
      });

      console.log(`✅ [AdminController] ${payments.length} pagos encontrados`);

      res.json({
        success: true,
        payments: payments.map(payment => ({
          id: payment.id,
          bitsoPaymentId: payment.bitsoPaymentId,
          kiltAddress: payment.kiltAddress,
          amount: parseFloat(payment.amount.toString()),
          clabe: payment.clabe,
          beneficiary: payment.beneficiary,
          paymentStatus: payment.paymentStatus,
          paymentType: payment.paymentType,
          requestedAt: payment.requestedAt.toISOString(),
          updatedAt: payment.updatedAt.toISOString(),
          expirationDate: payment.expirationDate?.toISOString(),
          userDid: payment.user?.did,
          // Campos de transacción KILT
          kiltTransactionHash: payment.kiltTransactionHash,
          kiltAmount: payment.kiltAmount ? parseFloat(payment.kiltAmount.toString()) : undefined,
          kiltBlockHash: payment.kiltBlockHash,
          kiltBlockNumber: payment.kiltBlockNumber,
          kiltNetwork: payment.kiltNetwork,
          kiltSentAt: payment.kiltSentAt?.toISOString()
        }))
      });
    } catch (error) {
      console.error('❌ [AdminController] Error obteniendo pagos:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error interno del servidor' 
      });
    }
  }
} 