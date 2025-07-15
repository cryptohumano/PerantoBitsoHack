import * as dotenv from 'dotenv';
import { resolveDappDidDocument } from '../utilities/didResolver';
import express = require('express');
import { DidUrl } from '@kiltprotocol/types';
import * as Kilt from '@kiltprotocol/sdk-js';
import { ApiPromise } from '@polkadot/api';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  kilt: {
    spiritnet: {
      wsEndpoint: process.env.SPIRITNET_ENDPOINT || 'wss://spiritnet.kilt.io',
      mnemonic: process.env.SPIRITNET_SECRET_PAYER_MNEMONIC,
      didUri: process.env.DAPP_DID_URI,
    },
    peregrine: {
      wsEndpoint: process.env.PEREGRINE_ENDPOINT || 'wss://peregrine.kilt.io',
      mnemonic: process.env.PEREGRINE_SECRET_PAYER_MNEMONIC,
      didUri: process.env.DAPP_DID_URI,
    },
    defaultNetwork: process.env.KILT_NETWORK || 'spiritnet',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000,http://192.168.100.102:3000',
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100 // límite de 100 peticiones por ventana
  }
};

// Debug: Mostrar la configuración de CORS al cargar
console.log('[CONFIG] CORS_ORIGIN from env:', process.env.CORS_ORIGIN);
console.log('[CONFIG] Final CORS origin config:', config.cors.origin);

const app = express();

let dappDidDocument: any;
export let dappEncryptionKeyUri: string | undefined;
let api: ApiPromise;

export async function initializeDappDid() {
  const network = config.kilt.defaultNetwork as 'spiritnet' | 'peregrine';
  const endpoint = config.kilt[network].wsEndpoint;

  console.log(`[Kilt-SDK] Initializing with network: ${network}, endpoint: ${endpoint}`);

  // Conecta el SDK de KILT y obtén la API
  const kiltApi = await Kilt.connect(endpoint);
  api = kiltApi as unknown as ApiPromise;

  // Resuelve el DID Document
  dappDidDocument = await resolveDappDidDocument(api);

  console.log('DID Document resuelto:', JSON.stringify(dappDidDocument, null, 2));

  // Busca la key de tipo 'encryption'
  const encryptionKey = dappDidDocument.keyAgreement?.[0];
  if (!encryptionKey) throw new Error('No se encontró encryptionKey en el DID Document de la dApp');
  dappEncryptionKeyUri = typeof encryptionKey === 'string' ? encryptionKey : encryptionKey.id;

  console.log('encryptionKey:', encryptionKey);

  app.locals.api = api;
  app.locals.dappDidDocument = dappDidDocument;
}

export function getDappEncryptionKeyUri() {
  return dappEncryptionKeyUri;
}

// Exportamos la app para que pueda ser usada en server.ts
export { app }; 