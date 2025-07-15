import type { IEncryptedMessageV1 } from '@kiltprotocol/kilt-extension-api';
import type { ISessionRequest, ISessionResponse } from '@/types/kilt';
import { API_URL } from '../config/api';

export interface AuthChallenge {
  challenge: string;
  dAppName: string;
  dAppEncryptionKeyUri: string;
}

export interface User {
  did: string;
  roles: string[];
}

export interface AuthResponse {
  jwt: string;
  user: User;
  response?: {
    body: {
      type: string;
      content: {
        '@context': string[];
        type: string[];
        verifiableCredential: Array<{
          '@context': string[];
          type: string[];
          credentialSubject: {
            id: string;
            origin: string;
          };
          issuer: string;
          issuanceDate: string;
          proof: {
            type: string;
            proofPurpose: string;
            verificationMethod: string;
            signature: string;
          };
        }>;
      };
    };
    createdAt: number;
    sender: string;
    receiver: string;
    messageId: string;
    inReplyTo: string;
  };
}

// Función de utilidad para hacer peticiones con headers correctos
const makeAuthenticatedRequest = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Agregar el header Origin si estamos en el navegador
  if (typeof window !== 'undefined') {
    headers['Origin'] = window.location.origin;
  }

  return fetch(url, {
    ...options,
    headers,
  });
};

export const authService = {
  // Obtener sessionRequest del backend
  async getChallenge(): Promise<ISessionRequest> {
    console.log("[authService] Obteniendo sessionRequest del backend...");
    try {
      const response = await makeAuthenticatedRequest(`${API_URL}/auth/challenge`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[authService] Error obteniendo sessionRequest:", {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`Error al obtener el sessionRequest: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log("[authService] SessionRequest obtenido exitosamente:", data);
      return data;
    } catch (error) {
      console.error("[authService] Error en getChallenge:", error);
      throw error;
    }
  },

  // Verificar sesión
  async verifySession(
    sessionRequest: ISessionRequest,
    sessionResponse: ISessionResponse,
    userDid: string
  ): Promise<AuthResponse> {
    console.log("[authService] Verificando sesión...", {
      sessionRequest,
      sessionResponse,
      userDid
    });

    try {
      const response = await makeAuthenticatedRequest(`${API_URL}/auth/verify-session`, {
        method: 'POST',
        body: JSON.stringify({
          sessionRequest,
          sessionResponse,
          userDid,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[authService] Error verificando sesión:", {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`Error al verificar la sesión: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log("[authService] Sesión verificada exitosamente:", data);
      return data;
    } catch (error) {
      console.error("[authService] Error en verifySession:", error);
      throw error;
    }
  },

  // Verificar si el usuario está autenticado
  isAuthenticated(): boolean {
    const isAuth = !!localStorage.getItem('token');
    console.log("[authService] Verificando autenticación:", isAuth);
    return isAuth;
  },

  // Obtener el token JWT
  getToken(): string | null {
    const token = localStorage.getItem('token');
    console.log("[authService] Obteniendo token:", token ? "Token presente" : "No hay token");
    return token;
  },

  // Obtener el DID del usuario
  getDid(): string | null {
    const did = localStorage.getItem('did');
    console.log("[authService] Obteniendo DID:", did);
    return did;
  },

  // Obtener los datos del usuario
  getUser(): User | null {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    console.log("[authService] Obteniendo usuario:", user);
    return user;
  },

  // Cerrar sesión
  logout(): void {
    console.log("[authService] Cerrando sesión...");
    localStorage.removeItem('token');
    localStorage.removeItem('did');
    localStorage.removeItem('user');
    window.location.href = '/';
  },

  // Verificar firma directa del challenge (método legacy)
  async verifySignature(
    challenge: string,
    signature: string,
    didKeyUri: string
  ): Promise<AuthResponse> {
    console.log("[authService] Verificando firma directa...", {
      challenge,
      signature,
      didKeyUri
    });

    try {
      const response = await makeAuthenticatedRequest(`${API_URL}/auth/verify-signature`, {
        method: 'POST',
        body: JSON.stringify({
          challenge,
          signature,
          didKeyUri,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[authService] Error verificando firma:", {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`Error al verificar la firma: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log("[authService] Firma verificada exitosamente:", data);
      return data;
    } catch (error) {
      console.error("[authService] Error en verifySignature:", error);
      throw error;
    }
  },
}; 