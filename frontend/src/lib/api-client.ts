// Cliente API para las API routes de Next.js
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface ApiRequestOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
}

export const apiClient = {
  async request(endpoint: string, options: ApiRequestOptions = {}) {
    const { method = 'GET', body, headers = {} } = options;
    
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    // Agregar el header Origin para evitar problemas de CORS
    // En las API routes de Next.js, necesitamos establecer el origen manualmente
    if (typeof window !== 'undefined') {
      requestHeaders['Origin'] = window.location.origin;
    } else {
      // Si estamos en el servidor (API routes), usar un origen por defecto
      requestHeaders['Origin'] = 'http://localhost:3000';
    }

    const requestOptions: RequestInit = {
      method,
      headers: requestHeaders,
    };

    if (body) {
      requestOptions.body = JSON.stringify(body);
    }

    const url = `${API_URL}${endpoint}`;
    console.log(`[apiClient] Making request to: ${url}`, {
      method,
      headers: requestHeaders,
      hasBody: !!body
    });

    const response = await fetch(url, requestOptions);
    
    console.log(`[apiClient] Response status: ${response.status}`);
    
    if (!response.ok) {
      const text = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(text);
      } catch {
        errorData = { error: `HTTP ${response.status}: ${text.substring(0, 200)}` };
      }
      throw new Error(JSON.stringify(errorData));
    }

    return response.json();
  },

  async get(endpoint: string, headers?: Record<string, string>) {
    return this.request(endpoint, { method: 'GET', headers });
  },

  async post(endpoint: string, body: any, headers?: Record<string, string>) {
    return this.request(endpoint, { method: 'POST', body, headers });
  },

  async put(endpoint: string, body: any, headers?: Record<string, string>) {
    return this.request(endpoint, { method: 'PUT', body, headers });
  },

  async delete(endpoint: string, headers?: Record<string, string>) {
    return this.request(endpoint, { method: 'DELETE', headers });
  },

  async patch(endpoint: string, body: any, headers?: Record<string, string>) {
    return this.request(endpoint, { method: 'PATCH', body, headers });
  }
}; 