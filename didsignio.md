# DIDsign.io - Análisis Técnico Completo

## Descripción General

DIDsign.io es una aplicación web descentralizada desarrollada por la KILT Foundation que permite firmar y verificar documentos digitales usando DIDs (Identificadores Descentralizados) de la blockchain KILT. Proporciona una alternativa descentralizada a los sistemas de firma digital tradicionales.

**Repositorio**: https://github.com/KILT-Foundation/didsign.io.git  
**Sitio Web**: https://didsign.io/

## Arquitectura del Proyecto

### Stack Tecnológico

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Parcel
- **Routing**: React Router DOM
- **UI Components**: Radix UI + CSS Modules
- **Blockchain SDK**: @kiltprotocol/sdk-js v0.36.0-rc.3
- **Wallet Integration**: @polkadot/extension-dapp v0.58.10

### Estructura de Directorios

```
src/
├── app/                    # Páginas principales (Next.js App Router)
├── components/            # Componentes React reutilizables
├── hooks/                 # Custom hooks
├── utils/                 # Utilidades y helpers
├── views/                 # Vistas principales
└── types.d.ts            # Tipos globales
```

## Componentes Principales

### 1. Vistas Principales

#### Sign (`src/views/Sign/Sign.tsx`)
- Interfaz para firmar documentos
- Drag & drop de archivos
- Integración con wallets
- Generación de archivos .didsign

#### Verify (`src/views/Verify/Verify.tsx`)
- Interfaz para verificar documentos firmados
- Validación de firmas y credenciales
- Visualización de información del DID

### 2. Componentes Clave

#### Componentes de Firma
- **`SignButton`** (`src/components/SignButton/SignButton.tsx`): Maneja la interacción con wallets
- **`Files`** (`src/components/Files/Files.tsx`): Gestión de archivos subidos
- **`SignedFiles`** (`src/components/SignedFiles/SignedFiles.tsx`): Muestra archivos firmados
- **`DownloadButtons`** (`src/components/DownloadButtons/DownloadButtons.tsx`): Descarga de archivos

#### Componentes de Verificación
- **`VerifiedFiles`** (`src/components/VerifiedFiles/VerifiedFiles.tsx`): Muestra archivos verificados
- **`DidDocument`** (`src/components/DidDocument/DidDocument.tsx`): Información del DID del firmante
- **`Credential`** (`src/components/Credential/Credential.tsx`): Verifica credenciales KILT
- **`JWSErrors`** (`src/components/JWSErrors/JWSErrors.tsx`): Manejo de errores

#### Componentes de Timestamping
- **`Timestamp`** (`src/components/Timestamp/Timestamp.tsx`): Funcionalidad de timestamping en blockchain

## Flujo de Interacción con Wallets

### Fase 1: Firma con DID

#### Archivos Involucrados
- `src/components/SignButton/SignButton.tsx` - Manejo principal de la firma
- `src/utils/sign-helpers.ts` - Generación de hashes y JWS
- `src/utils/types.ts` - Definición de interfaces

#### Interfaz Principal
```typescript
// src/utils/types.ts
export type SignWithDid = (plaintext: string) => Promise<{
  signature: string;
  didKeyUri: DidResourceUri;
  credentials?: { name: string; credential: ICredential }[];
}>;
```

#### Proceso Detallado

1. **Detección de Wallet**
```typescript
// src/components/SignButton/SignButton.tsx:85-99
const capableWallets = [...Object.entries(window.kilt)]
  .filter(([key]) => window.kilt[key].signWithDid)
  .map(([key, { name = key, signWithDid }]) => ({
    key,
    name,
    handleClick: () => handleSign(signWithDid),
  }));
```

2. **Preparación de Datos**
```typescript
// src/components/SignButton/SignButton.tsx:40-45
const hashes = files.map(({ hash }) => hash);
const signingData = await createHashFromHashArray(hashes);
```

3. **Llamada a Sporran**
```typescript
// src/components/SignButton/SignButton.tsx:47-51
const {
  credentials = undefined,
  didKeyUri,
  signature,
} = await signWithDid(signingData);
```

**Datos Enviados a Sporran:**
- `signingData`: Hash SHA-256 combinado de todos los archivos
- Formato: String hexadecimal (ej: `"f1a2b3c4..."`)

**Datos Devueltos por Sporran:**
- `signature`: Firma criptográfica Sr25519
- `didKeyUri`: URI del DID usado (ej: `"did:kilt:4tPqLquicoSmq9LP95DVZ4REv7NGW85NzSWSktg3AVoY17fN#authentication"`)
- `credentials`: Credenciales KILT opcionales

4. **Generación del JWS**
```typescript
// src/utils/sign-helpers.ts:38-50
export function generateJWS(
  { didKeyUri, signature }: { signature: string; didKeyUri: string },
  hash: string,
): string {
  const headers = JSON.stringify({
    alg: 'Sr25519',
    typ: 'JWS',
    kid: didKeyUri,
  });
  const payload = JSON.stringify({
    hash,
  });
  return `${encode(headers)}.${encode(payload)}.${encode(signature)}`;
}
```

### Fase 2: Timestamping (Pago)

#### Archivos Involucrados
- `src/components/Timestamp/Timestamp.tsx` - Manejo del timestamping
- `src/utils/timestamp.ts` - Funciones de blockchain
- `@polkadot/extension-dapp` - Interacción con wallets

#### Interfaces de Polkadot Extension
```typescript
// src/utils/timestamp.ts:1-2
import { web3Accounts, web3Enable } from '@polkadot/extension-dapp';

// src/components/Timestamp/Timestamp.tsx:15
import { web3FromSource } from '@polkadot/extension-dapp';
```

#### Proceso Detallado

1. **Obtención de Cuentas**
```typescript
// src/utils/timestamp.ts:8-32
export async function getKiltAccountsWithEnoughBalance() {
  const api = await apiPromise;
  const genesisHash = api.genesisHash.toHex();

  await web3Enable('DIDsign by KILT Foundation');
  const allAccounts = await web3Accounts();

  const kiltAccounts = allAccounts.filter(
    (account) =>
      !account.meta.genesisHash || account.meta.genesisHash === genesisHash,
  );

  // Verificar balance suficiente para fee
  const enoughBalanceAccounts = [];
  const timeStampingFee = await getFee();

  for (const account of kiltAccounts) {
    const balance = await api.query.system.account(account.address);
    if (balance.data.free.gte(timeStampingFee)) {
      enoughBalanceAccounts.push(account);
    }
  }

  return enoughBalanceAccounts.map(({ address, meta: { source, name } }) => {
    return { address, source, name };
  });
}
```

2. **Creación de Transacción**
```typescript
// src/utils/timestamp.ts:34-37
export async function getExtrinsic(signature: string) {
  const api = await apiPromise;
  return api.tx.system.remark(signature);
}
```

3. **Firma de Transacción**
```typescript
// src/components/Timestamp/Timestamp.tsx:160-165
const api = await apiPromise;
const extrinsic = await getExtrinsic(signature);
const { signer } = await web3FromSource(selectedAccount.source);

await extrinsic.signAndSend(
  selectedAccount.address,
  { signer },
  ({ status, dispatchError }) => {
    // Callback para manejar el estado de la transacción
  },
);
```

**Datos Enviados a Sporran para el Pago:**
- **Transacción**: `system.remark(signature)`
- **Datos del Modal:**
  ```
  from: localhost:1234
  version: 11504
  nonce: 176
  method data: system.remark(remark)
  {
    "remark": "0xb0a3373978f151ece371d68c7a1098b714244326652e60a9845959af88c71b3d0dc5fa0e27ffe10ac102f7e86ac2e98319b8b2c733434eb65f97c497a6092f8e"
  }
  ```

### Fase 3: Verificación

#### Archivos Involucrados
- `src/utils/verify-helper.ts` - Verificación principal
- `src/components/DidDocument/DidDocument.tsx` - Visualización de resultados
- `@kiltprotocol/sdk-js` - SDK de KILT para verificación

#### Proceso Detallado

1. **Verificación de Firma**
```typescript
// src/utils/verify-helper.ts:58-65
await Did.verifyDidSignature({
  message,
  keyUri,
  signature: Utils.Crypto.coToUInt8(signature),
  expectedVerificationMethod: 'authentication',
});
```

2. **Verificación de Timestamp**
```typescript
// src/utils/timestamp.ts:62-72
export async function getSignatureFromRemark(remark: IRemark) {
  const api = await apiPromise;
  const { txHash, blockHash } = remark;
  const signedBlock = await api.rpc.chain.getBlock(blockHash);
  const extrinsicWithRemark = signedBlock.block.extrinsics.find(
    ({ hash }) => hash.toHex() === txHash,
  );
  return extrinsicWithRemark?.method.args.toString();
}
```

## Estructura de Datos

### Tipos Principales

```typescript
// src/utils/types.ts
interface SignDoc {
  jws: string;           // JWT con firma
  hashes: string[];      // Hashes de archivos
  remark?: IRemark;      // Info de timestamping
  credentials?: NamedCredential[]; // Credenciales adjuntas
}

interface Signature {
  credentials?: NamedCredential[];
  signature?: string;
  downloaded?: boolean;
  timestamped?: boolean;
}

interface IRemark {
  txHash: string;
  blockHash: string;
}

export type SignWithDid = (plaintext: string) => Promise<{
  signature: string;
  didKeyUri: DidResourceUri;
  credentials?: { name: string; credential: ICredential }[];
}>;
```

### Archivo .DIDSIGN

El archivo `signature.didsign` contiene:
```json
{
  "jws": "eyJhbGciOiJTcjI1NTE5IiwidHlwIjoiSlNTIiwia2lkIjoiZGlkOmtpbHQ6NHRQcUxxdWljb1NtcTlMUDk1RFZaNFJFdjdOR1c4NU56U1dTa3RnM0FWb1kxN2ZOfmRpZDpraWx0OjR0UHFMcXVpY29TbXE5TFA5NURWWjRSRXY3TkdXODVOelNXVGt0ZzNBVm9ZMTdmTiNhdXRoZW50aWNhdGlvbiJ9.eyJoYXNoIjoiZjFhMmIzYzQifQ.0xb0a3373978f151ece371d68c7a1098b714244326652e60a9845959af88c71b3d0dc5fa0e27ffe10ac102f7e86ac2e98319b8b2c733434eb65f97c497a6092f8e",
  "hashes": ["f1a2b3c4..."],
  "remark": {
    "txHash": "0x...",
    "blockHash": "0x..."
  },
  "credentials": [
    {
      "name": "IdentidadDigital-ServiciosLegales",
      "credential": { /* credencial KILT */ }
    }
  ]
}
```

## Interacciones con Blockchain

### Conexión a KILT
```typescript
// src/utils/api.ts
export const apiPromise = connect(
  process.env.REACT_APP_CHAIN_ENDPOINT || 'wss://spiritnet.kilt.io',
);
```

### Gestión de Wallets
- **Detección automática**: La app detecta wallets compatibles con KILT
- **Sporran**: Wallet recomendado (extensión de Chrome/Firefox)
- **Cualquier wallet**: Que soporte signing con DIDs en KILT

### Funcionalidades Avanzadas
- **Múltiples archivos**: Firma de varios archivos simultáneamente
- **Credenciales KILT**: Inclusión de credenciales verificables
- **Service Endpoints**: Verificación de endpoints del DID
- **Web3Names**: Soporte para nombres web3
- **ZIP support**: Manejo de archivos comprimidos

## Seguridad

### Algoritmos Criptográficos
- **Firma**: Sr25519 (Polkadot/KILT)
- **Hash**: SHA-256 para integridad de archivos
- **Formato**: JWS (JSON Web Signatures)
- **Verificación**: On-chain para DIDs

### Validaciones
- Verificación de hashes de archivos
- Validación de firmas criptográficas
- Verificación de credenciales KILT
- Validación de timestamps en blockchain

## Flujo de Trabajo Completo

### Para Firmar
1. Usuario arrastra archivos a la interfaz
2. Se calculan hashes SHA-256 de los archivos
3. Se detecta wallet disponible (Sporran)
4. Usuario selecciona identidad DID en Sporran
5. Se firma el hash combinado con la clave del DID
6. Se genera archivo .didsign con JWS
7. Opcional: Timestamping en blockchain (requiere pago)

### Para Verificar
1. Usuario sube archivo .didsign + archivos originales
2. Se verifica la firma del DID on-chain
3. Se valida contra hashes de archivos
4. Se muestran credenciales adjuntas
5. Se verifica timestamp si existe
6. Se muestra información del DID y service endpoints

## Interfaces por Operación

| **Operación** | **Archivo Principal** | **Interfaz Wallet** | **Datos Enviados** |
|---------------|----------------------|-------------------|-------------------|
| **Firma DID** | `SignButton.tsx` | `window.kilt[].signWithDid` | Hash de archivos |
| **Pago/Timestamp** | `Timestamp.tsx` | `web3FromSource()` | Transacción `system.remark` |
| **Verificación** | `verify-helper.ts` | `Did.verifyDidSignature()` | JWS + datos blockchain |

## Consideraciones de Versionado

### SDK Actual
- **Versión**: @kiltprotocol/sdk-js v0.36.0-rc.3
- **Estado**: Release Candidate

### Cambios Futuros
- **Métodos obsoletos**: Algunos métodos como `Did.verifyDidSignature` pueden cambiar
- **Nuevas interfaces**: Posibles cambios en `SignWithDid` y otras interfaces
- **Mejoras de seguridad**: Nuevos algoritmos o formatos de firma

## Integración Blockchain

### KILT Protocol
- **Red Principal**: Spiritnet (`wss://spiritnet.kilt.io`)
- **Red de Pruebas**: Peregrine (`wss://peregrine.kilt.io`)
- **Explorador**: Subscan para transacciones

### Polkadot Extension
- **Detección**: Automática de wallets compatibles
- **Autorización**: `web3Enable()` para permisos
- **Cuentas**: `web3Accounts()` para listar cuentas
- **Firma**: `web3FromSource()` para transacciones

## Características Técnicas

### Algoritmos de Hash
```typescript
// src/utils/sign-helpers.ts:15-23
export const sha56 = hasher.from({
  name: 'sha2-256',
  code: 0x12,
  encode: sha256AsU8a,
});

export async function createHash(blob: ArrayBuffer | null): Promise<string> {
  if (!blob) throw new Error('No File given');
  const blobAsU8a = new Uint8Array(blob);
  const hash = await sha56.digest(blobAsU8a);
  return base16.encode(hash.bytes);
}
```

### Generación de Hash Combinado
```typescript
// src/utils/sign-helpers.ts:25-32
export async function createHashFromHashArray(
  hashArray: string[],
): Promise<string> {
  if (hashArray.length === 1) {
    return hashArray[0];
  }
  const sortedHash = [...hashArray].sort();
  const asJson = json.encode(sortedHash);
  return createHash(asJson);
}
```

## Manejo de Errores

### Tipos de Error
- **'Not authorized'**: Usuario no autorizó la operación
- **'Rejected'**: Usuario rechazó la firma
- **'User closed'**: Usuario cerró el popup del wallet
- **'Corrupted'**: Archivo .didsign corrupto
- **'Invalid'**: Firma inválida
- **'Multiple Sign'**: Múltiples archivos .didsign detectados

### Manejo de Excepciones
```typescript
// src/utils/exceptionToError.ts
export function exceptionToError(exception: unknown): Error {
  if (exception instanceof Error) {
    return exception;
  }
  return new Error(String(exception));
}
```

## Conclusión

DIDsign.io representa una implementación completa de firma digital descentralizada usando la tecnología DID de KILT. El proyecto demuestra:

1. **Interoperabilidad**: Compatible con múltiples wallets
2. **Seguridad**: Firma criptográfica robusta con Sr25519
3. **Verificabilidad**: Validación on-chain de DIDs y credenciales
4. **Timestamping**: Opcional con transacciones blockchain
5. **Usabilidad**: Interfaz intuitiva para usuarios finales

El flujo técnico garantiza que cada operación use la interfaz correcta del wallet y mantenga la seguridad criptográfica en todo el proceso, proporcionando una alternativa descentralizada y confiable a los sistemas de firma digital tradicionales. 