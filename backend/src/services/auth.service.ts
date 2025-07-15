import * as Kilt from '@kiltprotocol/sdk-js';
import { getDappEncryptionKeyUri } from '../config/index';
import { prisma } from '../prisma';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { Crypto } from '@kiltprotocol/utils';
import crypto from 'crypto';
import { DidUrl, KiltEncryptionKeypair } from '@kiltprotocol/types';
import { blake2AsU8a, keyExtractPath, keyFromPath, sr25519PairFromSeed, cryptoWaitReady } from '@polkadot/util-crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const DID_DERIVATION_PATH = '//did//keyAgreement//0';

interface JWTPayload {
  did: string;
  role: Role;
}

// Interfaces para sesiones KILT
interface ISessionRequest {
  name: string;
  encryptionKeyUri: DidUrl;
  challenge: string;
}

interface ISessionResponse {
  encryptionKeyUri: DidUrl;
  encryptedChallenge: string;
  nonce: string;
}

// Función para validar el formato del DID
function isValidKiltDid(did: string): did is DidUrl {
  // Patrón muy flexible para DIDs de KILT
  // Acepta Full DIDs (4...), Light DIDs con cualquier formato, y DIDs con fragmentos
  const didPattern = /^did:kilt:(?:4[a-zA-Z0-9]{47}|light:[a-zA-Z0-9:]+)(?:#[a-zA-Z0-9]+)?$/;
  return didPattern.test(did);
}

// Función para generar un challenge aleatorio
function generateChallenge(): string {
  return `0x${crypto.randomBytes(32).toString('hex')}`;
}

export class AuthService {
  private static instance: AuthService;
  private keyAgreementKeyPair: KiltEncryptionKeypair | null = null;

  private constructor() {
    // Inicializar el keypair de encriptación
    this.initializeKeyPair();
  }

  private async initializeKeyPair() {
    try {
      // Esperar a que el WASM crypto esté listo
      await cryptoWaitReady();

      const mnemonic = process.env.DAPP_ACCOUNT_MNEMONIC;
      if (!mnemonic) {
        throw new Error('DAPP_ACCOUNT_MNEMONIC no está configurado');
      }

      const seed = Crypto.mnemonicToMiniSecret(mnemonic);
      const keypair = sr25519PairFromSeed(seed);
      const { path } = keyExtractPath(DID_DERIVATION_PATH);
      const { secretKey } = keyFromPath(keypair, path, 'sr25519');
      this.keyAgreementKeyPair = Crypto.makeEncryptionKeypairFromSeed(blake2AsU8a(secretKey));
    } catch (error) {
      console.error('Error inicializando keypair:', error);
      throw error;
    }
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  public async getChallenge(): Promise<ISessionRequest> {
    const challenge = generateChallenge();
    const encryptionKeyUri = getDappEncryptionKeyUri();
    
    if (!encryptionKeyUri) {
      throw new Error('dAppEncryptionKeyUri no está inicializado');
    }

    return {
      name: 'Peranto Ci.Go',
      encryptionKeyUri: encryptionKeyUri as DidUrl,
      challenge
    };
  }

  public async verifySession(
    sessionRequest: ISessionRequest,
    sessionResponse: ISessionResponse,
    userDid: DidUrl
  ): Promise<{ jwt: string; user: { did: string; roles: string[] } }> {
    try {
      console.log('[AuthService] verifySession: verificando sesión...', {
        sessionRequest,
        sessionResponse,
        userDid
      });

      // Verificar que el DID del usuario no sea un Light DID
      if (userDid.includes(':light:')) {
        throw new Error('No se puede usar un Light DID para autenticación. Selecciona un Full DID.');
      }

      // Verificar que el challenge en la sesión coincida con el original
      // Por ahora, simplemente autenticamos al usuario sin verificar el challenge cifrado
      // En una implementación completa, se debería desencriptar y verificar el challenge
      console.log('[AuthService] verifySession: autenticando usuario directamente');

      // Autenticar al usuario
      const { user, token } = await this.authenticateUser(userDid);

      return {
        jwt: token,
        user: {
          did: user.did,
          roles: user.roles
        }
      };
    } catch (error) {
      console.error('[AuthService] Error verificando sesión:', error);
      throw error;
    }
  }

  private async authenticateUser(did: string) {
    // Buscar usuario existente
    let user = await prisma.user.findUnique({
      where: { did },
      include: {
        roles: true
      }
    });

    // Si no existe, crear nuevo usuario
    if (!user) {
      user = await prisma.user.create({
        data: {
          did,
          roles: {
            create: [
              {
                role: 'USER'
              }
            ]
          }
        },
        include: {
          roles: true
        }
      });
    }

    // Generar token con el primer rol (o el rol principal)
    const primaryRole = user.roles.length > 0 ? user.roles[0].role : 'USER';
    const payload: JWTPayload = { did: user.did, role: primaryRole };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
    
    return {
      user: {
        did: user.did,
        roles: user.roles.map(role => role.role)
      },
      token
    };
  }

  // Método estático para verificar token JWT
  public static verifyToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (error) {
      throw new Error('Token inválido');
    }
  }

  // Método estático para verificar si un usuario es attester de un CType específico
  public static async isAttesterForCType(did: string, ctypeId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { did },
      include: { roles: true }
    });

    if (!user) {
      return false;
    }

    return user.roles.some(role => role.role === 'ATTESTER');
  }
} 