# Backend Peranto First UI DApp Logic

## Descripción

Este backend implementa una API REST robusta para la gestión de identidades, CTypes, Claims y Attestations sobre la blockchain de KILT, usando Express, TypeScript, Prisma y PostgreSQL. Está preparado para escalar, soportar múltiples redes (Peregrine y Spiritnet), y se encuentra listo para integrarse con wallets KILT como Sporran.

---

## Arquitectura

- **Express.js** como framework principal.
- **Prisma ORM** para la gestión de la base de datos PostgreSQL.
- **KILT SDK** para interacción con la blockchain.
- **Validación** de datos con Zod y Ajv.
- **JWT** para autenticación y autorización.
- **Sistema de Notificaciones** para comunicación con usuarios.
- **Soporte multi-red** (Peregrine y Spiritnet) configurable por variables de entorno.
- **KiltService** para operaciones blockchain centralizadas.

---

## Endpoints principales

- **CType**
  - `POST   /api/credentials/ctypes` — Crear un CType
  - `GET    /api/credentials/ctypes` — Listar CTypes
  - `PUT    /api/credentials/ctypes/:id` — Actualizar CType
  - `PATCH  /api/credentials/ctypes/:id` — Actualización parcial
  - `DELETE /api/credentials/ctypes/:id` — Eliminar CType

- **Claim**
  - `POST   /api/credentials/claims` — Crear un Claim
  - `GET    /api/credentials/claims` — Listar Claims
  - `PUT    /api/credentials/claims/:id` — Actualizar Claim
  - `PATCH  /api/credentials/claims/:id` — Actualización parcial
  - `DELETE /api/credentials/claims/:id` — Eliminar Claim

- **Attestation**
  - `POST   /api/credentials/attestations` — Crear una Attestation
  - `GET    /api/credentials/attestations` — Listar Attestations
  - `PATCH  /api/credentials/attestations/:id/revoke` — Revocar Attestation
  - `DELETE /api/credentials/attestations/:id` — Eliminar Attestation

- **Notificaciones**
  - `GET    /api/notifications` — Obtener notificaciones del usuario
  - `PATCH  /api/notifications/:id/read` — Marcar notificación como leída
  - `PATCH  /api/notifications/mark-all-read` — Marcar todas las notificaciones como leídas
  - `GET    /api/notifications/unread-count` — Obtener conteo de notificaciones no leídas
  - `DELETE /api/notifications/:id` — Eliminar notificación

- **Administración**
  - `GET    /api/admin/users` — Listar todos los usuarios
  - `PATCH  /api/admin/users/:id/roles` — Actualizar roles de usuario
  - `DELETE /api/admin/users/:id` — Eliminar usuario
  - `GET    /api/admin/attesters` — Listar attesters
  - `GET    /api/admin/ctypes` — Listar CTypes del sistema
  - `POST   /api/admin/ctypes` — Crear CType del sistema
  - `DELETE /api/admin/ctypes/:id` — Eliminar CType del sistema
  - `GET    /api/admin/stats` — Estadísticas del sistema

- **Autenticación**
  - `GET    /auth/challenge` — Solicitar challenge de autenticación (flujo dApp-wallet-backend funcionando)
  - `POST   /auth/verify` — Verificar challenge firmado y emitir JWT

---

## Sistema de Notificaciones

El backend incluye un sistema completo de notificaciones que permite:

- **Creación automática**: Las notificaciones se crean automáticamente cuando se cambian los roles de un usuario
- **Tipos de notificación**: Soporte para diferentes tipos (`ROLE_CHANGE`, `ACCOUNT_UPDATE`, `SYSTEM_ALERT`, etc.)
- **Datos estructurados**: Cada notificación puede incluir datos adicionales en formato JSON
- **Estado de lectura**: Seguimiento de notificaciones leídas y no leídas
- **Gestión completa**: Endpoints para crear, leer, marcar como leída y eliminar notificaciones

### Tipos de Notificación Disponibles

- `ROLE_CHANGE`: Cuando se modifican los roles de un usuario
- `ACCOUNT_UPDATE`: Actualizaciones de cuenta
- `SYSTEM_ALERT`: Alertas del sistema
- `CREDENTIAL_ISSUED`: Cuando se emite una credencial
- `CLAIM_ATTESTED`: Cuando se atesta un claim
- `SECURITY_ALERT`: Alertas de seguridad

---

## KiltService - Servicio Centralizado de Blockchain

Se ha implementado un servicio centralizado (`KiltService`) que encapsula todas las operaciones blockchain:

### Funcionalidades del KiltService

- **Creación de CTypes en blockchain**: Método `createCTypeOnChain` que maneja:
  - Conexión a la red KILT especificada (Spiritnet/Peregrine)
  - Carga de cuentas desde variables de entorno
  - Resolución del DID Document de la dApp
  - Derivación de claves de assertion method
  - Autorización y envío de transacciones
  - Manejo de errores y desconexión

### Características del KiltService

- **Multi-red**: Soporte para Spiritnet y Peregrine
- **Gestión de claves**: Derivación automática de claves desde mnemónicos
- **Transacciones autorizadas**: Uso del assertion method del DID de la dApp
- **Logging detallado**: Trazabilidad completa de operaciones
- **Manejo de errores**: Captura y propagación de errores específicos

---

## Gestión Avanzada de Usuarios y Roles

### Sistema de Roles Múltiples

- **Roles soportados**: `USER`, `ATTESTER`, `ADMIN`
- **Múltiples roles por usuario**: Un usuario puede tener varios roles simultáneamente
- **Protecciones de seguridad**:
  - No se puede quitar el rol ADMIN del administrador principal
  - No se puede eliminar el último administrador
  - Protección contra auto-eliminación

### Gestión de CTypes

- **Creación en blockchain**: Integración completa con KILT blockchain
- **Metadatos on-chain**: Almacenamiento de blockHash, blockNumber, transactionHash
- **Permisos por rol**: Control de acceso basado en roles
- **Estados**: ACTIVE, REVOKED, DRAFT
- **Redes múltiples**: Soporte para Spiritnet y Peregrine

---

## Seguridad y Validaciones

- **Validación de datos** con Zod y Ajv en todos los endpoints críticos.
- **Autenticación JWT** para proteger rutas sensibles.
- **Roles y permisos**: soporte para usuarios, attesters y admins (múltiples roles por usuario).
- **Variables de entorno** para credenciales, endpoints y configuración de red.
- **Protección de rutas**: Middlewares verifican el JWT y los roles antes de permitir el acceso a rutas protegidas.
- **Nota:** Los JWT **no se almacenan en el backend**. El backend solo los verifica en cada request usando la clave secreta. El frontend almacena el JWT y lo envía en cada request protegida.

---

## Integración con KILT y Wallet

- Soporte para ambas redes: Peregrine (testnet) y Spiritnet (mainnet).
- Preparado para integración con wallets KILT (ej: Sporran) vía challenge y firma.
- El backend expone correctamente el endpoint `/auth/challenge`, el frontend lo consume y el flujo de autenticación está integrado.
- **Presentación de la credencial de Domain Linkage:** Ya implementada y expuesta correctamente para verificación de dominio por wallets.

---

## Generación y firma de credencial de Domain Linkage

- El backend incluye un script (`scripts/generateDidConfiguration.ts`) que genera y firma la credencial de domain linkage (`did-configuration.json`) usando la assertionKey del DID de la dApp.
- La firma se realiza siguiendo el estándar `KILTSelfSigned2020` y el archivo se expone en `frontend/public/.well-known/did-configuration.json`.
- El campo `verificationMethod` en la prueba (`proof`) es el identificador del assertionMethod del DID, y la firma se almacena en el campo `signature` en formato hexadecimal.
- Se incluye la vigencia de la credencial (`expirationDate`) por 5 años.
- La lógica de derivación y firma de claves está desacoplada en el utility `src/utilities/cryptoCallbacks.ts`.
- **La presentación de la credencial ya está implementada y lista para ser consumida por wallets.**

---

## Nota sobre exportación de credenciales atestadas a VC

- Cuando debas exportar credenciales atestadas de KILT al formato Verifiable Credential (VC) compatible con Sporran y otras wallets, puedes usar la función [`fromCredentialAndAttestation`](https://kilt-js.kilt.io/functions/vc_export_src.fromCredentialAndAttestation.html) del SDK de KILT.
- Esta función transforma un credential KILT y su attestation en una VC estándar, incluyendo opcionalmente el CType.

---

## Observaciones y buenas prácticas

- El backend es modular y fácilmente extensible.
- La base de datos está normalizada y preparada para producción.
- Se recomienda usar HTTPS en producción y proteger las variables de entorno.
- El ejemplo de [KILT CertifiedProof](https://github.com/KILTprotocol/CertifiedProof) es una referencia útil para la integración frontend-wallet-backend.

---

## Roadmap Actualizado

### ✅ Completado

1. **Integrar la wallet KILT en el frontend** (conexión y firma de challenge). ✅
2. **Crear endpoint en backend para verificar firma y emitir JWT.** ✅
3. **Proteger endpoints sensibles usando JWT y roles.** ✅
4. **Exponer `.well-known/did-configuration.json` en el frontend.** ✅
5. **Arreglar la generación, firma y presentación de la Domain Linkage Credential.** ✅
6. **Implementar sistema de notificaciones.** ✅
7. **Crear KiltService centralizado para operaciones blockchain.** ✅
8. **Implementar gestión avanzada de usuarios y roles múltiples.** ✅
9. **Mejorar la UI/UX del dashboard y componentes.** ✅

### 🚧 En Progreso / Próximos Pasos

10. **Integrar Pinata para subir schemas de CTypes a IPFS.**
    - Configurar servicio de Pinata
    - Modificar creación de CTypes para incluir IPFS
    - Actualizar base de datos con CID de IPFS

11. **Migrar creación de CTypes de Admin a Attester.**
    - Crear endpoints específicos para attesters
    - Implementar firma con Sporran en lugar de assertion mnemonic
    - Usar la sesión activa del attester para firmar transacciones

12. **Implementar flujo completo de Claims.**
    - Crear claims como usuario
    - Presentar claims a attesters
    - Gestión de estados de claims

13. **Implementar flujo de Presentaciones.**
    - Crear presentaciones de credenciales
    - Verificar presentaciones
    - Exportar a formato VC

### 🔮 Futuro

14. **Agregar tests automáticos y hardening de seguridad.**
15. **Documentar el flujo de onboarding de attesters y admins.**
16. **Implementar monitoreo y logging avanzado.**
17. **Mejorar la gestión de permisos granular.**
18. **Implementar auditoría y logs de actividad.**
19. **Notificaciones push para alertas importantes.**

---

## Manejo de JWT y roles (ACLARACIÓN)

- El backend **no almacena** los JWT emitidos. Cada JWT es auto-contenido y firmado; el backend solo necesita la clave secreta para verificarlo en cada request.
- El frontend almacena el JWT (por ejemplo, en localStorage) y lo envía en cada request protegida.
- Los middlewares del backend extraen el DID y los roles del JWT y permiten o deniegan el acceso según los permisos requeridos.
- Si se requiere revocación anticipada de tokens, se puede implementar una blacklist opcional.

---

## Comandos útiles

```bash
# Instalar dependencias
cd backend
yarn install

# Ejecutar migraciones de base de datos
npx prisma migrate dev

# Generar cliente Prisma
npx prisma generate

# Crear usuario administrador
npx ts-node src/scripts/createAdmin.ts

# Iniciar el servidor en desarrollo
yarn dev
```

---

## Contribuciones

¡Las contribuciones son bienvenidas! Por favor, abre un issue o pull request para sugerencias o mejoras.

---

## Licencia

MIT 