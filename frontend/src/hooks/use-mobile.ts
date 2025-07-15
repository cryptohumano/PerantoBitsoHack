import { useEffect, useState } from 'react';

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Verificar al montar
    checkIsMobile();

    // Agregar listener para cambios de tamaño
    window.addEventListener('resize', checkIsMobile);

    // Limpiar listener al desmontar
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return isMobile;
}
