import { CType } from '@kiltprotocol/credentials';
import { Crypto } from '@kiltprotocol/utils';
import type {
  ICType,
  DidUrl,
  KiltKeyringPair,
  SignerInterface,
  DidDocument,
} from '@kiltprotocol/types';
import { config as appConfig } from '../config';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { BN } from '@polkadot/util';
import { encodeAddress } from '@polkadot/util-crypto';
import { resolveUserDidWithNetworkDetection } from '../utilities/didResolver';
import '@kiltprotocol/augment-api';

type KiltNetworkKey = 'spiritnet' | 'peregrine';

export interface CTypeCreationOptions {
  schema: ICType;
  network: KiltNetworkKey;
  userDid: DidUrl;
  paymentType: 'system' | 'user';
  signingType: 'system' | 'user';
  userAccountAddress?: string; // Solo necesario si paymentType es 'user'
}

export interface CTypeTransactionData {
  extrinsic: string;
  submitter: string;
  ctypeId: string;
  userDid: DidUrl;
  network: KiltNetworkKey;
  paymentType: 'system' | 'user';
  signingType: 'system' | 'user';
}

export interface CTypeCreationResult {
  blockHash: string;
  blockNumber: number;
  transactionHash: string;
  ctypeHash: string;
}

export class KiltService {
  /**
   * Prepara una transacción para crear un CType con opciones flexibles de pago y firma.
   * @param options Opciones de creación del CType
   * @returns Datos de la transacción preparada
   */
  public static async prepareCTypeTransaction(options: CTypeCreationOptions): Promise<CTypeTransactionData> {
    let api: ApiPromise | undefined;
    console.log(`[KiltService] Preparando transacción CType para DID: ${options.userDid} en red: ${options.network}`);
    console.log(`[KiltService] Tipo de pago: ${options.paymentType}, Tipo de firma: ${options.signingType}`);
    
    try {
      // 1. Usar la red especificada por el frontend
      const actualNetwork = options.network;
      console.log(`[KiltService] Usando red especificada por el frontend: ${actualNetwork}`);
      
      // 3. Conectar a la red KILT usando Polkadot API directamente
      const wsEndpoint = appConfig.kilt[actualNetwork].wsEndpoint;
      const provider = new WsProvider(wsEndpoint);
      api = await ApiPromise.create({ provider });
      console.log(`[KiltService] Conectado a ${wsEndpoint}`);

      // 4. Preparar el CType
      const ctypeId = CType.getIdForSchema(options.schema);
      options.schema.$id = ctypeId;
      CType.verifyDataStructure(options.schema);
      const ctypeInstance = options.schema;
      console.log(`[KiltService] Instancia CType creada con ID: ${ctypeInstance.$id}`);

      // 5. Determinar el submitter basado en el tipo de pago (mover antes de crear la transacción)
      let submitter: string;
      
      console.log(`[KiltService] Opciones recibidas:`, {
        paymentType: options.paymentType,
        userAccountAddress: options.userAccountAddress,
        signingType: options.signingType
      });
      
      if (options.paymentType === 'system') {
        // Sistema paga - usar cuenta del sistema
        const payerMnemonic = appConfig.kilt[actualNetwork].mnemonic;
        if (!payerMnemonic) throw new Error(`Mnemonic del pagador no encontrado para red ${actualNetwork}`);
        const payer = Crypto.makeKeypairFromUri(payerMnemonic, 'sr25519');
        submitter = payer.address;
        console.log(`[KiltService] Sistema pagará con cuenta: ${submitter}`);
      } else {
        // Usuario paga - usar cuenta del usuario
        if (!options.userAccountAddress) {
          throw new Error('Dirección de cuenta del usuario requerida cuando paymentType es "user"');
        }
        submitter = options.userAccountAddress;
        console.log(`[KiltService] Usuario pagará con cuenta: ${submitter}`);
      }
      
      // 6. Crear la transacción
      let tx;
      
      if (options.signingType === 'user') {
        // Para transacciones firmadas por el usuario, crear una extrínseca sin firmar
        // Sporran puede estar teniendo problemas con call data, intentemos con extrínseca completa
        const tx = api.tx.ctype.add(CType.toChain(ctypeInstance));
        
        // Crear una extrínseca sin firmar con la versión correcta de la API
        const unsignedExtrinsic = tx.toHex();
        console.log(`[KiltService] Extrínseca sin firmar creada para el usuario:`, {
          method: `ctype.add`,
          extrinsicHex: unsignedExtrinsic,
          extrinsicLength: unsignedExtrinsic.length,
          extrinsicPreview: unsignedExtrinsic.substring(0, 50) + '...',
          methodSection: tx.method.section,
          methodMethod: tx.method.method,
          methodArgs: tx.method.args.map(arg => arg.toString()),
          isSigned: tx.isSigned,
          signer: tx.signer?.toString(),
        });
        
        // Retornar la extrínseca sin firmar
        const result: CTypeTransactionData = {
          extrinsic: unsignedExtrinsic, // Extrínseca completa sin firmar
          submitter,
          ctypeId: ctypeInstance.$id,
          userDid: options.userDid,
          network: actualNetwork,
          paymentType: options.paymentType,
          signingType: options.signingType,
        };

        console.log(`[KiltService] Call data preparado exitosamente para DID: ${options.userDid}`);
        return result;
      } else {
        // Para transacciones firmadas por el sistema, crear normalmente
        tx = api.tx.ctype.add(CType.toChain(ctypeInstance));
        console.log(`[KiltService] Transacción creada para firma del sistema:`, {
          method: `${tx.method.section}.${tx.method.method}`,
          args: tx.method.args.map(arg => arg.toString()),
          signer: tx.signer?.toString(),
          era: tx.era?.toString(),
          nonce: tx.nonce?.toString(),
        });
      }
      
      // 7. Para transacciones firmadas por el sistema, crear el resultado normal
      const result: CTypeTransactionData = {
        extrinsic: tx.toHex(),
        submitter,
        ctypeId: ctypeInstance.$id,
        userDid: options.userDid,
        network: actualNetwork,
        paymentType: options.paymentType,
        signingType: options.signingType,
      };

      console.log(`[KiltService] Transacción preparada exitosamente para DID: ${options.userDid}`);
      return result;
    } catch (error) {
        console.error('[KiltService] Error preparando transacción CType:', error);
        throw error;
    } finally {
      if (api) {
        await api.disconnect();
        console.log(`[KiltService] Desconectado de API.`);
      }
    }
  }

  /**
   * Crea un CType usando el sistema para pagar y firmar (modelo de créditos).
   * @param schema El esquema del CType
   * @param network La red KILT a usar
   * @param userDid El DID del usuario que solicita el CType
   * @returns Resultado de la creación del CType
   */
  public static async createCTypeWithSystemPayment(
    schema: ICType,
    network: KiltNetworkKey,
    userDid: DidUrl
  ): Promise<CTypeCreationResult> {
    let api: ApiPromise | undefined;
    console.log(`[KiltService] Creando CType con pago del sistema para DID: ${userDid} en red: ${network}`);
    try {
      const wsEndpoint = appConfig.kilt[network].wsEndpoint;
      const provider = new WsProvider(wsEndpoint);
      api = await ApiPromise.create({ provider });
      console.log(`[KiltService] Conectado a ${wsEndpoint}`);

      // Cargar cuenta pagadora del sistema
      const payerMnemonic = appConfig.kilt[network].mnemonic;
      if (!payerMnemonic) throw new Error(`Mnemonic del pagador no encontrado para red ${network}`);
      const payer = Crypto.makeKeypairFromUri(payerMnemonic, 'sr25519');
      console.log(`[KiltService] Cuenta pagadora cargada: ${payer.address}`);

      // Preparar el CType
      const ctypeId = CType.getIdForSchema(schema);
      schema.$id = ctypeId;
      CType.verifyDataStructure(schema);
      const ctypeInstance = schema;
      console.log(`[KiltService] Instancia CType creada con ID: ${ctypeInstance.$id}`);

      // Crear y firmar la extrínseca
      const tx = api.tx.ctype.add(CType.toChain(ctypeInstance));
      const unsub = await tx.signAndSend(payer, async (result) => {
        if (result.status.isInBlock || result.status.isFinalized) {
          console.log(`[KiltService] Transacción incluida en bloque: ${result.status.asFinalized.toHex()}`);
          if (result.dispatchError) {
            throw new Error(`Error al enviar CType a la blockchain: ${result.dispatchError.toString()}`);
          }
        }
      });

      // Esperar inclusión (simplificado)
      await new Promise(resolve => setTimeout(resolve, 15000));
      const blockHash = await api.rpc.chain.getBlockHash();
      const blockHeader = await api.rpc.chain.getHeader(blockHash);
      const result: CTypeCreationResult = {
        blockHash: blockHash.toHex(),
        blockNumber: blockHeader.number.toNumber(),
        transactionHash: tx.hash.toHex(),
        ctypeHash: CType.idToHash(ctypeInstance.$id),
      };
      console.log(`[KiltService] Creación de CType exitosa. Hash del bloque: ${result.blockHash}`);
      return result;
    } catch (error) {
      console.error('[KiltService] Error durante la creación del CType:', error);
      throw error;
    } finally {
      if (api) await api.disconnect();
      console.log(`[KiltService] Desconectado de API.`);
    }
  }

  /**
   * Envía una transacción CType firmada por el usuario.
   * @param schema El esquema del CType
   * @param network La red KILT a usar
   * @param userDid El DID del usuario que firmó la transacción
   * @param signedExtrinsic La extrínseca firmada por el wallet del usuario
   * @returns Resultado de la creación del CType
   */
  public static async submitSignedCTypeTransaction(
    schema: ICType,
    network: KiltNetworkKey,
    userDid: DidUrl,
    signedExtrinsic: string
  ): Promise<CTypeCreationResult> {
    let api: ApiPromise | undefined;
    console.log(`[KiltService] Enviando transacción CType firmada para DID: ${userDid} en red: ${network}`);
    
    try {
      // 1. Usar la red especificada por el frontend
      const actualNetwork = network;
      
      // 2. Conectar a la red usando Polkadot API
      const wsEndpoint = appConfig.kilt[actualNetwork].wsEndpoint;
      const provider = new WsProvider(wsEndpoint);
      api = await ApiPromise.create({ provider });
      console.log(`[KiltService] Conectado a ${wsEndpoint}`);

      // 3. Preparar el CType para verificación
      const ctypeId = CType.getIdForSchema(schema);
      schema.$id = ctypeId;
      CType.verifyDataStructure(schema);
      const ctypeInstance = schema;
      console.log(`[KiltService] Instancia CType verificada con ID: ${ctypeInstance.$id}`);

      // 4. Enviar la transacción firmada
      console.log(`[KiltService] Enviando extrínseca firmada para DID: ${userDid}`);
      console.log(`[KiltService] Extrínseca firmada: ${signedExtrinsic.substring(0, 100)}...`);
      console.log(`[KiltService] Longitud de la extrínseca: ${signedExtrinsic.length}`);
      console.log(`[KiltService] Extrínseca completa: ${signedExtrinsic}`);
      
      // Verificar que la extrínseca sea válida antes de enviarla
      try {
        const decodedExtrinsic = api.createType('Extrinsic', signedExtrinsic);
        console.log(`[KiltService] Extrínseca decodificada exitosamente`);
        console.log(`[KiltService] Método: ${decodedExtrinsic.method.section}.${decodedExtrinsic.method.method}`);
        console.log(`[KiltService] Signer: ${decodedExtrinsic.signer?.toString()}`);
      } catch (decodeError) {
        console.error(`[KiltService] Error decodificando extrínseca:`, decodeError);
      }
      
      // Enviar la transacción usando el método más directo
      console.log(`[KiltService] Enviando transacción usando submitExtrinsic...`);
      const txHash = await api.rpc.author.submitExtrinsic(signedExtrinsic);
      console.log(`[KiltService] Transacción enviada con hash: ${txHash.toHex()}`);

      // 5. Esperar finalización (simplificado)
      console.log(`[KiltService] Esperando finalización de la transacción...`);
      await new Promise(resolve => setTimeout(resolve, 15000)); // 15 segundos

      // 6. Obtener información del bloque
      const blockHash = await api.rpc.chain.getBlockHash();
      const blockHeader = await api.rpc.chain.getHeader(blockHash);
      
      const result: CTypeCreationResult = {
        blockHash: blockHash.toHex(),
        blockNumber: blockHeader.number.toNumber(),
        transactionHash: txHash.toHex(),
        ctypeHash: CType.idToHash(ctypeInstance.$id),
      };

      console.log(`[KiltService] Creación de CType exitosa con transacción firmada por usuario. Hash del bloque: ${result.blockHash}`);
      return result;
    } catch (error) {
        console.error('[KiltService] Error enviando transacción CType firmada:', error);
        throw error;
    } finally {
      if (api) {
        await api.disconnect();
        console.log(`[KiltService] Desconectado de API.`);
      }
    }
  }

  /**
   * Prepara una transacción para crear un CType que requiere autorización con DID.
   * Este método crea la transacción base que luego debe ser autorizada con el DID del usuario.
   * @param options Opciones de creación del CType
   * @returns Datos de la transacción preparada para autorización
   */
  public static async prepareCTypeForDidAuthorization(options: CTypeCreationOptions): Promise<CTypeTransactionData> {
    let api: ApiPromise | undefined;
    console.log(`[KiltService] Preparando transacción CType para autorización DID: ${options.userDid} en red: ${options.network}`);
    
    try {
      // 1. Conectar a la red KILT
      const wsEndpoint = appConfig.kilt[options.network].wsEndpoint;
      const provider = new WsProvider(wsEndpoint);
      api = await ApiPromise.create({ provider });
      console.log(`[KiltService] Conectado a ${wsEndpoint}`);

      // 2. Preparar el CType
      const ctypeId = CType.getIdForSchema(options.schema);
      options.schema.$id = ctypeId;
      CType.verifyDataStructure(options.schema);
      const ctypeInstance = options.schema;
      console.log(`[KiltService] Instancia CType creada con ID: ${ctypeInstance.$id}`);

      // 3. Crear la transacción base (sin firmar)
      const tx = api.tx.ctype.add(CType.toChain(ctypeInstance));
      console.log(`[KiltService] Transacción base creada:`, {
        method: `${tx.method.section}.${tx.method.method}`,
        args: tx.method.args.map(arg => arg.toString()),
        isSigned: tx.isSigned,
        signer: tx.signer?.toString(),
      });

      // 4. Determinar el submitter basado en el tipo de pago
      let submitter: string;
      
      if (options.paymentType === 'system') {
        // Sistema paga - usar cuenta del sistema
        const payerMnemonic = appConfig.kilt[options.network].mnemonic;
        if (!payerMnemonic) throw new Error(`Mnemonic del pagador no encontrado para red ${options.network}`);
        const payer = Crypto.makeKeypairFromUri(payerMnemonic, 'sr25519');
        submitter = payer.address;
        console.log(`[KiltService] Sistema pagará con cuenta: ${submitter}`);
      } else {
        // Usuario paga - usar cuenta del usuario
        if (!options.userAccountAddress) {
          throw new Error('Dirección de cuenta del usuario requerida cuando paymentType es "user"');
        }
        submitter = options.userAccountAddress;
        console.log(`[KiltService] Usuario pagará con cuenta: ${submitter}`);
      }

      // 5. Retornar la transacción preparada
      const result: CTypeTransactionData = {
        extrinsic: tx.toHex(),
        submitter,
        ctypeId: ctypeInstance.$id,
        userDid: options.userDid,
        network: options.network,
        paymentType: options.paymentType,
        signingType: options.signingType,
      };

      console.log(`[KiltService] Transacción preparada para autorización DID: ${options.userDid}`);
      return result;
    } catch (error) {
      console.error('[KiltService] Error preparando transacción para autorización DID:', error);
      throw error;
    } finally {
      if (api) {
        await api.disconnect();
        console.log(`[KiltService] Desconectado de API.`);
      }
    }
  }

  /**
   * Envía una transacción CType que ha sido autorizada con DID y firmada por el usuario.
   * @param schema El esquema del CType
   * @param network La red KILT a usar
   * @param userDid El DID del usuario que autorizó la transacción
   * @param authorizedExtrinsic La extrínseca autorizada con DID y firmada
   * @returns Resultado de la creación del CType
   */
  public static async submitDidAuthorizedCTypeTransaction(
    schema: ICType,
    network: KiltNetworkKey,
    userDid: DidUrl,
    authorizedExtrinsic: string
  ): Promise<CTypeCreationResult> {
    let api: ApiPromise | undefined;
    console.log(`[KiltService] Enviando transacción CType autorizada con DID: ${userDid} en red: ${network}`);
    
    try {
      // 1. Conectar a la red
      const wsEndpoint = appConfig.kilt[network].wsEndpoint;
      const provider = new WsProvider(wsEndpoint);
      api = await ApiPromise.create({ provider });
      console.log(`[KiltService] Conectado a ${wsEndpoint}`);

      // 2. Verificar el CType
      const ctypeId = CType.getIdForSchema(schema);
      schema.$id = ctypeId;
      CType.verifyDataStructure(schema);
      const ctypeInstance = schema;
      console.log(`[KiltService] Instancia CType verificada con ID: ${ctypeInstance.$id}`);

      // 3. Verificar que la extrínseca sea válida
      try {
        const decodedExtrinsic = api.createType('Extrinsic', authorizedExtrinsic);
        console.log(`[KiltService] Extrínseca autorizada decodificada:`, {
          method: `${decodedExtrinsic.method.section}.${decodedExtrinsic.method.method}`,
          signer: decodedExtrinsic.signer?.toString(),
          isSigned: decodedExtrinsic.isSigned,
          era: decodedExtrinsic.era?.toString(),
          nonce: decodedExtrinsic.nonce?.toString(),
        });
      } catch (decodeError) {
        console.error(`[KiltService] Error decodificando extrínseca autorizada:`, decodeError);
        throw new Error('La extrínseca autorizada no es válida');
      }

      // 4. Enviar la transacción autorizada
      console.log(`[KiltService] Enviando transacción autorizada con DID...`);
      const txHash = await api.rpc.author.submitExtrinsic(authorizedExtrinsic);
      console.log(`[KiltService] Transacción enviada con hash: ${txHash.toHex()}`);

      // 5. Esperar finalización
      console.log(`[KiltService] Esperando finalización de la transacción...`);
      await new Promise(resolve => setTimeout(resolve, 15000));

      // 6. Obtener información del bloque
      const blockHash = await api.rpc.chain.getBlockHash();
      const blockHeader = await api.rpc.chain.getHeader(blockHash);
      
      const result: CTypeCreationResult = {
        blockHash: blockHash.toHex(),
        blockNumber: blockHeader.number.toNumber(),
        transactionHash: txHash.toHex(),
        ctypeHash: CType.idToHash(ctypeInstance.$id),
      };

      console.log(`[KiltService] Creación de CType exitosa con autorización DID. Hash del bloque: ${result.blockHash}`);
      return result;
    } catch (error) {
      console.error('[KiltService] Error enviando transacción autorizada con DID:', error);
      throw error;
    } finally {
      if (api) {
        await api.disconnect();
        console.log(`[KiltService] Desconectado de API.`);
      }
    }
  }

  /**
   * Envía KILT a una dirección usando la cuenta custodio
   * @param toAddress Dirección KILT destino
   * @param amount Cantidad de KILT a enviar (en KILT, no en Plancks)
   * @param network Red KILT ('peregrine' o 'spiritnet')
   * @returns Información completa de la transacción
   */
  public static async sendKilt(toAddress: string, amount: number, network: KiltNetworkKey): Promise<{
    transactionHash: string;
    blockHash: string;
    blockNumber: number;
    network: KiltNetworkKey;
    amount: number;
  }> {
    let api: ApiPromise | undefined;
    try {
      const wsEndpoint = appConfig.kilt[network].wsEndpoint;
      const payerMnemonic = appConfig.kilt[network].mnemonic;
      if (!payerMnemonic) throw new Error(`Mnemonic del pagador no encontrado para red ${network}`);
      const payer = Crypto.makeKeypairFromUri(payerMnemonic, 'sr25519');
      const provider = new WsProvider(wsEndpoint);
      api = await ApiPromise.create({ provider });
      console.log(`[KiltService] Conectado a ${wsEndpoint}`);
      
      // KILT tiene 15 decimales (según la documentación)
      const decimals = 15;
      const amountPlanck = BigInt(Math.floor(amount * 10 ** decimals)).toString();
      
      // En KILT, las transferencias se hacen usando el pallet balances
      // Usar el método correcto para transferir tokens en KILT
      // Según la documentación, usar transferKeepAlive para evitar que la cuenta se elimine
      const tx = api.tx.balances.transferKeepAlive(toAddress, amountPlanck);
      
      // Verificar el balance de la cuenta custodio antes de enviar
      const balance = await api.query.system.account(payer.address);
      const availableBalance = balance.data.free;
      console.log(`[KiltService] Balance disponible en cuenta custodio:`, {
        address: payer.address,
        balance: availableBalance.toString(),
        balanceInKilt: (parseInt(availableBalance.toString()) / Math.pow(10, 15)).toFixed(6),
        amountToSend: amount,
        amountInPlanck: amountPlanck
      });

      // Verificar si hay suficientes fondos
      const amountPlanckBN = new BN(amountPlanck);
      // Verificar si hay suficientes fondos (log simplificado)
      console.log(`[KiltService] Verificando fondos: ${(parseInt(availableBalance.toString()) / Math.pow(10, 15)).toFixed(6)} KILT disponible para enviar ${amount} KILT`);
      
      if (availableBalance.lt(amountPlanckBN)) {
        throw new Error(`Fondos insuficientes. Disponible: ${(parseInt(availableBalance.toString()) / Math.pow(10, 15)).toFixed(6)} KILT, Requerido: ${amount} KILT`);
      }

      console.log(`[KiltService] Transacción de transferencia creada:`, {
        method: `${tx.method.section}.${tx.method.method}`,
        toAddress,
        amountPlanck,
        payerAddress: payer.address
      });
      
      return new Promise<{
        transactionHash: string;
        blockHash: string;
        blockNumber: number;
        network: KiltNetworkKey;
        amount: number;
      }>((resolve, reject) => {
        tx.signAndSend(payer, async ({ status, dispatchError, txHash }) => {
          if (dispatchError) {
            if (dispatchError.isModule && api) {
              const decoded = api.registry.findMetaError(dispatchError.asModule);
              const errorMsg = `${decoded.section}.${decoded.name}: ${decoded.docs.join(' ')}`;
              console.error(`[KiltService] Error en transferencia: ${errorMsg}`);
              reject(new Error(errorMsg));
            } else {
              console.error(`[KiltService] Error en transferencia: ${dispatchError.toString()}`);
              reject(new Error(dispatchError.toString()));
            }
          } else if (status.isInBlock || status.isFinalized) {
            console.log(`[KiltService] Transferencia incluida en bloque. Hash: ${txHash.toHex()}`);
            
            // Obtener información del bloque
            let blockHashHex = '';
            let blockNumber = 0;
            
            if (api) {
              try {
                const blockHash = await api.rpc.chain.getBlockHash();
                const blockHeader = await api.rpc.chain.getHeader(blockHash);
                blockNumber = blockHeader.number.toNumber();
                blockHashHex = blockHash.toHex();
                console.log(`[KiltService] Información del bloque: Hash=${blockHashHex}, Number=${blockNumber}`);
              } catch (error) {
                console.error(`[KiltService] Error obteniendo información del bloque:`, error);
              }
            }
            
            const result = {
              transactionHash: txHash.toHex(),
              blockHash: blockHashHex,
              blockNumber,
              network,
              amount
            };
            
            // Desconectar después de que la transacción se complete exitosamente
            if (api) {
              api.disconnect().then(() => {
                console.log(`[KiltService] Desconectado de API después de transferencia exitosa.`);
                resolve(result);
              });
            } else {
              resolve(result);
            }
          }
        }).catch((error) => {
          // Desconectar en caso de error también
          if (api) {
            api.disconnect().then(() => {
              console.log(`[KiltService] Desconectado de API después de error.`);
              reject(error);
            });
          } else {
            reject(error);
          }
        });
      });
    } catch (error) {
      console.error('[KiltService] Error enviando KILT:', error);
      // Desconectar en caso de error en la creación de la transacción
      if (api) {
        await api.disconnect();
        console.log(`[KiltService] Desconectado de API después de error en creación.`);
      }
      throw error;
    }
  }
}