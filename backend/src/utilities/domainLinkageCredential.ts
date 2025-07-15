import { cryptoWaitReady } from '@polkadot/util-crypto';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { Keyring } from '@polkadot/keyring';
import { mnemonicToMiniSecret, encodeAddress } from '@polkadot/util-crypto';
import { CType } from '@kiltprotocol/credentials';
import { Attestation, Credential, Claim } from '@kiltprotocol/legacy-credentials';
import type { DidUrl, SignerInterface, ICredential } from '@kiltprotocol/types';
import { connect } from '@kiltprotocol/chain-helpers';
import { resolveDappDidDocument } from './didResolver';
import * as Did from '@kiltprotocol/did';
import { Blockchain } from '@kiltprotocol/chain-helpers';
import { u8aToHex, stringToU8a, hexToU8a } from '@polkadot/util';
import * as validUrl from 'valid-url';
import { Crypto } from '@kiltprotocol/utils';
import type { KeyringPair } from '@polkadot/keyring/types';
import { domainLinkageCType } from '../types/domainLinkageCType';

const DEFAULT_VERIFIABLECREDENTIAL_TYPE = 'VerifiableCredential';
const KILT_SELF_SIGNED_PROOF_TYPE = 'KILTSelfSigned2020';
const KILT_VERIFIABLECREDENTIAL_TYPE = 'KiltCredential2020';
const DOMAIN_LINKAGE_CREDENTIAL_TYPE = 'DomainLinkageCredential';
const DID_CONFIGURATION_CONTEXT = 'https://identity.foundation/.well-known/did-configuration/v1';
const DEFAULT_VERIFIABLECREDENTIAL_CONTEXT = 'https://www.w3.org/2018/credentials/v1';

// Definición oficial del CType de Domain Linkage (KILT)
const OFFICIAL_DOMAIN_LINKAGE_CTYPE = {
  $schema: 'http://kilt-protocol.org/draft-01/ctype#',
  title: 'Domain Linkage Credential',
  properties: {
    id: { type: 'string' },
    origin: { type: 'string' }
  },
  type: 'object',
};

const EXPECTED_CTYPE_URI = 'kilt:ctype:0x9d271c790775ee831352291f01c5d04c7979713a5896dcf5e81708184cc5c643';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export async function generateAndSaveDidConfiguration() {
  await cryptoWaitReady();

  const didUri = process.env.DAPP_DID_URI as string;
  const domain = process.env.DAPP_DOMAIN as string;
  const mnemonic = process.env.DAPP_ACCOUNT_MNEMONIC as string;

  if (!didUri || !domain || !mnemonic) {
    throw new Error('Faltan variables de entorno: DAPP_DID_URI, DAPP_DOMAIN, DAPP_ACCOUNT_MNEMONIC');
  }

  // Definir múltiples dominios para desarrollo
  const domains = [
    domain, // El dominio principal desde las variables de entorno
    'http://localhost:3000', // Localhost para desarrollo local
    'http://192.168.100.102:3000' // IP local para acceso desde otros dispositivos
  ];

  console.log('🌐 Generando credenciales para los siguientes dominios:', domains);

  // Validar URLs
  for (const d of domains) {
    if (!validUrl.isUri(d)) {
      throw new Error(`El dominio ${d} no es una URL válida`);
    }
  }

  // 1. Conectar a la red y resolver el DID Document
  const api = await connect('wss://peregrine.kilt.io');
  console.log('Verificando DID en la blockchain:', didUri);
  const didDocument = await resolveDappDidDocument(api);
  if (!didDocument) {
    throw new Error(`El DID ${didUri} no está registrado en la blockchain.`);
  }
  console.log('DID encontrado:', didDocument.id);

  // 2. Obtener la clave de autenticación
  const authKeyId = didDocument.authentication?.[0];
  if (!authKeyId) throw new Error('No se encontró authentication key en el DID Document');

  // 3. Derivar claves correctamente
  const keyring = new Keyring({ type: 'sr25519' });
  const seed = mnemonicToMiniSecret(mnemonic);
  const baseKey = keyring.addFromSeed(seed);
  
  // Derivar la clave de assertion method para firmar (//did//assertion//0)
  const assertionMethodKey = baseKey.derive('//did//assertion//0');
  console.log('Assertion method key:', encodeAddress(assertionMethodKey.publicKey, 38));
  
  // Derivar la clave de submitter (KILT address que comienza con 4)
  const submitterKey = baseKey.derive('');
  console.log('Submitter key (KILT address):', encodeAddress(submitterKey.publicKey, 38));

  // 4. Obtener el CType oficial desde la blockchain
  console.log('🔍 Obteniendo CType oficial desde la blockchain...');
  const { cType: domainLinkageCType } = await CType.fetchFromChain(
    'kilt:ctype:0xb08800a574c436831a2b9fce00fd16e9df489b2b3695e88a0895d148eca0311e'
  );
  
  console.log('✅ CType obtenido desde la blockchain:', domainLinkageCType.$id);

  // Verificar que el hash es el oficial
  const EXPECTED_CTYPE_URI_OFFICIAL = 'kilt:ctype:0xb08800a574c436831a2b9fce00fd16e9df489b2b3695e88a0895d148eca0311e';
  if (domainLinkageCType.$id !== EXPECTED_CTYPE_URI_OFFICIAL) {
    console.error('❌ El CType obtenido de la blockchain no es el esperado.');
    throw new Error('El CType de Domain Linkage no es el oficial de la blockchain.');
  }

  // 5. Generar una credencial y atestación por dominio
  const linkedDids = [];
  const now = new Date();

  for (const currentDomain of domains) {
    console.log(`🔐 Generando credencial para dominio: ${currentDomain}`);
    const claimContents = { 
      origin: currentDomain, // string
      id: didUri 
    };

    const claim = Claim.fromCTypeAndClaimContents(
      domainLinkageCType,
      claimContents,
      didUri as DidUrl
    );

    const credential = Credential.fromClaim(claim);

    // Crear la presentación de la credencial
    const authSigner: SignerInterface = {
      sign: async ({ data }: { data: Uint8Array }) => assertionMethodKey.sign(data),
      algorithm: 'Sr25519',
      id: authKeyId
    };

    const presentation = await Credential.createPresentation({
      credential: credential,
      signers: [authSigner]
    });

    // Auto-attestación de la credencial
    await selfAttestCredential(credential, assertionMethodKey, submitterKey, api);

    // Construir el archivo de configuración usando la presentación
    const credentialSubject = {
      ...presentation.claim.contents,
      rootHash: presentation.rootHash
    };

    // Obtener el issuer desde la attestación en la blockchain
    const encodedAttestationDetails = await api.query.attestation.attestations(
      presentation.rootHash
    );
    const issuer = Attestation.fromChain(
      encodedAttestationDetails,
      presentation.claim.cTypeHash
    ).owner;

    // Verificar que tenemos la firma del claimer
    const claimerSignature = presentation.claimerSignature;
    if (!claimerSignature) {
      throw new Error('Claimer signature is required.');
    }

    // Construir la prueba según el estándar
    const proof = {
      type: 'KILTSelfSigned2020',
      proofPurpose: 'assertionMethod',
      verificationMethod: claimerSignature.keyUri,
      signature: claimerSignature.signature,
      challenge: claimerSignature.challenge
    };

    // Agregar la credencial a la lista
    linkedDids.push({
      '@context': [DEFAULT_VERIFIABLECREDENTIAL_CONTEXT, DID_CONFIGURATION_CONTEXT],
      issuer,
      issuanceDate: now.toISOString(),
      expirationDate: new Date(now.getTime() + 5 * 365 * 24 * 60 * 60 * 1000).toISOString(),
      type: [
        DEFAULT_VERIFIABLECREDENTIAL_TYPE,
        DOMAIN_LINKAGE_CREDENTIAL_TYPE,
        KILT_VERIFIABLECREDENTIAL_TYPE
      ],
      credentialSubject,
      proof
    });
    console.log(`✅ Credencial generada para: ${currentDomain}`);
  }

  // 6. Construir el archivo de configuración completo
  const wellKnownDidconfig = {
    '@context': DID_CONFIGURATION_CONTEXT,
    linked_dids: linkedDids
  };

  // 7. Guardar el archivo en la ruta absoluta del frontend
  const outputDir = path.resolve(__dirname, '../../../frontend/public/.well-known');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(
    path.join(outputDir, 'did-configuration.json'),
    JSON.stringify(wellKnownDidconfig, null, 2)
  );
  console.log('✅ Archivo did-configuration.json generado y firmado en:', outputDir);
  console.log(`📋 Incluye credenciales para los dominios:`, domains);

  // 8. Cerrar la conexión a la blockchain y terminar el proceso
  try {
    await api.disconnect();
    console.log('✅ Conexión a la blockchain cerrada');
  } catch (error) {
    console.log('ℹ️ La conexión ya estaba cerrada');
  }
}

/**
 * Auto-attesta una credencial en la blockchain
 */
async function selfAttestCredential(
  credential: ICredential,
  assertionMethodKey: KeyringPair,
  submitterKey: KeyringPair,
  api: any
) {
  try {
    // 1. Calcular el hash del claim
    console.log('🔍 Calculando hash del claim...');
    const { cTypeHash, claimHash } = Attestation.fromCredentialAndDid(
      credential,
      credential.claim.owner
    );
    console.log('✅ Hash del claim calculado:', claimHash);
    console.log('✅ Hash del CType:', cTypeHash);

    // 2. Crear la transacción de attestación
    console.log('📝 Creando transacción de attestación...');
    const attestationTx = api.tx.attestation.add(claimHash, cTypeHash, null);
    console.log('✅ Transacción creada');

    // 3. Autorizar la transacción con el DID de la dApp
    console.log('🔏 Preparando autorización de la transacción...');
    console.log('DID owner:', credential.claim.owner);
    console.log('Assertion key address:', assertionMethodKey.address);
    console.log('Submitter key address:', submitterKey.address);

    // Obtener el assertion method del DID Document
    const didResolution = await Did.resolve(credential.claim.owner);
    if (!didResolution.didDocument) {
      throw new Error('No se pudo resolver el DID Document');
    }

    const assertionKeyId = didResolution.didDocument.assertionMethod?.[0];
    if (!assertionKeyId) throw new Error('No se encontró assertion method en el DID Document');

    console.log('Assertion method encontrado:', assertionKeyId);

    const signers: SignerInterface[] = [{
      sign: async ({ data }: { data: Uint8Array }) => {
        console.log('📝 Firmando datos:', u8aToHex(data));
        const signature = assertionMethodKey.sign(data);
        console.log('✅ Firma generada:', u8aToHex(signature));
        return signature;
      },
      algorithm: 'Sr25519',
      id: assertionKeyId
    }];

    let submitTx;
    try {
      console.log('🔐 Autorizando transacción...');
      submitTx = await Did.authorizeTx(
        credential.claim.owner,
        attestationTx,
        signers,
        submitterKey.address as `4${string}`
      );
      console.log('✅ Transacción autorizada');
    } catch (error) {
      console.error('❌ Error al autorizar la transacción:', error);
      throw new Error('No se pudo firmar la auto-attestación de la credencial');
    }

    // 4. Pagar y enviar la transacción
    try {
      console.log('💰 Enviando transacción a la blockchain...');
      const result = await Blockchain.signAndSubmitTx(submitTx, submitterKey, {
        tip: 0
      });
      if (result?.isError) {
        console.error('❌ Error en la transacción:', result);
        throw new Error('La attestación falló');
      }
      console.log('✅ Attestación exitosa');
    } catch (error) {
      console.error('❌ Error al enviar la transacción:', error);
      throw new Error(
        'No se pudo firmar y enviar la transacción: ' +
          JSON.stringify(error, null, 2) +
          '\n' +
          'Asegúrate de que las claves guardadas en la blockchain coincidan con las derivadas de tu mnemónico en este proyecto.'
      );
    }
  } catch (error) {
    console.error('❌ Error en selfAttestCredential:', error);
    throw error;
  }
} 