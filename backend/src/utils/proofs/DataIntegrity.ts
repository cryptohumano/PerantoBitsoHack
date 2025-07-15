import { Did, DidDocument, DidUrl, SignerInterface } from '@kiltprotocol/types';
import { SDKErrors } from '@kiltprotocol/utils';
import { resolve, parse } from '@kiltprotocol/did';
import { u8aConcat } from '@polkadot/util';
import { base58Decode, base58Encode, sha256AsU8a } from '@polkadot/util-crypto';
import { cryptosuite } from '@kiltprotocol/sr25519-jcs-2023';
import { createVerifyData as createVerifyDataJcs, CryptoSuite } from '@kiltprotocol/jcs-data-integrity-proofs-common';

export const PROOF_TYPE = 'DataIntegrityProof';

// VCDM 2.0 core context
const VC_2_0_CONTEXT = 'https://www.w3.org/ns/credentials/v2';
const DATA_INTEGRITY_CONTEXT = 'https://w3id.org/security/data-integrity/v1';

// multibase base58-btc header
const MULTIBASE_BASE58BTC_HEADER = 'z';

function containsDefinitions(context: unknown): context is string {
  return context === VC_2_0_CONTEXT || context === DATA_INTEGRITY_CONTEXT;
}

export type DataIntegrityProof = {
  type: typeof PROOF_TYPE;
  verificationMethod: string;
  cryptosuite: string;
  proofPurpose: string;
  proofValue: string;
  created?: string;
  expires?: string;
  domain?: string;
  challenge?: string;
  previousProof?: string;
};

const KNOWN_JCS_SUITES = ['sr25519-jcs-2023'];

async function createVerifyData({
  proof,
  document,
  suite,
  options = {},
}: {
  proof: DataIntegrityProof;
  document: DocumentWithContext;
  suite: CryptoSuite<any>;
  options?: Record<string, unknown>;
}): Promise<Uint8Array> {
  if (suite.createVerifyData) {
    return suite.createVerifyData({ proof, document });
  }
  // jcs suites will not work with the default logic. Use createVerifyData from jcs common instead.
  if (KNOWN_JCS_SUITES.includes(suite.name)) {
    return createVerifyDataJcs({ document, proof });
  }
  const proofOpts = { ...proof };
  // @ts-expect-error property is non-optional but not part of canonized proof
  delete proofOpts.proofValue;
  const canonizedProof = await suite.canonize(
    {
      '@context': document['@context'],
      ...proofOpts,
    },
    options
  );
  const canonizedDoc = await suite.canonize(document, options);
  return u8aConcat(sha256AsU8a(canonizedProof), sha256AsU8a(canonizedDoc));
}

/**
 * Crea una prueba de integridad de datos para el documento proporcionado.
 * @param inputDocument El documento sin seguridad para el que se necesita crear la prueba.
 * @param suite La suite criptográfica a utilizar para crear la prueba.
 * @param signer La interfaz del firmante para firmar el documento.
 * @param opts Parámetros opcionales para la creación de la prueba.
 * @returns El documento original aumentado con la prueba generada.
 */
export async function createProof<T extends DocumentWithContext>(
  inputDocument: T,
  suite: CryptoSuite<any>,
  signer: SignerInterface,
  {
    proofPurpose = 'authentication',
    challenge,
    domain,
    created = new Date(),
    expires,
    id,
    previousProof,
  }: {
    id?: string;
    proofPurpose?: string;
    challenge?: string;
    domain?: string;
    created?: Date | null;
    expires?: Date;
    previousProof?: string;
  } = {}
): Promise<T & { proof: DataIntegrityProof }> {
  if (suite.requiredAlgorithm.toLowerCase() !== signer.algorithm.toLowerCase()) {
    throw new Error("El algoritmo del firmante no coincide con el algoritmo requerido por la suite");
  }

  const document = ensureContext(inputDocument);

  const proof = {
    ...(id ? { id } : undefined),
    type: PROOF_TYPE,
    verificationMethod: signer.id,
    cryptosuite: suite.name,
    proofPurpose,
  } as DataIntegrityProof;

  if (created) {
    proof.created = created.toISOString();
  }
  if (expires) {
    proof.expires = expires.toISOString();
  }
  if (challenge) {
    proof.challenge = challenge;
  }
  if (domain) {
    proof.domain = domain;
  }
  if (previousProof) {
    proof.previousProof = previousProof;
  }

  const verifyData = await createVerifyData({ proof, document, suite });
  const signatureBytes = await signer.sign({ data: verifyData });
  proof.proofValue = MULTIBASE_BASE58BTC_HEADER + base58Encode(signatureBytes);

  return { ...document, proof } as T & { proof: DataIntegrityProof };
}

export class UNSUPPORTED_CRYPTOSUITE_ERROR extends Error {
  override name = 'UNSUPPORTED_CRYPTOSUITE_ERROR';
}

export class INVALID_PROOF_PURPOSE_FOR_VERIFICATION_METHOD extends Error {
  override name = 'INVALID_PROOF_PURPOSE_FOR_VERIFICATION_METHOD';
  public readonly code = -25;
}

interface VerificationMethod {
  id: string;
  type: string;
  controller: string;
  publicKeyBase58: string;
}

interface DocumentWithContext {
  '@context': string | string[];
  [key: string]: unknown;
}

function ensureContext(document: DocumentWithContext): DocumentWithContext {
  if (!document['@context']) {
    const { '@context': _, ...rest } = document;
    return {
      '@context': [VC_2_0_CONTEXT, DATA_INTEGRITY_CONTEXT],
      ...rest,
    };
  }
  return document;
} 