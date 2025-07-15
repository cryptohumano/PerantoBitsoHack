import { 
  getExtensions, 
  watchExtensions,
  initializeKiltExtensionAPI,
  type InjectedWindowProvider,
  type PubSubSessionV1,
  type PubSubSessionV2,
  type IEncryptedMessageV1
} from '@kiltprotocol/kilt-extension-api';
// Definir el tipo DidUrl localmente para evitar dependencias
type DidUrl = string;
import { init } from '@kiltprotocol/sdk-js';
import type { ISessionRequest, ISessionResponse } from '@/types/kilt';

// Tipo de extensión KILT con métodos adicionales que pueden estar disponibles
type KiltExtension = InjectedWindowProvider<PubSubSessionV1 | PubSubSessionV2> & {
  getDidList?(): Promise<DidUrl[]>;
  getAccounts?(): Promise<{ address: string; name?: string }[]>;
};

// Tipos para manejar diferentes versiones de sesión (priorizar V1)
type Session = PubSubSessionV1 | PubSubSessionV2;

// Tipo para información de extensión
interface ExtensionInfo {
  name: string;
  version: string;
  specVersion?: string;
}

class KiltExtensionService {
  private static instance: KiltExtensionService;
  private extension: KiltExtension | null = null;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;
  private cleanupWatcher: (() => void) | null = null;
  private currentSession: Session | null = null;

  private constructor() {
    if (typeof window !== 'undefined') {
      console.log('[KiltExtensionService] Inicializando API de KILT...');
      
      // Observar cambios en las extensiones
      this.cleanupWatcher = watchExtensions((extensions) => {
        console.log('[KiltExtensionService] Extensiones actualizadas:', {
          count: extensions.length,
          extensions: extensions.map(ext => ({
            name: ext.name,
            version: ext.version,
            specVersion: (ext as ExtensionInfo).specVersion
          }))
        });
        
        if (extensions.length > 0) {
          this.extension = extensions[0] as KiltExtension;
          this.isInitialized = true;
          console.log('[KiltExtensionService] Extensión detectada y actualizada:', {
            name: this.extension.name,
            version: this.extension.version,
            specVersion: (this.extension as ExtensionInfo).specVersion
          });
        } else {
          console.log('[KiltExtensionService] No se detectaron extensiones');
          this.extension = null;
          this.isInitialized = false;
        }
      });
    }
  }

  public static getInstance(): KiltExtensionService {
    if (!KiltExtensionService.instance) {
      KiltExtensionService.instance = new KiltExtensionService();
    }
    return KiltExtensionService.instance;
  }

  public async initialize(): Promise<void> {
    if (this.initializationPromise) {
      console.log('[KiltExtensionService] Inicialización ya en progreso...');
      return this.initializationPromise;
    }

    this.initializationPromise = (async () => {
      if (this.isInitialized) {
        console.log('[KiltExtensionService] Ya inicializado');
        return;
      }

      try {
        console.log('[KiltExtensionService] Iniciando SDK...');
        // Inicializar SDK
        await init();

        // Verificar si window.kilt existe
        if (typeof window === 'undefined') {
          console.log('[KiltExtensionService] Ejecutando en servidor, no se puede detectar la extensión');
          return;
        }

        // Inicializar la API de extensiones KILT (esto es crucial)
        console.log('[KiltExtensionService] Inicializando API de extensiones KILT...');
        initializeKiltExtensionAPI();
        console.log('[KiltExtensionService] API de extensiones inicializada, esperando inyección...');

        // Esperar un poco para que las extensiones se inyecten
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Obtener extensiones disponibles usando la API oficial
        console.log('[KiltExtensionService] Intentando obtener extensiones...');
        const extensions = getExtensions();
        console.log('[KiltExtensionService] Extensiones encontradas:', {
          count: extensions.length,
          extensions: extensions.map(ext => ({
            name: ext.name,
            version: ext.version,
            specVersion: (ext as ExtensionInfo).specVersion
          }))
        });

        if (extensions.length === 0) {
          console.log('[KiltExtensionService] No se encontraron extensiones KILT');
          return;
        }

        this.extension = extensions[0] as KiltExtension;
        this.isInitialized = true;
        console.log('[KiltExtensionService] Extensión inicializada correctamente:', {
          name: this.extension.name,
          version: this.extension.version,
          specVersion: (this.extension as ExtensionInfo).specVersion
        });
      } catch (error) {
        console.error('[KiltExtensionService] Error inicializando:', error);
        this.isInitialized = false;
        throw error;
      } finally {
        this.initializationPromise = null;
      }
    })();

    return this.initializationPromise;
  }

  public isExtensionAvailable(): boolean {
    const isAvailable = this.isInitialized && this.extension !== null;
    console.log('[KiltExtensionService] Verificando disponibilidad:', {
      isInitialized: this.isInitialized,
      hasExtension: this.extension !== null,
      isAvailable,
      extensionInfo: this.extension ? {
        name: this.extension.name,
        version: this.extension.version,
        specVersion: (this.extension as ExtensionInfo).specVersion
      } : null,
      availableMethods: this.extension ? {
        getDidList: typeof this.extension.getDidList === 'function',
        getAccounts: typeof this.extension.getAccounts === 'function',
        signWithDid: typeof this.extension.signWithDid === 'function',
        signExtrinsicWithDid: typeof this.extension.signExtrinsicWithDid === 'function',
        startSession: typeof this.extension.startSession === 'function'
      } : null
    });
    return isAvailable;
  }

  /**
   * Obtiene la lista de DIDs del usuario desde la extensión Sporran.
   * @returns Promise<DidUrl[]>
   */
  public async getDids(): Promise<DidUrl[]> {
    if (!this.isExtensionAvailable()) {
      console.error('[KiltExtensionService] Intento de obtener DIDs sin extensión inicializada');
      throw new Error('Extensión no inicializada');
    }
    
    // Verificar si el método getDidList está disponible
    if (!this.extension?.getDidList) {
      console.error('[KiltExtensionService] Método getDidList no disponible en la extensión');
      throw new Error('La extensión no soporta la obtención de DIDs. Verifica que estés usando una versión compatible de Sporran.');
    }
    
    console.log('[KiltExtensionService] Obteniendo lista de DIDs...');
    const dids = await this.extension.getDidList();
    console.log('[KiltExtensionService] DIDs obtenidos (raw):', dids);
    
    // Convertir a array de strings, manejando tanto strings como objetos
    const didUrls = dids.map((item: DidUrl | { did: DidUrl }) => {
      if (typeof item === 'string') {
        return item;
      } else if (item && typeof item === 'object' && 'did' in item) {
        return item.did;
      } else {
        console.warn('[KiltExtensionService] Formato de DID desconocido:', item);
        return null;
      }
    }).filter((did: DidUrl | null) => did !== null) as DidUrl[];
    
    console.log('[KiltExtensionService] DIDs procesados:', didUrls);
    return didUrls;
  }

  /**
   * Obtiene las direcciones KILT directamente desde Sporran.
   * @returns Promise<{ address: string; name?: string }[]>
   */
  public async getKiltAccounts(): Promise<{ address: string; name?: string }[]> {
    if (!this.isExtensionAvailable()) {
      console.error('[KiltExtensionService] Intento de obtener cuentas sin extensión inicializada');
      throw new Error('Extensión no inicializada');
    }
    
    // Verificar si el método getAccounts está disponible
    if (!this.extension?.getAccounts) {
      console.error('[KiltExtensionService] Método getAccounts no disponible en la extensión');
      throw new Error('La extensión no soporta la obtención de cuentas. Verifica que estés usando una versión compatible de Sporran.');
    }
    
    console.log('[KiltExtensionService] Obteniendo cuentas KILT desde Sporran...');
    const accounts = await this.extension.getAccounts();
    console.log('[KiltExtensionService] Cuentas obtenidas (raw):', accounts);
    
    // Las direcciones ya vienen en formato KILT (prefix 38) desde Sporran
    const kiltAccounts = accounts.map(account => ({
      address: account.address,
      name: account.name || 'Cuenta sin nombre'
    }));
    
    console.log('[KiltExtensionService] Cuentas KILT procesadas:', kiltAccounts);
    return kiltAccounts;
  }

  /**
   * Obtiene la lista de DIDs y permite al usuario seleccionar uno antes de iniciar la sesión.
   * Sigue las especificaciones oficiales de KILT.
   */
  public async getDidsForSelection(): Promise<DidUrl[]> {
    if (!this.isExtensionAvailable()) {
      throw new Error('La extensión KILT/Sporran no está disponible.');
    }
    
    console.log('[KiltExtensionService] Obteniendo DIDs para selección...');
    const dids = await this.getDids();
    console.log('[KiltExtensionService] Todos los DIDs obtenidos:', dids);
    
    const fullDids = dids.filter(did => !did.includes(':light:'));
    console.log('[KiltExtensionService] DIDs completos filtrados:', fullDids);
    
    if (fullDids.length === 0) {
      throw new Error('No se encontraron identidades completas (Full DIDs) en Sporran.');
    }
    
    console.log('[KiltExtensionService] DIDs completos disponibles:', fullDids);
    return fullDids;
  }

  /**
   * Inicia una sesión con un DID específico seleccionado por el usuario.
   * Usa las interfaces oficiales de KILT para sesiones.
   */
  public async startSessionWithSelectedDid(
    selectedDid: DidUrl,
    sessionRequest: ISessionRequest
  ): Promise<{ session: Session, did: DidUrl, sessionResponse: ISessionResponse }> {
    if (!this.isExtensionAvailable()) {
      throw new Error('La extensión KILT/Sporran no está disponible.');
    }

    if (selectedDid.includes(':light:')) {
      throw new Error('No se puede usar un Light DID. Selecciona un Full DID.');
    }

    console.log('[KiltExtensionService] Iniciando sesión con DID seleccionado:', selectedDid);
    console.log('[KiltExtensionService] SessionRequest:', sessionRequest);
    
    // Verificar que el DID seleccionado esté disponible en la extensión
    const availableDids = await this.getDids();
    console.log('[KiltExtensionService] DIDs disponibles en la extensión:', availableDids);
    
    if (!availableDids.includes(selectedDid)) {
      throw new Error(`El DID seleccionado ${selectedDid} no está disponible en la extensión.`);
    }
    
    // Iniciar la sesión usando la extensión
    const session = await this.extension!.startSession(
      sessionRequest.name,
      sessionRequest.encryptionKeyUri,
      sessionRequest.challenge
    );
    
    console.log('[KiltExtensionService] Sesión iniciada:', session);
    
    // Extraer información de la sesión
    let sessionEncryptionKey: string;
    if ('encryptionKeyUri' in session) {
      sessionEncryptionKey = session.encryptionKeyUri;
    } else if ('encryptionKeyId' in session) {
      sessionEncryptionKey = session.encryptionKeyId;
    } else {
      throw new Error('No se pudo obtener la clave de encriptación de la sesión');
    }
    
    console.log('[KiltExtensionService] Clave de encriptación extraída:', sessionEncryptionKey);
    
    // IMPORTANTE: Verificar si la sesión está usando un Light DID
    if (sessionEncryptionKey.includes(':light:')) {
      console.warn('[KiltExtensionService] ADVERTENCIA: La sesión está usando un Light DID. Esto puede causar problemas de autenticación.');
      console.warn('[KiltExtensionService] DID seleccionado:', selectedDid);
      console.warn('[KiltExtensionService] DID de la sesión:', sessionEncryptionKey);
    }
    
    this.currentSession = session;
    
    // Preparar la respuesta de sesión usando las interfaces oficiales
    const sessionResponse: ISessionResponse = {
      encryptionKeyUri: sessionEncryptionKey as DidUrl,
      encryptedChallenge: session.encryptedChallenge,
      nonce: session.nonce,
    };
    
    console.log('[KiltExtensionService] Respuesta de sesión preparada:', {
      encryptionKeyUri: sessionResponse.encryptionKeyUri,
      encryptedChallenge: sessionResponse.encryptedChallenge.substring(0, 20) + '...',
      nonce: sessionResponse.nonce.substring(0, 20) + '...'
    });
    
    // Retornar el DID seleccionado (no el de la sesión) para la autenticación
    return { session, did: selectedDid, sessionResponse };
  }

  public async listenForMessages(
    callback: (message: IEncryptedMessageV1) => Promise<void>
  ): Promise<void> {
    if (!this.currentSession) {
      throw new Error('No hay una sesión activa. Inicia una sesión primero con startSession().');
    }

    if (!this.currentSession.listen) {
      throw new Error('La sesión actual no soporta el método listen.');
    }

    console.log('[KiltExtensionService] Configurando listener para mensajes...');
    
    // Detectar versión de sesión y usar el callback apropiado
    if ('encryptionKeyId' in this.currentSession) {
      // PubSubSessionV1
      await (this.currentSession as PubSubSessionV1).listen(callback);
    } else {
      // PubSubSessionV2 - convertir el callback
      await (this.currentSession as PubSubSessionV2).listen(async (message) => {
        // Convertir IEncryptedMessage a IEncryptedMessageV1 si es necesario
        const v1Message: IEncryptedMessageV1 = {
          receiverKeyId: ((message as { receiverKeyUri?: string; receiverKeyId?: string }).receiverKeyUri || (message as { receiverKeyUri?: string; receiverKeyId?: string }).receiverKeyId || '') as DidUrl,
          senderKeyId: ((message as { senderKeyUri?: string; senderKeyId?: string }).senderKeyUri || (message as { senderKeyUri?: string; senderKeyId?: string }).senderKeyId || '') as DidUrl,
          ciphertext: message.ciphertext,
          nonce: message.nonce
        };
        await callback(v1Message);
      });
    }
  }

  public async sendMessage(message: IEncryptedMessageV1): Promise<void> {
    if (!this.currentSession) {
      throw new Error('No hay una sesión activa. Inicia una sesión primero con startSession().');
    }

    if (!this.currentSession.send) {
      throw new Error('La sesión actual no soporta el método send.');
    }

    console.log('[KiltExtensionService] Enviando mensaje:', message);
    
    // Detectar versión de sesión y enviar apropiadamente
    if ('encryptionKeyId' in this.currentSession) {
      // PubSubSessionV1
      await (this.currentSession as PubSubSessionV1).send(message);
    } else {
      // PubSubSessionV2 - convertir el mensaje
      const v2Message = {
        receiverKeyUri: message.receiverKeyId,
        senderKeyUri: message.senderKeyId,
        ciphertext: message.ciphertext,
        nonce: message.nonce
      };
      await (this.currentSession as PubSubSessionV2).send(v2Message);
    }
  }

  public async closeSession(): Promise<void> {
    if (!this.currentSession) {
      console.log('[KiltExtensionService] No hay sesión activa para cerrar');
      return;
    }

    if (!this.currentSession.close) {
      console.warn('[KiltExtensionService] La sesión actual no soporta el método close.');
      return;
    }

    console.log('[KiltExtensionService] Cerrando sesión...');
    await this.currentSession.close();
    this.currentSession = null;
  }

  public getCurrentSession(): Session | null {
    return this.currentSession;
  }

  public isSessionActive(): boolean {
    return this.currentSession !== null;
  }

  public cleanup() {
    console.log('[KiltExtensionService] Limpiando servicio...');
    
    // Cerrar sesión activa si existe
    if (this.currentSession) {
      this.closeSession().catch(error => {
        console.error('[KiltExtensionService] Error al cerrar sesión durante cleanup:', error);
      });
    }
    
    if (this.cleanupWatcher) {
      this.cleanupWatcher();
      this.cleanupWatcher = null;
    }
  }

  /**
   * Firma un mensaje arbitrario con un DID completo usando la extensión Sporran.
   * @param message Mensaje a firmar (string)
   * @param did DID completo a usar para la firma
   * @returns Promise<{ signature: string, didKeyUri: string }>
   */
  public async signWithDid(message: string, did: DidUrl): Promise<{ signature: string, didKeyUri: string }> {
    if (!this.isExtensionAvailable()) {
      throw new Error('La extensión KILT/Sporran no está disponible.');
    }
    if (did.includes(':light:')) {
      throw new Error('No se puede firmar con un Light DID. Selecciona un Full DID.');
    }
    if (!this.extension?.signWithDid) {
      throw new Error('La extensión no soporta signWithDid. Actualiza Sporran.');
    }
    const result = await this.extension.signWithDid(message);
    return {
      signature: result.signature,
      didKeyUri: result.didKeyUri
    };
  }

  /**
   * Firma una extrinsic (transacción) con un DID completo usando la extensión Sporran.
   * @param extrinsic Extrinsic a firmar (hex string)
   * @param submitter Dirección KILT del submitter
   * @param did DID completo a usar para la firma
   * @returns Promise<{ signed: string, didKeyUri: string }>
   */
  public async signExtrinsicWithDid(extrinsic: string, submitter: string, did: DidUrl): Promise<{ signed: string, didKeyUri: string }> {
    if (!this.isExtensionAvailable()) {
      throw new Error('La extensión KILT/Sporran no está disponible.');
    }
    if (did.includes(':light:')) {
      throw new Error('No se puede firmar con un Light DID. Selecciona un Full DID.');
    }
    if (!this.extension?.signExtrinsicWithDid) {
      throw new Error('La extensión no soporta signExtrinsicWithDid. Actualiza Sporran.');
    }
    
    console.log('[KiltExtensionService] Firmando extrinsic con DID:', {
      did,
      submitter,
      extrinsicLength: extrinsic.length,
      extrinsicPreview: extrinsic.substring(0, 100) + '...'
    });
    
    // Según la documentación oficial: (extrinsic: HexString, signer: KiltAddress)
    // El signer debe ser una dirección KILT válida
    const result = await this.extension.signExtrinsicWithDid(extrinsic as `0x${string}`, submitter as `4${string}`);
    
    console.log('[KiltExtensionService] Extrinsic firmada exitosamente:', {
      signedLength: result.signed.length,
      didKeyUri: result.didKeyUri
    });
    
    return {
      signed: result.signed,
      didKeyUri: result.didKeyUri
    };
  }

  /**
   * Firma una extrinsic (transacción) con un DID completo usando la extensión Sporran.
   * Versión mejorada con mejor logging y manejo de errores.
   * @param extrinsic Extrinsic a firmar (hex string)
   * @param submitter Dirección KILT del submitter
   * @param did DID completo a usar para la firma
   * @returns Promise<{ signed: string, didKeyUri: string }>
   */
  public async signExtrinsicWithDidImproved(
    extrinsic: string,
    submitter: string,
    did: DidUrl
  ): Promise<{ signed: string, didKeyUri: string }> {
    console.log('🚀🚀🚀 [KiltExtensionService] MÉTODO MEJORADO LLAMADO! 🚀🚀🚀');
    console.log('🚀🚀🚀 [KiltExtensionService] signExtrinsicWithDidImproved ejecutándose 🚀🚀🚀');
    
    if (!this.isExtensionAvailable()) {
      throw new Error('La extensión KILT/Sporran no está disponible.');
    }
    if (did.includes(':light:')) {
      throw new Error('No se puede firmar con un Light DID. Selecciona un Full DID.');
    }
    if (!this.extension?.signExtrinsicWithDid) {
      throw new Error('La extensión no soporta signExtrinsicWithDid. Actualiza Sporran.');
    }
    
    console.log('[KiltExtensionService] Firmando extrínseca con DID (versión mejorada):', {
      did,
      submitter,
      extrinsicLength: extrinsic.length,
      extrinsicPreview: extrinsic.substring(0, 100) + '...',
      extrinsicComplete: extrinsic
    });
    
    // Verificar que la dirección del submitter sea válida
    if (!submitter.startsWith('4')) {
      throw new Error(`Dirección del submitter inválida: ${submitter}. Debe empezar con '4'`);
    }
    
    // Verificar que la extrínseca sea válida (debe empezar con 0x)
    if (!extrinsic.startsWith('0x')) {
      throw new Error(`Extrínseca inválida: ${extrinsic}. Debe empezar con '0x'`);
    }
    console.log('[KiltExtensionService] Extrínseca procesada:', {
      extrinsic: extrinsic,
      extrinsicLength: extrinsic.length,
      extrinsicPreview: extrinsic.substring(0, 50) + '...'
    });
    
    try {
      // Intentar extraer solo los call data de la extrínseca
      // La extrínseca completa incluye metadata que puede confundir a Sporran
      console.log('[KiltExtensionService] Analizando extrínseca:', {
        extrinsic: extrinsic,
        submitter: submitter,
        extrinsicType: typeof extrinsic,
        submitterType: typeof submitter
      });
      
      // La extrínseca que recibimos del backend es una transacción completa sin firmar
      // Sporran la interpretará y firmará correctamente
      const result = await this.extension.signExtrinsicWithDid(extrinsic as `0x${string}`, submitter as `4${string}`);
      
      console.log('[KiltExtensionService] Extrínseca firmada por Sporran:', {
        signedLength: result.signed.length,
        didKeyUri: result.didKeyUri,
        signedPreview: result.signed.substring(0, 100) + '...',
        signedComplete: result.signed
      });
      
      return {
        signed: result.signed,
        didKeyUri: result.didKeyUri
      };
    } catch (error) {
      console.error('[KiltExtensionService] Error firmando extrinsic con DID:', error);
      throw error;
    }
  }
}

export const kiltExtensionService = KiltExtensionService.getInstance(); 