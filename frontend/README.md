# Frontend de la Plataforma de Identidad Digital Peranto Ci.Go

Este proyecto es el frontend de la plataforma de identidad digital basada en KILT, desarrollado con Next.js, Tailwind CSS y shadcn/ui.

> **Nota:** Se actualizó el gestor de paquetes a **corepack yarn** para soportar la instalación de la última versión de la dependencia principal `kilt-extension-api` directamente desde el repositorio de GitHub.

## Características Implementadas

- **Sistema de Roles Múltiples**: Soporte para usuarios con múltiples roles (`USER`, `ATTESTER`, `ADMIN`). El usuario puede cambiar de rol activo desde el header.
- **Selector de Roles Global**: El header incluye un selector de roles visible para usuarios con más de un rol, permitiendo cambiar de contexto y navegación dinámica según el rol activo.
- **Layout Unificado de Dashboard**: Un solo layout global (`/app/(dashboard)/layout.tsx`) gestiona sidebar y header para todas las secciones (admin, attester, citizen), evitando duplicados.
- **Header Global Dinámico**: El header muestra el título de la página, el selector de roles, notificaciones, tema y menú de usuario, todo gestionado de forma centralizada.
- **Sistema de Notificaciones**: Notificaciones en tiempo real con contador de no leídas, marcado como leída, eliminación y actualización automática cada 30 segundos.
- **Autenticación y Sesión**: Contexto global de autenticación (`AuthContext`) que gestiona el estado del usuario (DID, JWT, roles, rol activo), login/logout y persistencia en localStorage.
- **Protección de Rutas por Rol**: Componentes como `ProtectedRoute` y `RoleRequired` aseguran que solo los usuarios con el rol activo adecuado accedan a cada sección.
- **Integración con Wallet KILT**: Hook `useKiltWallet` para detectar wallets KILT (Sporran, Deloitte), conectar, obtener el DID y challenge, y manejar el estado de la sesión y errores.
- **Detección Robusta de Wallets**: Patrón de reintentos en la detección de wallets para asegurar la detección incluso si la extensión tarda en inyectar su API.
- **Flujo centralizado de conexión**: El hook `useKiltWallet` se encarga de todo el flujo: detección, obtención de challenge, inicio de sesión con la wallet y manejo de errores/estado.

## Mejoras de UI/UX Implementadas

### Dashboard y Navegación

- **Header Rediseñado**: Estructura de tres columnas (Título | Selector de Roles | Acciones) para mejor organización visual
- **Eliminación de Títulos Duplicados**: Los títulos de página solo aparecen en el header, no en el contenido
- **Sidebar Mejorado**: Navegación contextual según el rol activo del usuario
- **Theme Toggle Corregido**: Eliminación del botón flotante y integración correcta en el header

### Gestión de CTypes

- **Tabla con Scroll Inteligente**: La tabla de CTypes mantiene los filtros visibles mientras permite scroll en el contenido
- **Menú de Acciones Contextual**: Cada CType tiene su propio menú con acciones específicas (Ver Detalles, Copiar Hash, Exportar, Importar, Eliminar)
- **Filtros Avanzados**: Búsqueda por nombre/hash, filtros por estado, red, creador y roles
- **Estados Visuales**: Badges diferenciados para estados (Activo, Revocado, Borrador) y redes (Spiritnet, Peregrine)

### Página de Inicio

- **Navegación Mejorada**: Barra de navegación sticky con mejor alineación
- **Layout Responsivo**: Contenido centrado con márgenes consistentes
- **Integración de Tema**: Theme toggle integrado en el menú de navegación

## Sistema de Notificaciones

El frontend incluye un sistema completo de notificaciones que se integra con el backend:

- **Hook useNotifications**: Hook personalizado que maneja todas las operaciones de notificaciones
- **Componente NotificationsDropdown**: Dropdown en el header que muestra las notificaciones del usuario
- **Funcionalidades**:
  - Mostrar notificaciones con título, mensaje y timestamp
  - Contador de notificaciones no leídas en el badge
  - Marcar notificación individual como leída al hacer clic
  - Marcar todas las notificaciones como leídas
  - Eliminar notificaciones individuales
  - Actualización automática cada 30 segundos
  - Formateo de fechas en español usando `date-fns`
- **Estados visuales**: Diferentes estilos para notificaciones leídas y no leídas
- **Integración con AuthContext**: Usa el JWT del contexto de autenticación para las peticiones

## Arquitectura de Componentes

- **context/AuthContext.tsx**: Maneja el estado global de autenticación, usuario, roles y rol activo. Permite login, logout y cambio de rol activo. Persiste la sesión en localStorage.
- **hooks/useKiltWallet.ts**: Hook para integración con wallets KILT, maneja conexión, challenge y errores.
- **hooks/useNotifications.ts**: Hook para manejar todas las operaciones de notificaciones del backend.
- **providers/KiltProvider.tsx**: Proveedor para el contexto de KILT, maneja la lógica de conexión y sesión con la wallet.
- **components/dashboard/shared/dashboard-layout.tsx**: Layout global del dashboard, incluye sidebar y header.
- **components/dashboard/shared/dashboard-header.tsx**: Header global, muestra título dinámico, selector de roles, notificaciones, tema y usuario.
- **components/dashboard/shared/notifications-dropdown.tsx**: Componente de dropdown para mostrar y gestionar notificaciones.
- **components/app-sidebar/**: Sidebars específicos para cada rol (admin, attester, citizen, verifier).
- **components/auth/ProtectedRoute.tsx**: Protege rutas según autenticación y rol activo.
- **components/auth/RoleRequired.tsx**: Muestra el selector de roles si el usuario tiene el rol pero no está activo.

## Flujo de Autenticación KILT

1. **Detección de Wallets**: El frontend detecta las extensiones compatibles en `window.kilt` usando un patrón de reintentos.
2. **Selección de Wallet**: El usuario selecciona la wallet con la que desea autenticarse.
3. **Obtención de Challenge**: El frontend solicita un challenge único al backend.
4. **Inicio de Sesión con la Wallet**: El frontend llama a `startSession` de la wallet seleccionada, pasando el challenge y los datos de la dApp.
5. **Firma y Verificación**: La wallet firma el challenge y el frontend envía la respuesta al backend para su verificación.
6. **Creación de Sesión y Autenticación**: El backend valida la firma, crea la sesión y responde con un JWT. El frontend almacena el JWT y los datos del usuario en el contexto global.

## Flujo de Notificaciones

1. **Carga inicial**: Al montar el componente, se cargan las notificaciones del usuario desde el backend
2. **Actualización automática**: Cada 30 segundos se actualizan las notificaciones y el contador de no leídas
3. **Interacciones del usuario**:
   - Clic en notificación: Se marca como leída
   - Botón "Marcar todas como leídas": Marca todas las notificaciones como leídas
   - Botón de eliminar: Elimina la notificación específica
4. **Estados visuales**: Las notificaciones no leídas tienen un fondo diferente y el badge muestra el contador

## Roadmap Actualizado

### ✅ Completado

1. **Integrar la wallet KILT en el frontend** (conexión y firma de challenge). ✅
2. **Implementar sistema de autenticación con JWT y roles múltiples.** ✅
3. **Crear layout unificado del dashboard con header y sidebar dinámicos.** ✅
4. **Implementar sistema de notificaciones en tiempo real.** ✅
5. **Mejorar la UI/UX del dashboard y componentes.** ✅
6. **Implementar gestión de CTypes con tabla avanzada y filtros.** ✅
7. **Corregir problemas de layout y navegación.** ✅

### 🚧 En Progreso / Próximos Pasos

8. **Integrar Pinata para visualización de schemas de CTypes.**
    - Mostrar schemas desde IPFS en los modales de detalles
    - Implementar preview de schemas JSON

9. **Migrar creación de CTypes de Admin a Attester.**
    - Crear interfaz específica para attesters
    - Integrar firma con Sporran para transacciones
    - Usar la sesión activa del attester

10. **Implementar flujo completo de Claims.**
    - Interfaz para crear claims como usuario
    - Dashboard para attesters para revisar claims
    - Gestión de estados de claims

11. **Implementar flujo de Presentaciones.**
    - Interfaz para crear presentaciones
    - Verificación de presentaciones
    - Exportación a formato VC

### 🔮 Futuro

12. **Mejorar la gestión de roles y permisos.**
13. **Implementar auditoría y logs de actividad.**
14. **Notificaciones push para alertas importantes.**
15. **Mejoras adicionales de UX y accesibilidad.**
16. **Tests automatizados para componentes críticos.**

## Instalación

```bash
yarn install
```

## Desarrollo

```bash
yarn run dev
```

## Construcción

```bash
yarn run build
```

## Licencia

MIT
