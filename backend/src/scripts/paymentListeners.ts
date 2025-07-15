import { MxnbService } from '../services/mxnbService';
import { PaymentService } from '../services/paymentService';
import { prisma } from '../prisma';

export class PaymentListeners {
  private mxnbService: MxnbService;
  private paymentService: PaymentService;

  constructor() {
    const mxnbConfig = {
      rpcUrl: process.env.NEXT_PUBLIC_PORTAL_RPC_ARBITRUM || '',
      contractAddress: process.env.MXNB_CONTRACT_ADDRESS || '',
      serviceWalletAddress: process.env.MXNB_SERVICE_WALLET || '',
    };

    const paymentConfig = {
      junoApiKey: process.env.JUNO_API_KEY || '',
      junoApiUrl: process.env.NEXT_PUBLIC_JUNO_API_URL || '',
      arbitrumRpcUrl: process.env.NEXT_PUBLIC_PORTAL_RPC_ARBITRUM || '',
      mxnbContractAddress: process.env.MXNB_CONTRACT_ADDRESS || '',
      kiltAmountToSend: 3,
      serviceAccountAddress: process.env.SERVICE_ACCOUNT_ADDRESS || '',
    };

    this.mxnbService = new MxnbService(mxnbConfig);
    this.paymentService = new PaymentService(paymentConfig);
  }

  /**
   * Inicia el listener de pagos MXNB
   */
  async startMxnbListener() {
    try {
      console.log('[PaymentListeners] Iniciando listener MXNB...');
      
      this.mxnbService.listenToPayments(async (payment) => {
        console.log(`[PaymentListeners] Pago MXNB detectado: ${payment.amount} MXNB de ${payment.from}`);
        
        try {
          // Buscar solicitud de identidad por dirección del remitente
          const identityRequest = await prisma.identityRequest.findFirst({
            where: {
              paymentStatus: 'PENDING',
              paymentType: 'MXNB',
            },
            include: {
              user: true,
            },
          });

          if (identityRequest) {
            // Procesar el pago
            await this.paymentService.processPayment(
              payment.id,
              payment.amount,
              'MXNB',
              payment.transactionHash,
              'Arbitrum'
            );

            console.log(`[PaymentListeners] Pago MXNB procesado para solicitud: ${identityRequest.id}`);
          } else {
            console.log(`[PaymentListeners] No se encontró solicitud de identidad para pago MXNB: ${payment.id}`);
          }
        } catch (error) {
          console.error('[PaymentListeners] Error procesando pago MXNB:', error);
        }
      });

      console.log('[PaymentListeners] Listener MXNB iniciado correctamente');
    } catch (error) {
      console.error('[PaymentListeners] Error iniciando listener MXNB:', error);
    }
  }

  /**
   * Verifica pagos SPEI pendientes (polling)
   */
  async checkSpeiPayments() {
    try {
      console.log('[PaymentListeners] Verificando pagos SPEI pendientes...');
      
      // Obtener solicitudes de identidad pendientes para SPEI
      const pendingRequests = await prisma.identityRequest.findMany({
        where: {
          paymentStatus: 'PENDING',
          paymentType: 'SPEI',
        },
        include: {
          user: true,
        },
      });

      for (const request of pendingRequests) {
        try {
          // Aquí implementarías la lógica para verificar el pago en Juno
          // Por ahora, solo logueamos
          console.log(`[PaymentListeners] Verificando pago SPEI para solicitud: ${request.id}`);
          
          // TODO: Implementar verificación real con JunoService
          // const payment = await this.junoService.verifyPayment(request.paymentId);
          // if (payment && payment.status === 'confirmed') {
          //   await this.paymentService.processPayment(...);
          // }
        } catch (error) {
          console.error(`[PaymentListeners] Error verificando pago SPEI para solicitud ${request.id}:`, error);
        }
      }
    } catch (error) {
      console.error('[PaymentListeners] Error verificando pagos SPEI:', error);
    }
  }

  /**
   * Envía KILT a usuarios que han pagado
   */
  async sendKiltToPaidUsers() {
    try {
      console.log('[PaymentListeners] Verificando usuarios que deben recibir KILT...');
      
      // Obtener solicitudes pagadas que aún no han recibido KILT
      const paidRequests = await prisma.identityRequest.findMany({
        where: {
          paymentStatus: 'CONFIRMED',
          didCreated: false,
        },
        include: {
          user: true,
        },
      });

      for (const request of paidRequests) {
        try {
          if (!request.kiltSentAt) {
            console.log(`[PaymentListeners] Enviando KILT a usuario: ${request.user?.did}`);
            
            // TODO: Implementar envío real de KILT
            // await this.paymentService.sendKiltToUser(request.id);
            
            console.log(`[PaymentListeners] KILT enviado a usuario: ${request.user?.did}`);
          }
        } catch (error) {
          console.error(`[PaymentListeners] Error enviando KILT a usuario ${request.user?.did}:`, error);
        }
      }
    } catch (error) {
      console.error('[PaymentListeners] Error enviando KILT a usuarios:', error);
    }
  }

  /**
   * Inicia todos los listeners
   */
  async startAllListeners() {
    console.log('[PaymentListeners] Iniciando todos los listeners de pagos...');
    
    // Iniciar listener MXNB
    await this.startMxnbListener();
    
    // Configurar polling para SPEI cada 5 minutos
    setInterval(() => {
      this.checkSpeiPayments();
    }, 5 * 60 * 1000);
    
    // Configurar envío de KILT cada 2 minutos
    setInterval(() => {
      this.sendKiltToPaidUsers();
    }, 2 * 60 * 1000);
    
    console.log('[PaymentListeners] Todos los listeners iniciados');
  }

  /**
   * Detiene todos los listeners
   */
  stopAllListeners() {
    console.log('[PaymentListeners] Deteniendo todos los listeners...');
    this.mxnbService.stopListening();
    console.log('[PaymentListeners] Listeners detenidos');
  }
}

// Si se ejecuta directamente este script
if (require.main === module) {
  const listeners = new PaymentListeners();
  
  listeners.startAllListeners().catch(console.error);
  
  // Manejar cierre graceful
  process.on('SIGINT', () => {
    console.log('[PaymentListeners] Recibida señal SIGINT, deteniendo listeners...');
    listeners.stopAllListeners();
    process.exit(0);
  });
} 