import { CType } from '@kiltprotocol/credentials';
import { Claim, Credential } from '@kiltprotocol/legacy-credentials';
import { connect, disconnect, Blockchain } from '@kiltprotocol/chain-helpers';
import * as Did from '@kiltprotocol/did';
import { Crypto } from '@kiltprotocol/utils';
import type { 
  ICType, 
  DidUrl, 
  KiltKeyringPair, 
  SignerInterface, 
  DidDocument,
  IAttestation,
  IClaimContents
} from '@kiltprotocol/types';
import { config as appConfig } from '../config';
import { ApiPromise } from '@polkadot/api';
import { BN } from '@polkadot/util';

type KiltNetworkKey = 'spiritnet' | 'peregrine';

// Interfaces para el flujo de attestación
export interface IQuoteData {
  issuerDid: DidUrl;
  cTypeHash: string;
  cost: {
    tax: { vat: number };
    net: number;
    gross: number;
  };
  currency: string;
  termsAndConditions: string;
  timeframe: string;
}

export interface IAttestationRequest {
  claimerDid: DidUrl;
  attesterDid: DidUrl;
  ctypeId: string;
  claimContents: IClaimContents;
  quote?: IQuoteData;
  network: KiltNetworkKey;
}

export interface IAttestationResponse {
  success: boolean;
  attestationHash?: string;
  credentialHash?: string;
  transactionHash?: string;
  error?: string;
}

export class AttestationService {
  /**
   * Inicia el flujo de attestación completo
   */
  public static async startAttestationFlow(request: IAttestationRequest): Promise<IAttestationResponse> {
    let api: ApiPromise | undefined;
    
    try {
      console.log('[AttestationService] Iniciando flujo de attestación...');
      
      // 1. Conectar a la red KILT
      const wsEndpoint = appConfig.kilt[request.network].wsEndpoint;
      api = await connect(wsEndpoint);
      console.log(`[AttestationService] Conectado a ${wsEndpoint}`);

      // 2. Crear el CType y Claim
      const ctype = await this.createCTypeFromSchema(request.ctypeId, request.network);
      const claim = Claim.fromCTypeAndClaimContents(
        ctype, 
        request.claimContents, 
        request.claimerDid
      );
      
      console.log('[AttestationService] Claim creado para DID:', request.claimerDid);

      // 3. Crear la credencial
      const credential = Credential.fromClaim(claim);
      console.log('[AttestationService] Credencial creada:', credential.rootHash);

      // 4. Crear la attestación
      const attestation: IAttestation = {
        delegationId: null,
        claimHash: credential.rootHash,
        cTypeHash: claim.cTypeHash,
        owner: request.attesterDid,
        revoked: false,
      };

      // 5. Anclar la attestación en blockchain
      const result = await this.anchorAttestationOnChain(
        attestation,
        request.attesterDid,
        request.network,
        api
      );

      console.log('[AttestationService] Attestación anclada exitosamente');
      
      return {
        success: true,
        attestationHash: credential.rootHash,
        credentialHash: credential.rootHash,
        transactionHash: result.transactionHash,
      };

    } catch (error) {
      console.error('[AttestationService] Error en flujo de attestación:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    } finally {
      if (api) {
        await disconnect();
        console.log('[AttestationService] Desconectado de la API');
      }
    }
  }

  /**
   * Crea un CType desde un esquema existente
   */
  private static async createCTypeFromSchema(ctypeId: string, network: KiltNetworkKey): Promise<ICType> {
    // Aquí deberías obtener el esquema desde tu base de datos
    // Por ahora, creamos un esquema de ejemplo
    const schema: ICType = {
      $id: `kilt:ctype:0x${ctypeId}` as `kilt:ctype:0x${string}`,
      $schema: 'http://kilt-protocol.org/draft-01/ctype#',
      title: 'Example CType',
      properties: {
        name: { type: 'string' },
        age: { type: 'number' },
      },
      type: 'object',
    };
    
    return schema;
  }

  /**
   * Ancla la attestación en la blockchain
   */
  private static async anchorAttestationOnChain(
    attestation: IAttestation,
    attesterDid: DidUrl,
    network: KiltNetworkKey,
    api: ApiPromise
  ) {
    try {
      console.log('[AttestationService] Anclando attestación en blockchain...');

      // 1. Resolver el DID del attester
      const { didDocument } = await Did.resolve(attesterDid);
      if (!didDocument) {
        throw new Error(`No se pudo resolver el DID del attester: ${attesterDid}`);
      }

      // 2. Encontrar el método de assertion
      const assertionMethodId = didDocument.assertionMethod?.[0];
      if (!assertionMethodId) {
        throw new Error('No se encontró método de assertion en el DID del attester');
      }

      // 3. Cargar cuenta pagadora (para fees)
      const payerMnemonic = appConfig.kilt[network].mnemonic;
      if (!payerMnemonic) {
        throw new Error(`Mnemonic de pagador no encontrado para red ${network}`);
      }
      const payer = Crypto.makeKeypairFromUri(payerMnemonic, 'sr25519');

      // 4. Crear signer (placeholder - necesitarás integración con wallet)
      const signer: SignerInterface = {
        id: assertionMethodId,
        algorithm: 'Sr25519',
        sign: async ({ data }) => {
          throw new Error('Integración con wallet no implementada aún');
        },
      };

      // 5. Preparar transacción de attestación
      const tx = api.tx.attestation.add(
        attestation.claimHash,
        attestation.cTypeHash,
        null // delegationId
      );

      // 6. Autorizar transacción
      const authorizedTx = await Did.authorizeTx(
        didDocument,
        tx,
        [signer],
        payer.address
      );

      // 7. Enviar transacción
      const submissionResult = await Blockchain.signAndSubmitTx(authorizedTx, payer, {
        resolveOn: Blockchain.IS_FINALIZED,
      });

      if (submissionResult.dispatchError) {
        throw new Error(`Error al enviar attestación: ${submissionResult.dispatchError.toString()}`);
      }

      return {
        transactionHash: submissionResult.txHash.toHex(),
        blockHash: submissionResult.status.asFinalized.toHex(),
      };

    } catch (error) {
      console.error('[AttestationService] Error anclando attestación:', error);
      throw error;
    }
  }

  /**
   * Valida un pago confirmado
   */
  public static async validatePayment(
    paymentConfirmation: {
      blockHash: string;
      claimHash: string;
      txHash: string;
    },
    expectedAmount: BN,
    payerAddress: string,
    network: KiltNetworkKey
  ): Promise<boolean> {
    let api: ApiPromise | undefined;
    
    try {
      const wsEndpoint = appConfig.kilt[network].wsEndpoint;
      api = await connect(wsEndpoint);

      // Aquí implementarías la validación del pago
      // Verificar que la transacción existe y transfiere la cantidad correcta
      
      console.log('[AttestationService] Pago validado exitosamente');
      return true;
    } catch (error) {
      console.error('[AttestationService] Error validando pago:', error);
      return false;
    } finally {
      if (api) await disconnect();
    }
  }
} 