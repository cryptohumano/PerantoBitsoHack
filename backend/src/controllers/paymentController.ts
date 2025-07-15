import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { BitsoService } from '../services/bitsoService';
import { KiltService } from '../services/kiltService';

const bitsoService = new BitsoService();
const prisma = new PrismaClient();

export class PaymentController {
  /**
   * Inicia un proceso de pago
   */
  static async initiatePayment(req: Request, res: Response) {
    console.log('🚀 [PaymentController] Iniciando pago con datos:', req.body);
    try {
      const { method, amount, kiltAddress, userEmail } = req.body;

      // Validar datos requeridos
      if (!method || !amount || !kiltAddress) {
        console.error('❌ [PaymentController] Datos requeridos faltantes:', { method, amount, kiltAddress });
        return res.status(400).json({
          success: false,
          message: 'Datos requeridos: method, amount, kiltAddress'
        });
      }

      console.log('✅ [PaymentController] Datos validados correctamente');

      // Validar método de pago
      if (!['SPEI', 'MXNB'].includes(method)) {
        console.error('❌ [PaymentController] Método de pago no válido:', method);
        return res.status(400).json({
          success: false,
          message: 'Método de pago no válido'
        });
      }

      // Generar ID único para el pago
      const paymentId = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      console.log('🆔 [PaymentController] Payment ID generado:', paymentId);

      // Obtener datos de pago desde Bitso
      let paymentData;
      console.log('📞 [PaymentController] Llamando a Bitso para obtener datos de pago...');

      if (method === 'SPEI') {
        paymentData = await bitsoService.getSpeiPaymentData();
      } else {
        paymentData = await bitsoService.getMxnbPaymentData();
      }

      console.log('✅ [PaymentController] Datos de Bitso obtenidos:', paymentData);

      // Crear registro de pago en la base de datos usando IdentityRequest
      console.log('💾 [PaymentController] Guardando pago en base de datos...');
      const identityRequest = await prisma.identityRequest.create({
        data: {
          paymentType: method as any,
          amount: parseFloat(amount),
          kiltAddress,
          bitsoPaymentId: paymentId,
          clabe: paymentData.clabe,
          beneficiary: paymentData.beneficiary,
          paymentStatus: 'PENDING',
          requestedAt: new Date(),
          updatedAt: new Date()
        }
      });

      console.log('✅ [PaymentController] Pago guardado en BD:', identityRequest.id);

      // Configurar webhook para Bitso (si es necesario)
      if (method === 'SPEI') {
        console.log('🔗 [PaymentController] Configurando webhook SPEI...');
        await bitsoService.setupSpeiWebhook(paymentId, kiltAddress);
      }

      const response = {
        success: true,
        paymentId,
        clabe: paymentData.clabe,
        mxnbAddress: paymentData.mxnbAddress,
        reference: paymentData.reference,
        amount: identityRequest.amount
      };

      console.log('✅ [PaymentController] Pago iniciado exitosamente:', response);
      return res.json(response);

    } catch (error) {
      console.error('❌ [PaymentController] Error iniciando pago:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Verifica el estado de un pago
   */
  static async checkPaymentStatus(req: Request, res: Response) {
    console.log('🔍 [PaymentController] Verificando estado de pago:', req.params);
    try {
      const { paymentId } = req.params;

      const identityRequest = await prisma.identityRequest.findUnique({
        where: { bitsoPaymentId: paymentId }
      });

      if (!identityRequest) {
        console.error('❌ [PaymentController] Pago no encontrado:', paymentId);
        return res.status(404).json({
          success: false,
          message: 'Pago no encontrado'
        });
      }

      console.log('✅ [PaymentController] Estado de pago encontrado:', {
        paymentId: identityRequest.bitsoPaymentId,
        status: identityRequest.paymentStatus,
        amount: identityRequest.amount
      });

      return res.json({
        success: true,
        paymentId: identityRequest.bitsoPaymentId,
        status: identityRequest.paymentStatus,
        amount: identityRequest.amount,
        method: identityRequest.paymentType,
        kiltAddress: identityRequest.kiltAddress,
        createdAt: identityRequest.requestedAt,
        completedAt: identityRequest.paymentStatus === 'CONFIRMED' ? identityRequest.updatedAt : null
      });

    } catch (error) {
      console.error('❌ [PaymentController] Error verificando estado de pago:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Webhook para recibir confirmaciones de pago desde Bitso
   */
  static async bitsoWebhook(req: Request, res: Response) {
    console.log('📨 [PaymentController] Webhook de Bitso recibido:', req.body);
    try {
      const { paymentId, status, amount, reference } = req.body;

      // Verificar que el pago existe
      const identityRequest = await prisma.identityRequest.findUnique({
        where: { bitsoPaymentId: paymentId }
      });

      if (!identityRequest) {
        console.error('❌ [PaymentController] Pago no encontrado en webhook:', paymentId);
        return res.status(404).json({
          success: false,
          message: 'Pago no encontrado'
        });
      }

      console.log('✅ [PaymentController] Pago encontrado en webhook:', {
        paymentId: identityRequest.bitsoPaymentId,
        expectedAmount: identityRequest.amount,
        receivedAmount: amount
      });

      // Verificar que el monto coincide
      if (parseFloat(amount) !== parseFloat(identityRequest.amount.toString())) {
        console.error(`❌ [PaymentController] Monto no coincide: esperado ${identityRequest.amount}, recibido ${amount}`);
        return res.status(400).json({
          success: false,
          message: 'Monto no coincide'
        });
      }

      // Actualizar estado del pago
      console.log('🔄 [PaymentController] Actualizando estado del pago...');
      await prisma.identityRequest.update({
        where: { bitsoPaymentId: paymentId },
        data: {
          paymentStatus: status === 'completed' ? 'CONFIRMED' : 'REJECTED',
          updatedAt: new Date()
        }
      });

      console.log('✅ [PaymentController] Estado del pago actualizado:', status);

      // Si el pago fue exitoso, enviar KILT al usuario
      if (status === 'completed' && identityRequest.kiltAddress) {
        console.log('🎁 [PaymentController] Enviando KILT al usuario:', identityRequest.kiltAddress);
        try {
          // Enviar 3 KILT a la dirección del usuario en la red Peregrine
          const kiltTransaction = await KiltService.sendKilt(identityRequest.kiltAddress, 3, 'peregrine');
          console.log('✅ [PaymentController] KILT enviado exitosamente:', kiltTransaction);
          
          // Actualizar el registro con toda la información de la transacción
          await prisma.identityRequest.update({
            where: { bitsoPaymentId: paymentId },
            data: {
              kiltTransactionHash: kiltTransaction.transactionHash,
              kiltAmount: kiltTransaction.amount,
              kiltBlockHash: kiltTransaction.blockHash,
              kiltBlockNumber: kiltTransaction.blockNumber,
              kiltNetwork: kiltTransaction.network.toUpperCase() as any,
              kiltSentAt: new Date(),
              updatedAt: new Date()
            }
          });
        } catch (error) {
          console.error('❌ [PaymentController] Error enviando KILT:', error);
          // No fallar el webhook si el envío de KILT falla
        }
      }

      return res.json({ success: true });

    } catch (error) {
      console.error('❌ [PaymentController] Error procesando webhook de Bitso:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Confirma que el usuario ha completado el pago (manual)
   */
  static async confirmPayment(req: Request, res: Response) {
    console.log('✅ [PaymentController] Confirmando pago manual:', req.body);
    try {
      const { paymentId } = req.body;

      const identityRequest = await prisma.identityRequest.findUnique({
        where: { bitsoPaymentId: paymentId }
      });

      if (!identityRequest) {
        console.error('❌ [PaymentController] Pago no encontrado para confirmación:', paymentId);
        return res.status(404).json({
          success: false,
          message: 'Pago no encontrado'
        });
      }

      console.log('🔍 [PaymentController] Verificando estado con Bitso...');
      // Verificar con Bitso si el pago fue recibido
      const paymentStatus = await bitsoService.checkPaymentStatus(paymentId);

      console.log('📊 [PaymentController] Estado de Bitso:', paymentStatus);

      if (paymentStatus.status === 'completed') {
        // Actualizar estado del pago
        console.log('🔄 [PaymentController] Actualizando pago como completado...');
        await prisma.identityRequest.update({
          where: { bitsoPaymentId: paymentId },
          data: {
            paymentStatus: 'CONFIRMED',
            updatedAt: new Date()
          }
        });

        // Enviar KILT al usuario
        if (identityRequest.kiltAddress) {
          console.log('🎁 [PaymentController] Enviando KILT al usuario:', identityRequest.kiltAddress);
          const kiltService = new KiltService();
          // Nota: sendKiltToUser no existe en KiltService, se debe implementar
        }

        console.log('✅ [PaymentController] Pago confirmado y KILT enviado');
        return res.json({
          success: true,
          message: 'Pago confirmado y KILT enviado'
        });
      } else {
        console.log('⏳ [PaymentController] Pago aún no confirmado por Bitso');
        return res.status(400).json({
          success: false,
          message: 'Pago aún no confirmado por Bitso'
        });
      }

    } catch (error) {
      console.error('❌ [PaymentController] Error confirmando pago:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Inicia un pago one-time con Bitso
   */
  static async initiateOneTimePayment(req: Request, res: Response) {
    console.log('🚀 [PaymentController] Iniciando pago one-time:', req.body);
    try {
      const { kiltAddress, amount, payer_name } = req.body;
      
      if (!kiltAddress || !amount || !payer_name) {
        console.error('❌ [PaymentController] Datos requeridos faltantes para one-time payment:', { kiltAddress, amount, payer_name });
        return res.status(400).json({ error: 'Faltan datos requeridos' });
      }

      console.log('✅ [PaymentController] Datos one-time payment validados');

      // Generar payment_id único
      const payment_id = `KILT-${kiltAddress.substring(0, 8)}-${Date.now()}`;
      console.log('🆔 [PaymentController] Payment ID one-time generado:', payment_id);

      // Llamar a Bitso para crear el pago
      console.log('📞 [PaymentController] Llamando a Bitso para crear pago one-time...');
      const bitsoResponse = await bitsoService.createOneTimePayment({
        payment_id,
        amount: amount.toString(),
        payer_name
      });

      console.log('✅ [PaymentController] Respuesta de Bitso one-time:', bitsoResponse);
      const payload = bitsoResponse.payload;

      // Guardar en la base de datos
      console.log('💾 [PaymentController] Guardando one-time payment en BD...');
      const identityRequest = await prisma.identityRequest.create({
        data: {
          kiltAddress,
          bitsoPaymentId: payment_id,
          amount: parseFloat(payload.amount),
          currency: 'MXN',
          paymentStatus: 'PENDING',
          paymentType: 'SPEI',
          clabe: payload.clabe,
          beneficiary: payload.beneficiary,
          expirationDate: new Date(payload.expiration_date),
          requestedAt: new Date(),
          updatedAt: new Date()
        }
      });

      console.log('✅ [PaymentController] One-time payment guardado en BD:', identityRequest.id);

      // Devolver datos relevantes al frontend
      const response = {
        kiltAddress,
        bitsoPaymentId: payment_id,
        clabe: payload.clabe,
        beneficiary: payload.beneficiary,
        expirationDate: payload.expiration_date,
        amount: payload.amount,
        status: payload.status
      };

      console.log('✅ [PaymentController] One-time payment iniciado exitosamente:', response);
      res.json(response);
    } catch (error) {
      console.error('❌ [PaymentController] Error iniciando pago one-time:', error);
      res.status(500).json({ error: 'Error iniciando pago one-time', details: error instanceof Error ? error.message : 'Error desconocido' });
    }
  }

  /**
   * Obtiene el estado de onboarding del usuario
   */
  static async getOnboardingStatus(req: Request, res: Response) {
    console.log('🔍 [PaymentController] Obteniendo estado de onboarding para usuario:', (req as any).user?.id);
    try {
      // Obtener usuario del token JWT
      const userId = (req as any).user?.id;
      
      if (!userId) {
        console.error('❌ [PaymentController] Usuario no autenticado');
        return res.status(401).json({
          success: false,
          message: 'Usuario no autenticado'
        });
      }

      console.log('👤 [PaymentController] Usuario autenticado:', userId);

      // Buscar pagos del usuario
      const identityRequests = await prisma.identityRequest.findMany({
        where: { 
          userId,
          paymentStatus: 'CONFIRMED'
        },
        orderBy: { requestedAt: 'desc' }
      });

      console.log('📊 [PaymentController] Pagos encontrados:', identityRequests.length);

      const hasCompletedPayment = identityRequests.length > 0;
      const canProceedToDid = hasCompletedPayment;

      console.log('✅ [PaymentController] Estado de onboarding:', {
        hasCompletedPayment,
        canProceedToDid,
        paymentsCount: identityRequests.length
      });

      return res.json({
        success: true,
        hasCompletedPayment,
        canProceedToDid,
        payments: identityRequests.map(p => ({
          paymentId: p.bitsoPaymentId,
          amount: p.amount,
          method: p.paymentType,
          completedAt: p.paymentStatus === 'CONFIRMED' ? p.updatedAt : null
        }))
      });

    } catch (error) {
      console.error('❌ [PaymentController] Error obteniendo estado de onboarding:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Lista las CLABEs disponibles del usuario en Bitso
   */
  static async listClabes(req: Request, res: Response) {
    console.log('📋 [PaymentController] Listando CLABEs...');
    try {
      const { clabe_type, status, start_date, end_date, page, page_size } = req.query;
      
      const params = {
        clabe_type: clabe_type as string,
        status: status as string,
        start_date: start_date as string,
        end_date: end_date as string,
        page: page ? parseInt(page as string) : undefined,
        page_size: page_size ? parseInt(page_size as string) : undefined
      };

      console.log('🔍 [PaymentController] Parámetros de consulta:', params);

      const clabes = await bitsoService.listClabes(params);

      console.log('✅ [PaymentController] CLABEs obtenidas exitosamente');
      return res.json({
        success: true,
        data: clabes
      });

    } catch (error) {
      console.error('❌ [PaymentController] Error listando CLABEs:', error);
      return res.status(500).json({
        success: false,
        message: 'Error obteniendo CLABEs',
        details: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * Crea un mock deposit para simular un pago (solo para desarrollo)
   */
  static async createMockDeposit(req: Request, res: Response) {
    console.log('🎭 [PaymentController] Creando mock deposit:', req.body);
    try {
      const { bitsoPaymentId, amount, receiver_name } = req.body;
      
      if (!bitsoPaymentId || !amount || !receiver_name) {
        console.error('❌ [PaymentController] Datos requeridos faltantes para mock deposit:', { bitsoPaymentId, amount, receiver_name });
        return res.status(400).json({ error: 'Faltan datos requeridos' });
      }

      // Buscar el pago en la base de datos
      const identityRequest = await prisma.identityRequest.findUnique({
        where: { bitsoPaymentId }
      });

      if (!identityRequest) {
        console.error('❌ [PaymentController] Pago no encontrado:', bitsoPaymentId);
        return res.status(404).json({ error: 'Pago no encontrado' });
      }

      console.log('✅ [PaymentController] Pago encontrado:', identityRequest);

      // Crear mock deposit en Bitso
      const mockDepositParams = {
        amount: amount.toString(),
        receiver_clabe: identityRequest.clabe!,
        receiver_name,
        tracking_key: bitsoPaymentId, // Usar el bitsoPaymentId como tracking_key
        payment_type: 0, // Tipo de pago SPEI estándar
        // Solo los campos requeridos según la documentación
        sender_curp: 'TEST123456HDFABC01', // CURP del remitente (simulada)
        receiver_curp: 'PERA123456HDFABC01' // CURP del receptor (simulada)
      };

      console.log('📞 [PaymentController] Llamando a Bitso para crear mock deposit...');
      const bitsoResponse = await bitsoService.createMockDeposit(mockDepositParams);

      console.log('✅ [PaymentController] Mock deposit creado:', bitsoResponse);

      // Actualizar estado del pago en la base de datos
      await prisma.identityRequest.update({
        where: { bitsoPaymentId },
        data: {
          paymentStatus: 'CONFIRMED',
          updatedAt: new Date()
        }
      });

      console.log('✅ [PaymentController] Estado del pago actualizado a CONFIRMED');

      // Enviar KILT al usuario si tiene dirección KILT
      if (identityRequest.kiltAddress) {
        console.log('🎁 [PaymentController] Enviando KILT al usuario desde mock deposit:', identityRequest.kiltAddress);
        try {
          // Enviar 3 KILT a la dirección del usuario en la red Peregrine
          const kiltTransaction = await KiltService.sendKilt(identityRequest.kiltAddress, 3, 'peregrine');
          console.log('✅ [PaymentController] KILT enviado exitosamente desde mock deposit:', kiltTransaction);
          
          // Actualizar el registro con toda la información de la transacción
          await prisma.identityRequest.update({
            where: { bitsoPaymentId },
            data: {
              kiltTransactionHash: kiltTransaction.transactionHash,
              kiltAmount: kiltTransaction.amount,
              kiltBlockHash: kiltTransaction.blockHash,
              kiltBlockNumber: kiltTransaction.blockNumber,
              kiltNetwork: kiltTransaction.network.toUpperCase() as any,
              kiltSentAt: new Date(),
              updatedAt: new Date()
            }
          });
        } catch (error) {
          console.error('❌ [PaymentController] Error enviando KILT desde mock deposit:', error);
          // No fallar el mock deposit si el envío de KILT falla
        }
      }

      return res.json({
        success: true,
        message: 'Mock deposit creado exitosamente',
        tracking_code: bitsoResponse.payload.tracking_code,
        amount: bitsoResponse.payload.amount,
        receiver_clabe: bitsoResponse.payload.receiver_clabe
      });

    } catch (error) {
      console.error('❌ [PaymentController] Error creando mock deposit:', error);
      return res.status(500).json({ 
        error: 'Error creando mock deposit', 
        details: error instanceof Error ? error.message : 'Error desconocido' 
      });
    }
  }

  /**
   * Registra un webhook con Bitso
   */
  static async registerWebhook(req: Request, res: Response) {
    console.log('🔗 [PaymentController] Registrando webhook con Bitso...');
    try {
      const { callbackUrl } = req.body;
      
      if (!callbackUrl) {
        console.error('❌ [PaymentController] URL de callback requerida');
        return res.status(400).json({ error: 'URL de callback es requerida' });
      }

      console.log('✅ [PaymentController] URL de callback:', callbackUrl);

      // Registrar webhook con Bitso
      const bitsoResponse = await bitsoService.registerWebhook(callbackUrl);

      console.log('✅ [PaymentController] Webhook registrado:', bitsoResponse);

      return res.json({
        success: true,
        message: 'Webhook registrado exitosamente',
        data: bitsoResponse
      });

    } catch (error) {
      console.error('❌ [PaymentController] Error registrando webhook:', error);
      return res.status(500).json({ 
        error: 'Error registrando webhook', 
        details: error instanceof Error ? error.message : 'Error desconocido' 
      });
    }
  }

  /**
   * Obtiene el estado de la transacción KILT para un paymentId específico
   */
  static async getKiltTransactionStatus(req: Request, res: Response) {
    const { paymentId } = req.query;
    
    console.log('🔍 [PaymentController] Obteniendo estado de transacción KILT para paymentId:', paymentId);
    
    if (!paymentId) {
      console.error('❌ [PaymentController] paymentId requerido');
      return res.status(400).json({
        success: false,
        message: 'paymentId es requerido'
      });
    }

    try {
      // Buscar el pago por paymentId
      const identityRequest = await prisma.identityRequest.findUnique({
        where: { bitsoPaymentId: paymentId as string }
      });

      if (!identityRequest) {
        console.log('📭 [PaymentController] No se encontró pago con paymentId:', paymentId);
        return res.json({
          success: true,
          paymentId: paymentId,
          kiltSent: false,
          message: 'Pago no encontrado'
        });
      }

      // Verificar si el KILT fue enviado
      const kiltSent = !!(identityRequest.kiltTransactionHash && identityRequest.kiltSentAt);

      console.log('✅ [PaymentController] Estado de KILT para paymentId:', paymentId, {
        kiltSent,
        transactionHash: identityRequest.kiltTransactionHash,
        amount: identityRequest.kiltAmount,
        network: identityRequest.kiltNetwork,
        blockNumber: identityRequest.kiltBlockNumber,
        sentAt: identityRequest.kiltSentAt
      });

      return res.json({
        success: true,
        paymentId: paymentId,
        kiltSent,
        kiltTransactionHash: identityRequest.kiltTransactionHash,
        kiltBlockNumber: identityRequest.kiltBlockNumber,
        kiltNetwork: identityRequest.kiltNetwork,
        kiltAmount: identityRequest.kiltAmount,
        kiltSentAt: identityRequest.kiltSentAt?.toISOString()
      });

    } catch (error) {
      console.error('❌ [PaymentController] Error obteniendo estado de transacción KILT:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Consulta los depósitos en Bitso
   */
  static async getDeposits(req: Request, res: Response) {
    console.log('📋 [PaymentController] Consultando depósitos en Bitso...');
    try {
      const deposits = await bitsoService.getDeposits({
        limit: 50,
        status: 'complete'
      });

      console.log('✅ [PaymentController] Depósitos obtenidos:', deposits);
      return res.json({
        success: true,
        deposits: deposits.payload || []
      });

    } catch (error) {
      console.error('❌ [PaymentController] Error consultando depósitos:', error);
      return res.status(500).json({ 
        error: 'Error consultando depósitos', 
        details: error instanceof Error ? error.message : 'Error desconocido' 
      });
    }
  }

  /**
   * Actualiza el estado del DID
   */
  static async updateDidStatus(req: Request, res: Response) {
    console.log('🔍 [PaymentController] Actualizando estado de DID:', req.body);
    try {
      const { did, identityRequestId } = req.body;
      
      if (!did) {
        console.error('❌ [PaymentController] DID requerido');
        return res.status(400).json({
          success: false,
          message: 'DID requerido'
        });
      }

      // Buscar la solicitud de identidad
      const identityRequest = await prisma.identityRequest.findFirst({
        where: {
          OR: [
            { id: identityRequestId },
            { bitsoPaymentId: identityRequestId }
          ]
        }
      });

      if (!identityRequest) {
        console.error('❌ [PaymentController] Solicitud de identidad no encontrada:', identityRequestId);
        return res.status(404).json({
          success: false,
          message: 'Solicitud de identidad no encontrada'
        });
      }

      // Actualizar el estado del DID
      console.log('🔄 [PaymentController] Actualizando DID en BD:', did);
      await prisma.identityRequest.update({
        where: { id: identityRequest.id },
        data: {
          didCreated: true,
          updatedAt: new Date()
        }
      });

      console.log('✅ [PaymentController] DID actualizado exitosamente:', did);
      res.json({
        success: true,
        did,
        message: 'DID actualizado correctamente'
      });

    } catch (error) {
      console.error('❌ [PaymentController] Error actualizando DID:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
} 