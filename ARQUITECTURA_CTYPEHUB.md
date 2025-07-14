# Arquitectura y Flujo de CTypeHub

## Índice
- [Resumen General](#resumen-general)
- [Conexiones Principales](#conexiones-principales)
- [Manejo de Firmas y Autenticación](#manejo-de-firmas-y-autenticación)
- [Flujo de Creación de CType](#flujo-de-creación-de-ctype)
- [Sistema de Sesiones y Encriptación](#sistema-de-sesiones-y-encriptación)
- [Sincronización con Indexer](#sincronización-con-indexer)
- [Seguridad y Validaciones](#seguridad-y-validaciones)
- [Variables de Entorno Clave](#variables-de-entorno-clave)
- [Manejo de Schemas de Propiedades](#manejo-de-schemas-de-propiedades)
- [Selección de Cuentas y DIDs](#selección-de-cuentas-y-dids)
- [Proceso de Firma Detallado](#proceso-de-firma-detallado)

---

## Resumen General
CTypeHub es una aplicación web full-stack para crear y gestionar CTypes (Claim Types) en la blockchain de KILT. Utiliza:
- **Frontend:** Astro + React
- **Backend:** Astro API endpoints
- **Base de datos:** PostgreSQL (Sequelize ORM)
- **Blockchain:** KILT Protocol
- **Indexer:** Sincronización con GraphQL

## Conexiones Principales

### 1. Frontend ↔ Backend
- **Rutas:** `/create`, `/ctype/[id]`, `/moderation/*`
- **API endpoints:** `/ctype` (POST), `/session`, `/moderation/verify`
- **Middleware:** Inicialización automática en cada request

### 2. Backend ↔ Blockchain
- **SDK:** `@kiltprotocol/sdk-js`
- **Endpoint:** `BLOCKCHAIN_ENDPOINT` (variable de entorno)
- **Transacciones:** Creación de CTypes, autorización con DIDs

### 3. Backend ↔ Base de Datos
- **ORM:** Sequelize
- **Modelos:** `CType`, `Tag`
- **Migraciones:** Versionado de esquemas

### 4. Backend ↔ Indexer
- **GraphQL:** Consultas al indexador de KILT
- **Sincronización:** Cada 10 minutos
- **Datos:** CTypes, attestations, bloques

---

## Manejo de Firmas y Autenticación

### Interfaz de Signers (Wallets)
```typescript
declare global {
  interface Window {
    kilt: Record<string, {
      name: string;
      signExtrinsicWithDid: (
        extrinsic: string,
        signer: KiltAddress,
      ) => Promise<{ signed: string; didKeyUri: DidResourceUri }>;
    }>;
  }
}
```

### Proceso de Creación de CType
1. **Detección de extensiones:**
   - Se buscan extensiones en `window.kilt` que implementen `signExtrinsicWithDid`.
2. **Selección de cuenta:**
   - Se usa Polkadot.js Extension para seleccionar la cuenta de pago.
3. **Creación y firma:**
   - Se construye la transacción y se firma usando la wallet seleccionada.

### Parámetros que se pasan a la wallet
- **Extrinsic:** Transacción serializada en hexadecimal (`createTx.toHex()`)
- **Signer Address:** Dirección de la cuenta seleccionada
- **DID Key URI:** Identificador del DID y clave de firma (`didKeyUri`)

---

## Flujo de Creación de CType

1. Usuario accede a `/create`.
2. Se detectan extensiones de wallet disponibles.
3. Usuario selecciona cuenta de pago.
4. Usuario llena el formulario (título, descripción, propiedades).
5. Se crea el CType con `CType.fromProperties()`.
6. Se verifica que no exista en la blockchain.
7. Se construye la transacción `api.tx.ctype.add()`.
8. Se firma con DID usando `signExtrinsicWithDid()`.
9. Se envía la transacción firmada a la blockchain.
10. Se guarda en la base de datos local.
11. Se redirige al usuario a la página del CType creado.

---

## Sistema de Sesiones y Encriptación

### Flujo de Autenticación
1. **Inicio de sesión:**
   - El backend genera un challenge y lo asocia a una sesión.
2. **Confirmación de DID:**
   - El usuario firma el challenge y lo devuelve cifrado.
   - El backend lo descifra y valida la firma.

### Encriptación Asimétrica
- Se usa la clave de acuerdo (`keyAgreementKey`) para cifrar/desencriptar mensajes entre dApp y wallet.

---

## Sincronización con Indexer
- Cada 10 minutos, el backend consulta el indexador GraphQL de KILT para nuevos CTypes y actualizaciones de attestations.
- Los datos se almacenan/actualizan en la base de datos local.

---

## Seguridad y Validaciones
- **Validación de DIDs:** Formato y resolución en blockchain
- **Firmas criptográficas:** Assertion method para autorización
- **Encriptación:** Comunicación segura con wallets
- **Sesiones:** Challenges únicos por sesión
- **Validación de CTypes:** Esquema y unicidad

---

## Variables de Entorno Clave
- `BLOCKCHAIN_ENDPOINT`: URL del nodo KILT
- `DID`: DID de la dApp
- `SECRET_AUTHENTICATION_MNEMONIC`: Mnemonic para autenticación
- `SECRET_ASSERTION_METHOD_MNEMONIC`: Mnemonic para assertion method
- `SECRET_KEY_AGREEMENT_MNEMONIC`: Mnemonic para encriptación
- `SECRET_PAYER_MNEMONIC`: Mnemonic para cuenta de pago
- `DATABASE_URI`: URI de la base de datos
- `GRAPHQL_ENDPOINT`: Endpoint del indexador

---

## Manejo de Schemas de Propiedades

### Tipos de Propiedades Soportados
```typescript
export type PropertyType = 'string' | 'integer' | 'number' | 'boolean' | 'reference';
```

### Estructura de Formulario
Cada propiedad se define con un prefijo único: `property[index].*`

```typescript
// Ejemplo de estructura de formulario
property[0].name = "Email"
property[0].type = "string"
property[0].format = "email"
property[0].minLength = "5"
property[0].maxLength = "100"
property[0].array = "" // o "array" si es un array
```

### Procesamiento de Propiedades

#### 1. **String**
```typescript
if (type === 'string') {
  const { format, minLength, maxLength, enum: list } = property;
  data = {
    type,
    ...(format && { format }),
    ...(minLength && { minLength: parseInt(minLength) }),
    ...(maxLength && { maxLength: parseInt(maxLength) }),
    ...(list && { enum: list.split(',') }),
  };
}
```

**Características:**
- `format`: email, uri, etc.
- `minLength`/`maxLength`: Longitud mínima/máxima
- `enum`: Lista de valores permitidos (separados por comas)

#### 2. **Integer/Number**
```typescript
if (['integer', 'number'].includes(type)) {
  const { minimum, maximum, enum: list } = property;
  const parse = type === 'integer' ? parseInt : parseFloat;
  const numbersList = parseNumbersList(list, parse);

  data = {
    type,
    ...(minimum && { minimum: parseFloat(minimum) }),
    ...(maximum && { maximum: parseFloat(maximum) }),
    ...(numbersList && { enum: numbersList }),
  };
}
```

**Características:**
- `minimum`/`maximum`: Rango de valores
- `enum`: Lista de números permitidos
- `parseNumbersList()`: Parsea strings a números

#### 3. **Boolean**
```typescript
if (type === 'boolean') {
  data = { type };
}
```

**Características:**
- Solo tipo, sin restricciones adicionales

#### 4. **Reference**
```typescript
if (type === 'reference') {
  data = { $ref: property.$ref };
}
```

**Características:**
- `$ref`: Referencia a otro CType o propiedad
- Patrón: `kilt:ctype:0x[hash](#/properties/propertyName)?`

#### 5. **Arrays**
```typescript
if (array) {
  return [
    name,
    {
      type: 'array',
      items: data,
      ...(minItems && { minItems: parseInt(minItems) }),
      ...(maxItems && { maxItems: parseInt(maxItems) }),
    },
  ];
}
```

**Características:**
- `minItems`/`maxItems`: Número mínimo/máximo de elementos
- `items`: Tipo de los elementos del array

### Parsing de Números
```typescript
export function parseNumbersList(
  list: string | undefined,
  parse: (input: string) => number,
) {
  if (!list) return undefined;

  const numbersList = list.split(',').map((value) => parse(value));
  if (numbersList.some(Number.isNaN)) {
    throw new Error(`Cannot parse as list of numbers: ${list}`);
  }
  return numbersList;
}
```

---

## Selección de Cuentas y DIDs

### 1. Detección de Extensiones
```typescript
// useSupportedExtensions.ts
function update() {
  const current = [...Object.entries(window.kilt)]
    .filter(([, api]) => 'signExtrinsicWithDid' in api)
    .map(([key, { name }]) => ({ key, name }));
  setExtensions(current);
}
```

### 2. Selección de Cuenta de Pago
```typescript
// SelectAccount.tsx
const handleEnableClick = async () => {
  const api = await connect(getBlockchainEndpoint());
  const apiGenesisHash = api.genesisHash.toHex();

  await web3Enable(originName);
  const loaded = await web3Accounts();

  const usable = loaded.find(
    ({ meta: { genesisHash } }) => genesisHash === apiGenesisHash,
  );

  if (usable) {
    onSelect(usable);
  }
};
```

**Proceso:**
1. Se conecta a la blockchain para obtener el `genesisHash`
2. Se habilita la extensión con `web3Enable()`
3. Se obtienen todas las cuentas disponibles
4. Se filtra por cuentas compatibles con KILT
5. Se selecciona automáticamente la primera cuenta válida

### 3. Selección del DID
El DID se selecciona automáticamente desde la wallet durante la firma:

```typescript
// CreateForm.tsx
const authorized = await extension.signExtrinsicWithDid(
  createTx.toHex(),
  account.address as KiltAddress,
);
const creator = Did.parse(authorized.didKeyUri).did;
```

**Proceso:**
1. La wallet muestra al usuario sus DIDs disponibles
2. El usuario selecciona qué DID usar para firmar
3. La wallet devuelve el `didKeyUri` del DID seleccionado
4. Se extrae el DID del `didKeyUri` con `Did.parse()`

---

## Proceso de Firma Detallado

### 1. Construcción de la Transacción
```typescript
const createTx = api.tx.ctype.add(CType.toChain(cType));
```

### 2. Firma con DID
```typescript
const authorized = await extension.signExtrinsicWithDid(
  createTx.toHex(),           // Transacción serializada
  account.address as KiltAddress, // Cuenta que paga
);
```

**Parámetros enviados a la wallet:**
- `extrinsic`: Transacción en formato hexadecimal
- `signer`: Dirección de la cuenta de pago

**Respuesta de la wallet:**
- `signed`: Transacción firmada con el DID
- `didKeyUri`: URI del DID y clave usada para firmar

### 3. Autorización de Transacción
```typescript
const authorizedTx = api.tx(authorized.signed);
const injected = await web3FromSource(account.meta.source);
await authorizedTx.signAndSend(account.address, injected);
```

**Proceso:**
1. Se crea una transacción autorizada con la firma del DID
2. Se obtiene el signer inyectado de la extensión
3. Se firma y envía la transacción con la cuenta de pago

### 4. Firma del Backend (para operaciones internas)
```typescript
// cryptoCallbacks.ts
export async function signWithAssertionMethod({ data }: { data: Uint8Array }) {
  const { assertionMethod } = await getKeypairs();
  const { did, assertionMethodKey } = await getDidDocument();

  return {
    signature: assertionMethod.sign(data, { withType: false }),
    keyType: assertionMethodKey.type,
    keyUri: `${did}${assertionMethodKey.id}`,
  };
}
```

**Para operaciones del backend:**
- Se usa `Did.authorizeTx()` con callback de firma
- Se firma con la clave de assertion method configurada
- Se incluye el tipo de clave y URI del recurso

### 5. Validación de DIDs
```typescript
// getDidDocument.ts
const resolved = await Did.resolve(did);
if (!resolved?.document) {
  throw new Error(`Could not resolve the configured DID ${did}`);
}

// Compara claves configuradas con las resueltas
await compareAllKeys(document);
```

**Validaciones:**
- Resolución del DID en la blockchain
- Verificación de que las claves configuradas coinciden
- Validación de que existen todas las claves necesarias

---

## Diagrama de Flujo (resumido)
```mermaid
graph TD;
  Usuario--&gt;Frontend;
  Frontend--&gt;Wallet;
  Wallet--&gt;Frontend;
  Frontend--&gt;Backend;
  Backend--&gt;Blockchain;
  Backend--&gt;BaseDeDatos;
  Backend--&gt;Indexer;
```

---

**Este documento resume la arquitectura, flujos y seguridad de CTypeHub.**
