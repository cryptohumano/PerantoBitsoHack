// Configuración de la API
const getApiUrl = () => {
  // En desarrollo, usar la IP local si estamos accediendo desde otro dispositivo
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === '192.168.100.102') {
      return 'http://192.168.100.102:4000';
    }
  }
  
  // Por defecto, usar localhost
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
};

export const API_URL = getApiUrl();

// Configuración del frontend
const getFrontendUrl = () => {
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.host}`;
  }
  return process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';
};

export const FRONTEND_URL = getFrontendUrl(); 