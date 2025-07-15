import { PrismaClient } from '@prisma/client';
import { PaymentType, PaymentStatus, IdentityRequestStatus } from '@prisma/client';

const prisma = new PrismaClient();

export interface PaymentServiceConfig {
  junoApiKey: string;
  junoApiUrl: string;
  arbitrumRpcUrl: string;
  mxnbContractAddress: string;
  kiltAmountToSend: number;
  serviceAccountAddress: string;
}

export class PaymentService {
  private config: PaymentServiceConfig;

  constructor(config: PaymentServiceConfig) {
    this.config = config;
  }

  /**
   * Inicia una solicitud de identidad digital
   */
  async createIdentityRequest(userId: string, paymentType: PaymentType, amount: number) {
    try {
      const identityRequest = await prisma.identityRequest.create({
        data: {
          userId,
          paymentType,
          amount,
          currency: 'MXN',
          paymentStatus: PaymentStatus.PENDING,
        },
      });

      // Crear también el registro de onboarding
      await prisma.onboardingStatus.create({
        data: {
          requestId: identityRequest.id,
          paymentStatus: PaymentStatus.PENDING,
        },
      });

      return identityRequest;
    } catch (error) {
      console.error('Error creating identity request:', error);
      throw error;
    }
  }

  /**
   * Procesa un pago detectado (llamado por los listeners)
   */
  async processPayment(
    paymentReference: string,
    amount: number,
    paymentType: PaymentType,
    transactionHash?: string,
    network?: string
  ) {
    try {
      // Buscar la solicitud de identidad por referencia de pago
      const identityRequest = await prisma.identityRequest.findFirst({
        where: {
          bitsoPaymentId: paymentReference,
          paymentStatus: PaymentStatus.PENDING,
        },
        include: {
          user: true,
        },
      });

      if (!identityRequest) {
        console.log(`No se encontró solicitud de identidad para pago: ${paymentReference}`);
        return null;
      }

      // Crear el evento de pago
      const paymentEvent = await prisma.paymentEvent.create({
        data: {
          type: paymentType,
          amount,
          currency: 'MXN',
          userId: identityRequest.userId,
          paymentReference,
          status: PaymentStatus.CONFIRMED,
          confirmedAt: new Date(),
          transactionHash,
          network,
          identityRequestId: identityRequest.id,
        },
      });

      // Actualizar estado de la solicitud
      await prisma.identityRequest.update({
        where: { id: identityRequest.id },
        data: { paymentStatus: PaymentStatus.CONFIRMED },
      });

      // Actualizar estado de onboarding
      await prisma.onboardingStatus.update({
        where: { requestId: identityRequest.id },
        data: { paymentStatus: PaymentStatus.CONFIRMED },
      });

      return { identityRequest, paymentEvent };
    } catch (error) {
      console.error('Error processing payment:', error);
      throw error;
    }
  }

  /**
   * Envía KILT al usuario tras confirmación de pago
   */
  async sendKiltToUser(identityRequestId: string) {
    try {
      const identityRequest = await prisma.identityRequest.findUnique({
        where: { id: identityRequestId },
        include: { user: true },
      });

      if (!identityRequest || !identityRequest.kiltAddress) {
        throw new Error('Solicitud no encontrada o sin dirección KILT');
      }

      // TODO: Implementar envío de KILT usando KiltService
      // const kiltService = new KiltService();
      // await kiltService.sendKilt(identityRequest.kiltAddress, this.config.kiltAmountToSend);

      // Actualizar estado de KILT enviado
      await prisma.identityRequest.update({
        where: { id: identityRequestId },
        data: { 
          kiltSentAt: new Date(),
          kiltAmount: this.config.kiltAmountToSend,
        },
      });

      return true;
    } catch (error) {
      console.error('Error sending KILT to user:', error);
      throw error;
    }
  }

  /**
   * Obtiene el estado de onboarding de un usuario
   */
  async getOnboardingStatus(userId: string) {
    try {
      const identityRequest = await prisma.identityRequest.findFirst({
        where: { userId },
        include: {
          payment: true,
        },
        orderBy: { requestedAt: 'desc' },
      });

      return identityRequest;
    } catch (error) {
      console.error('Error getting onboarding status:', error);
      throw error;
    }
  }

  /**
   * Verifica si un usuario puede proceder con la creación de FullDID
   */
  async canProceedToDidCreation(userId: string): Promise<boolean> {
    try {
      const status = await this.getOnboardingStatus(userId);
      
      if (!status) return false;
      
      return (
        status.paymentStatus === PaymentStatus.CONFIRMED &&
        status.kiltSentAt !== null
      );
    } catch (error) {
      console.error('Error checking DID creation eligibility:', error);
      return false;
    }
  }
} 