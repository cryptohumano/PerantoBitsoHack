import type { DidUrl, DidDocument, SignerInterface, VerificationMethod } from '@kiltprotocol/types';

export interface KiltMeta {
    versions: {
      credentials: string;
    };
}

// Tipo para las extensiones inyectadas
export interface InjectedWindowProvider {
  startSession: (
    dAppName: string,
    dAppEncryptionKeyUri: DidUrl,
    challenge: string
  ) => Promise<PubSubSession>;
  getDidList: () => Promise<(string | { did: string })[]>;
  getSignedDidCreationExtrinsic: (did: string, extrinsic: unknown) => Promise<unknown>;
  signExtrinsicWithDid: (did: string, extrinsic: unknown, signer: unknown) => Promise<unknown>;
  signWithDid: (did: string, message: string) => Promise<unknown>;
  name: string;
  version: string;
  specVersion: string;
}

// Tipo para el objeto global kilt
export interface GlobalKilt {
  [key: string]: unknown;
  meta: KiltMeta;
}

export interface PubSubSession {
  listen: (callback: (message: IEncryptedMessage) => Promise<void>) => Promise<void>;
  close: () => Promise<void>;
  send: (message: IEncryptedMessage) => Promise<void>;
  encryptionKeyUri: DidUrl;
  encryptedChallenge: string;
  nonce: string;
}

// Interfaces oficiales de KILT para sesiones
export interface ISessionRequest {
  name: string;
  encryptionKeyUri: DidUrl;
  challenge: string;
}

export interface ISessionResponse {
  encryptionKeyUri: DidUrl;
  encryptedChallenge: string;
  nonce: string;
}

export interface ISession {
  encryptCallback: EncryptCallback;
  decryptCallback: DecryptCallback;
  authenticationSigner: SignerInterface;
  receiverEncryptionKeyUri: DidUrl;
  senderEncryptionKeyUri: DidUrl;
}

// Interfaces para callbacks de encriptación/desencriptación
export interface EncryptCallback {
  (params: {
    did: string;
    data: Uint8Array;
    peerPublicKey: Uint8Array;
  }): Promise<{
    data: string;
    nonce: string;
  }>;
}

export interface DecryptCallback {
  (params: {
    data: string;
    nonce: string;
    peerPublicKey: Uint8Array;
    keyUri: DidUrl;
  }): Promise<{
    data: Uint8Array;
  }>;
}

// Interfaces para mensajes cifrados
export interface IEncryptedMessage {
  receiverKeyUri: DidUrl;
  senderKeyUri: DidUrl;
  ciphertext: string;
  nonce: string;
}

export interface IEncryptedMessageV1 {
  receiverKeyId: DidUrl;
  senderKeyId: DidUrl;
  ciphertext: string;
  nonce: string;
}

declare global {
  interface Window {
    kilt?: GlobalKilt;
  }
}
