"use client";

import { useState, useEffect } from 'react';

export const useSporranDetection = () => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkSporran = () => {
      const sporranWindow = window as { kilt?: { sporran?: unknown } };
      const available = !!(sporranWindow.kilt?.sporran);
      setIsAvailable(available);
      setIsChecking(false);
      
      if (available) {
        console.log('✅ [useSporranDetection] Sporran detectado');
      } else {
        console.log('⚠️ [useSporranDetection] Sporran no disponible');
      }
    };

    // Verificar inmediatamente
    checkSporran();

    // Verificar cada 2 segundos hasta que esté disponible
    const interval = setInterval(() => {
      if (!isAvailable) {
        checkSporran();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isAvailable]);

  return {
    isAvailable,
    isChecking
  };
}; 