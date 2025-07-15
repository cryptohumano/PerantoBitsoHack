import { Request, Response } from 'express';
import { prisma } from '../prisma'; // importa el cliente de Prisma
import { KiltService } from '../services/kiltService';
import { z } from 'zod';
import Ajv from 'ajv';
import { KiltNetwork } from '@prisma/client';

const claimSchema = z.object({
  cTypeId: z.string().uuid(),
  contents: z.object({}).passthrough(), // acepta cualquier objeto
  network: z.enum(['SPIRITNET', 'PEREGRINE'])
});

const ctypeSchema = z.object({
  schema: z.object({
    title: z.string().min(1),
    properties: z.record(z.any()),
    type: z.literal('object'),
    required: z.array(z.string()).optional()
  }),
  network: z.enum(['SPIRITNET', 'PEREGRINE'])
});

const attestationSchema = z.object({
  claimId: z.string().uuid(),
  attester: z.string().min(1)
});

const ajv = new Ajv();

const patchClaimSchema = claimSchema.partial();

export const credentialController = {
  // Crear un nuevo CType
  createCType: async (req: Request, res: Response) => {
    try {
      const parseResult = ctypeSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: 'Datos inválidos', details: parseResult.error.errors });
      }
      const { schema, network } = parseResult.data;
      
      // Obtener el usuario actual
      const user = await prisma.user.findUnique({
        where: { did: req.user?.did }
      });
      
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      
      const ctype = await prisma.cType.create({
        data: { 
          name: schema.title,
          schema: schema, 
          ctypeHash: `0x${Date.now().toString(16)}`, // Hash temporal
          network: network as KiltNetwork,
          status: 'ACTIVE',
          creatorId: user.id,
          isPublic: true
        }
      });
      res.status(201).json({ message: 'CType creado exitosamente', ctype });
    } catch (error) {
      res.status(500).json({ error: 'Error al crear CType', details: (error as Error).message });
    }
  },

  // Listar CTypes
  listCTypes: async (req: Request, res: Response) => {
    try {
      const ctypes = await prisma.cType.findMany({
        orderBy: { createdAt: 'desc' }
      });
      res.status(200).json(ctypes);
    } catch (error) {
      res.status(500).json({ error: 'Error al listar CTypes' });
    }
  },

  // Crear un Claim
  createClaim: async (req: Request, res: Response) => {
    try {
      const parseResult = claimSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: 'Datos inválidos', details: parseResult.error.errors });
      }
      const { cTypeId, contents, network } = parseResult.data;

      // 1. Obtén el CType correspondiente
      const ctype = await prisma.cType.findUnique({ where: { id: cTypeId } });
      if (!ctype) {
        return res.status(400).json({ error: 'CType no encontrado' });
      }

      // 2. Prepara el esquema para ajv (puede estar en ctype.schema)
      const schema = ctype.schema;

      if (!schema || typeof schema !== 'object') {
        throw new Error('El schema no es válido');
      }
      // 3. Valida el campo data contra el esquema
      const validate = ajv.compile(schema);
      const valid = validate(contents);

      if (!valid) {
        return res.status(400).json({ error: 'El campo contents no cumple con el esquema del CType', details: validate.errors });
      }

      // 4. Obtener el usuario actual
      const user = await prisma.user.findUnique({
        where: { did: req.user?.did }
      });

      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      // 5. Si todo está bien, crea el claim
      const claim = await prisma.claim.create({ 
        data: { 
          cTypeId, 
          contents, 
          network,
          ownerId: user.id, // Usar el ID del usuario
          status: 'PENDING'
        } 
      });
      res.status(201).json({ message: 'Claim creado exitosamente', claim });
    } catch (error) {
      res.status(500).json({ error: 'Error al crear Claim', details: (error as Error).message });
    }
  },

  // Listar Claims
  listClaims: async (req: Request, res: Response) => {
    try {
      const claims = await prisma.claim.findMany({
        orderBy: { createdAt: 'desc' }
      });
      res.status(200).json(claims);
    } catch (error) {
      res.status(500).json({ error: 'Error al listar Claims' });
    }
  },

  // Actualizar un CType (PUT)
  updateCType: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, schema, network } = req.body;
      const updated = await prisma.cType.update({
        where: { id },
        data: { name, schema, network }
      });
      res.status(200).json(updated);
    } catch (error) {
      res.status(500).json({ error: 'Error al actualizar CType', details: (error as Error).message });
    }
  },

  // Actualización parcial (PATCH)
  patchCType: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const updated = await prisma.cType.update({
        where: { id },
        data
      });
      res.status(200).json(updated);
    } catch (error) {
      res.status(500).json({ error: 'Error al actualizar parcialmente CType', details: (error as Error).message });
    }
  },

  // Eliminar un CType (DELETE)
  deleteCType: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await prisma.cType.delete({ where: { id } });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Error al eliminar CType', details: (error as Error).message });
    }
  },

  // Actualizar un Claim (PUT)
  updateClaim: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { contents, network } = req.body;
      const updated = await prisma.claim.update({
        where: { id },
        data: { contents, network }
      });
      res.status(200).json(updated);
    } catch (error) {
      res.status(500).json({ error: 'Error al actualizar Claim', details: (error as Error).message });
    }
  },

  // Actualización parcial (PATCH)
  patchClaim: async (req: Request, res: Response) => {
    try {
      const parseResult = patchClaimSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: 'Datos inválidos', details: parseResult.error.errors });
      }
      const { id } = req.params;
      const data = parseResult.data;
      const updated = await prisma.claim.update({
        where: { id },
        data
      });
      res.status(200).json(updated);
    } catch (error) {
      res.status(500).json({ error: 'Error al actualizar parcialmente Claim', details: (error as Error).message });
    }
  },

  // Eliminar un Claim (DELETE)
  deleteClaim: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await prisma.claim.delete({ where: { id } });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Error al eliminar Claim', details: (error as Error).message });
    }
  },

  // Crear una Attestation
  attestClaim: async (req: Request, res: Response) => {
    try {
      const parseResult = attestationSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: 'Datos inválidos', details: parseResult.error.errors });
      }
      const { claimId, attester } = parseResult.data;
      const claim = await prisma.claim.findUnique({ where: { id: claimId } });
      if (!claim) {
        return res.status(400).json({ error: 'Claim no encontrado' });
      }
      const attestation = await prisma.attestation.create({
        data: {
          claimId,
          attesterId: attester,
          ctypeId: claim.cTypeId
        }
      });
      res.status(201).json({ message: 'Attestation creada exitosamente', attestation });
    } catch (error) {
      res.status(500).json({ error: 'Error al crear Attestation', details: (error as Error).message });
    }
  },

  // Listar Attestations
  listAttestations: async (req: Request, res: Response) => {
    try {
      const attestations = await prisma.attestation.findMany({
        orderBy: { createdAt: 'desc' }
      });
      res.status(200).json(attestations);
    } catch (error) {
      res.status(500).json({ error: 'Error al listar Attestations' });
    }
  },

  // Revocar una Attestation (PATCH)
  revokeAttestation: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const attestation = await prisma.attestation.update({
        where: { id },
        data: { revoked: true }
      });
      res.status(200).json({ message: 'Attestation revocada', attestation });
    } catch (error) {
      res.status(500).json({ error: 'Error al revocar Attestation', details: (error as Error).message });
    }
  },

  // Eliminar una Attestation (DELETE)
  deleteAttestation: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await prisma.attestation.delete({ where: { id } });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Error al eliminar Attestation', details: (error as Error).message });
    }
  },
}; 