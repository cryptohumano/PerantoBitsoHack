import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { DidUrl } from '@kiltprotocol/types';
import type { PubSubSessionV1, PubSubSessionV2 } from '@kiltprotocol/kilt-extension-api';

type Session = PubSubSessionV1 | PubSubSessionV2;

// Estados de las acciones KILT
export type KiltActionState = 
  | 'idle'
  | 'loading'
  | 'success'
  | 'error'
  | 'cancelled';

// Tipos de acciones KILT
export type KiltActionType = 
  | 'request_quote'
  | 'present_credential'
  | 'create_claim'
  | 'attest_claim'
  | 'verify_credential'
  | 'revoke_credential'
  | 'create_ctype'
  | 'issue_credential';

// Interfaz para una acción KILT
export interface KiltAction {
  id: string;
  type: KiltActionType;
  state: KiltActionState;
  title: string;
  description?: string;
  data?: Record<string, unknown>;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    ctypeId?: string;
    claimId?: string;
    credentialId?: string;
    did?: string;
    [key: string]: unknown;
  };
}

// Interfaz para credenciales
export interface Credential {
  id: string;
  ctypeId: string;
  ctypeTitle: string;
  issuer: string;
  holder: string;
  issuedAt: Date;
  expiresAt?: Date;
  status: 'active' | 'revoked' | 'expired';
  data: Record<string, unknown>;
  proof?: Record<string, unknown>;
}

// Interfaz para claims
export interface Claim {
  id: string;
  ctypeId: string;
  ctypeTitle: string;
  requester: string;
  attester?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  data: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  attestationDate?: Date;
}

// Interfaz para CTypes
export interface CType {
  id: string;
  title: string;
  description?: string;
  schema: Record<string, unknown>;
  owner: string;
  createdAt: Date;
  isActive: boolean;
}

// Interfaz para notificaciones
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  data?: Record<string, unknown>;
}

// Estado global de la aplicación
interface GlobalState {
  // === SESIÓN Y AUTENTICACIÓN ===
  session: {
    isAuthenticated: boolean;
    did: DidUrl | null;
    jwt: string | null;
    user: {
      did: string;
      roles: string[];
    } | null;
    activeRole: string | null;
    session: Session | null;
  };

  // === ESTADO DE KILT ===
  kilt: {
    isInitialized: boolean;
    isExtensionAvailable: boolean;
    isLoading: boolean;
    error: string | null;
    availableDids: DidUrl[];
    selectedDid: DidUrl | null;
  };

  // === ACCIONES KILT ===
  actions: {
    current: KiltAction | null;
    history: KiltAction[];
    pending: KiltAction[];
  };

  // === DATOS DE LA APLICACIÓN ===
  data: {
    credentials: Credential[];
    claims: Claim[];
    ctypes: CType[];
    notifications: Notification[];
  };

  // === UI STATE ===
  ui: {
    sidebarOpen: boolean;
    theme: 'light' | 'dark' | 'system';
    loadingStates: Record<string, boolean>;
    modals: {
      [key: string]: boolean;
    };
  };

  // === ACTIONS ===
  
  // Sesión
  setSession: (session: Partial<GlobalState['session']>) => void;
  clearSession: () => void;
  setActiveRole: (role: string) => void;

  // KILT
  setKiltState: (state: Partial<GlobalState['kilt']>) => void;
  setKiltError: (error: string | null) => void;
  setAvailableDids: (dids: DidUrl[]) => void;
  setSelectedDid: (did: DidUrl | null) => void;

  // Acciones KILT
  startAction: (action: Omit<KiltAction, 'id' | 'state' | 'createdAt' | 'updatedAt'>) => string;
  updateAction: (id: string, updates: Partial<KiltAction>) => void;
  completeAction: (id: string, data?: any) => void;
  failAction: (id: string, error: string) => void;
  cancelAction: (id: string) => void;
  clearActionHistory: () => void;

  // Datos
  setCredentials: (credentials: Credential[]) => void;
  addCredential: (credential: Credential) => void;
  updateCredential: (id: string, updates: Partial<Credential>) => void;
  removeCredential: (id: string) => void;

  setClaims: (claims: Claim[]) => void;
  addClaim: (claim: Claim) => void;
  updateClaim: (id: string, updates: Partial<Claim>) => void;
  removeClaim: (id: string) => void;

  setCTypes: (ctypes: CType[]) => void;
  addCType: (ctype: CType) => void;
  updateCType: (id: string, updates: Partial<CType>) => void;
  removeCType: (id: string) => void;

  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markNotificationAsRead: (id: string) => void;

  // UI
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setLoadingState: (key: string, loading: boolean) => void;
  setModalOpen: (modal: string, open: boolean) => void;

  // Utilidades
  getActionById: (id: string) => KiltAction | undefined;
  getCurrentAction: () => KiltAction | null;
  isActionInProgress: (type?: KiltActionType) => boolean;
  getCredentialsByCType: (ctypeId: string) => Credential[];
  getClaimsByStatus: (status: Claim['status']) => Claim[];
}

// Store principal
export const useGlobalStore = create<GlobalState>()(
  devtools(
    persist(
      (set, get) => ({
        // === ESTADO INICIAL ===
        session: {
          isAuthenticated: false,
          did: null,
          jwt: null,
          user: null,
          activeRole: null,
          session: null,
        },

        kilt: {
          isInitialized: false,
          isExtensionAvailable: false,
          isLoading: false,
          error: null,
          availableDids: [],
          selectedDid: null,
        },

        actions: {
          current: null,
          history: [],
          pending: [],
        },

        data: {
          credentials: [],
          claims: [],
          ctypes: [],
          notifications: [],
        },

        ui: {
          sidebarOpen: false,
          theme: 'system',
          loadingStates: {},
          modals: {},
        },

        // === ACTIONS ===

        // Sesión
        setSession: (session) => set((state) => ({
          session: { ...state.session, ...session }
        })),

        clearSession: () => set((state) => ({
          session: {
            isAuthenticated: false,
            did: null,
            jwt: null,
            user: null,
            activeRole: null,
            session: null,
          }
        })),

        setActiveRole: (role) => set((state) => ({
          session: { ...state.session, activeRole: role }
        })),

        // KILT
        setKiltState: (kiltState) => set((state) => ({
          kilt: { ...state.kilt, ...kiltState }
        })),

        setKiltError: (error) => set((state) => ({
          kilt: { ...state.kilt, error }
        })),

        setAvailableDids: (dids) => set((state) => ({
          kilt: { ...state.kilt, availableDids: dids }
        })),

        setSelectedDid: (did) => set((state) => ({
          kilt: { ...state.kilt, selectedDid: did }
        })),

        // Acciones KILT
        startAction: (actionData) => {
          const id = `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const action: KiltAction = {
            id,
            ...actionData,
            state: 'loading',
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          set((state) => ({
            actions: {
              ...state.actions,
              current: action,
              pending: [...state.actions.pending, action],
            }
          }));

          return id;
        },

        updateAction: (id, updates) => set((state) => {
          const updatedAction = { ...updates, updatedAt: new Date() };
          
          // Actualizar acción actual
          const current = state.actions.current?.id === id 
            ? { ...state.actions.current, ...updatedAction }
            : state.actions.current;

          // Actualizar en pending
          const pending = state.actions.pending.map(action =>
            action.id === id ? { ...action, ...updatedAction } : action
          );

          // Actualizar en history
          const history = state.actions.history.map(action =>
            action.id === id ? { ...action, ...updatedAction } : action
          );

          return {
            actions: { current, pending, history }
          };
        }),

        completeAction: (id, data) => {
          const updates = {
            state: 'success' as KiltActionState,
            data,
            updatedAt: new Date(),
          };

          set((state) => {
            const current = state.actions.current?.id === id ? null : state.actions.current;
            const pending = state.actions.pending.filter(action => action.id !== id);
            const history = [
              ...state.actions.history,
              ...state.actions.pending.filter(action => action.id === id)
                .map(action => ({ ...action, ...updates }))
            ];

            return {
              actions: { current, pending, history }
            };
          });
        },

        failAction: (id, error) => {
          const updates = {
            state: 'error' as KiltActionState,
            error,
            updatedAt: new Date(),
          };

          set((state) => {
            const current = state.actions.current?.id === id ? null : state.actions.current;
            const pending = state.actions.pending.filter(action => action.id !== id);
            const history = [
              ...state.actions.history,
              ...state.actions.pending.filter(action => action.id === id)
                .map(action => ({ ...action, ...updates }))
            ];

            return {
              actions: { current, pending, history }
            };
          });
        },

        cancelAction: (id) => {
          const updates = {
            state: 'cancelled' as KiltActionState,
            updatedAt: new Date(),
          };

          set((state) => {
            const current = state.actions.current?.id === id ? null : state.actions.current;
            const pending = state.actions.pending.filter(action => action.id !== id);
            const history = [
              ...state.actions.history,
              ...state.actions.pending.filter(action => action.id === id)
                .map(action => ({ ...action, ...updates }))
            ];

            return {
              actions: { current, pending, history }
            };
          });
        },

        clearActionHistory: () => set((state) => ({
          actions: { ...state.actions, history: [] }
        })),

        // Datos
        setCredentials: (credentials) => set((state) => ({
          data: { ...state.data, credentials }
        })),

        addCredential: (credential) => set((state) => ({
          data: { 
            ...state.data, 
            credentials: [...state.data.credentials, credential] 
          }
        })),

        updateCredential: (id, updates) => set((state) => ({
          data: {
            ...state.data,
            credentials: state.data.credentials.map(cred =>
              cred.id === id ? { ...cred, ...updates } : cred
            )
          }
        })),

        removeCredential: (id) => set((state) => ({
          data: {
            ...state.data,
            credentials: state.data.credentials.filter(cred => cred.id !== id)
          }
        })),

        setClaims: (claims) => set((state) => ({
          data: { ...state.data, claims }
        })),

        addClaim: (claim) => set((state) => ({
          data: { 
            ...state.data, 
            claims: [...state.data.claims, claim] 
          }
        })),

        updateClaim: (id, updates) => set((state) => ({
          data: {
            ...state.data,
            claims: state.data.claims.map(claim =>
              claim.id === id ? { ...claim, ...updates } : claim
            )
          }
        })),

        removeClaim: (id) => set((state) => ({
          data: {
            ...state.data,
            claims: state.data.claims.filter(claim => claim.id !== id)
          }
        })),

        setCTypes: (ctypes) => set((state) => ({
          data: { ...state.data, ctypes }
        })),

        addCType: (ctype) => set((state) => ({
          data: { 
            ...state.data, 
            ctypes: [...state.data.ctypes, ctype] 
          }
        })),

        updateCType: (id, updates) => set((state) => ({
          data: {
            ...state.data,
            ctypes: state.data.ctypes.map(ctype =>
              ctype.id === id ? { ...ctype, ...updates } : ctype
            )
          }
        })),

        removeCType: (id) => set((state) => ({
          data: {
            ...state.data,
            ctypes: state.data.ctypes.filter(ctype => ctype.id !== id)
          }
        })),

        setNotifications: (notifications) => set((state) => ({
          data: { ...state.data, notifications }
        })),

        addNotification: (notification) => set((state) => ({
          data: { 
            ...state.data, 
            notifications: [...state.data.notifications, notification] 
          }
        })),

        markNotificationAsRead: (id) => set((state) => ({
          data: {
            ...state.data,
            notifications: state.data.notifications.map(notif =>
              notif.id === id ? { ...notif, read: true } : notif
            )
          }
        })),

        // UI
        setSidebarOpen: (sidebarOpen) => set((state) => ({
          ui: { ...state.ui, sidebarOpen }
        })),

        setTheme: (theme) => set((state) => ({
          ui: { ...state.ui, theme }
        })),

        setLoadingState: (key, loading) => set((state) => ({
          ui: {
            ...state.ui,
            loadingStates: { ...state.ui.loadingStates, [key]: loading }
          }
        })),

        setModalOpen: (modal, open) => set((state) => ({
          ui: {
            ...state.ui,
            modals: { ...state.ui.modals, [modal]: open }
          }
        })),

        // Utilidades
        getActionById: (id) => {
          const state = get();
          return [...state.actions.pending, ...state.actions.history]
            .find(action => action.id === id);
        },

        getCurrentAction: () => {
          const state = get();
          return state.actions.current;
        },

        isActionInProgress: (type) => {
          const state = get();
          const current = state.actions.current;
          if (!current) return false;
          if (type) return current.type === type && current.state === 'loading';
          return current.state === 'loading';
        },

        getCredentialsByCType: (ctypeId) => {
          const state = get();
          return state.data.credentials.filter(cred => cred.ctypeId === ctypeId);
        },

        getClaimsByStatus: (status) => {
          const state = get();
          return state.data.claims.filter(claim => claim.status === status);
        },
      }),
      {
        name: 'peranto-global-store',
        partialize: (state) => ({
          session: {
            isAuthenticated: state.session.isAuthenticated,
            did: state.session.did,
            jwt: state.session.jwt,
            user: state.session.user,
            activeRole: state.session.activeRole,
          },
          kilt: {
            isInitialized: state.kilt.isInitialized,
            isExtensionAvailable: state.kilt.isExtensionAvailable,
            availableDids: state.kilt.availableDids,
            selectedDid: state.kilt.selectedDid,
          },
          data: state.data,
          ui: {
            theme: state.ui.theme,
          },
        }),
      }
    ),
    {
      name: 'peranto-store',
    }
  )
); 