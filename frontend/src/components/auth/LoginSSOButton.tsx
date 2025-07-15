import { useKiltWallet } from '@/hooks/useKiltWallet';
import { useState } from 'react';
import { SporranPromo } from '@/components/onboarding/SporranPromo';
import { WalletDetection } from '@/components/onboarding/WalletDetection';
import { VisitorConversionFlow } from '@/components/onboarding/VisitorConversionFlow';
import React from 'react'; // Added missing import

export function LoginSSOButton({ className = "" }: { className?: string }) {
  const {
    connectWallet,
    isConnecting,
    isConnected,
    isReady,
    error,
    state
  } = useKiltWallet();

  const [showOnboardingHint, setShowOnboardingHint] = useState(false);
  const [showSporranPromo, setShowSporranPromo] = useState(false);
  const [showWalletDetection, setShowWalletDetection] = useState(false);
  const [showVisitorConversion, setShowVisitorConversion] = useState(false);

  let buttonText = "Login con Sporran";
  if (isConnecting) buttonText = "Conectando con Sporran...";
  else if (isConnected) buttonText = "¡Listo! Redirigiendo...";
  else if (state === "error") buttonText = error || "Error";

  const handleConnect = async () => {
    // Verificar si Sporran está instalado antes de intentar conectar
    if (!isSporranInstalled()) {
      console.log('📱 [LoginSSOButton] Sporran no instalado, mostrando SporranPromo');
      setShowSporranPromo(true);
      return;
    }

    console.log('🚀 [LoginSSOButton] Iniciando conexión con Sporran');
    try {
      await connectWallet();
    } catch (error) {
      console.error('❌ [LoginSSOButton] Error en conexión:', error);
      // Si hay error, mostrar hint de onboarding
      if (error && typeof error === 'string' && error.includes('FullDID')) {
        setShowOnboardingHint(true);
      }
    }
  };

  const handleOnboardingClick = () => {
    console.log('🚀 [LoginSSOButton] Redirigiendo al onboarding');
    window.location.href = '/onboarding';
  };

  // Detectar si Sporran está instalado
  const isSporranInstalled = () => {
    return !!(window as unknown as { kilt?: { sporran?: unknown } }).kilt?.sporran;
  };

  // Manejar cuando el usuario rechaza o cierra Sporran
  const handleSporranRejection = () => {
    console.log('❌ [LoginSSOButton] Usuario rechazó o cerró Sporran');
    
    if (!isSporranInstalled()) {
      console.log('📱 [LoginSSOButton] Sporran no instalado, mostrando SporranPromo');
      setShowSporranPromo(true);
    } else {
      console.log('🔍 [LoginSSOButton] Sporran instalado pero rechazado, mostrando WalletDetection');
      setShowWalletDetection(true);
    }
  };



  // Observar cambios en el estado para detectar rechazos
  React.useEffect(() => {
    if (state === 'error' && error) {
      console.log('🔍 [LoginSSOButton] Error detectado:', error);
      
      if (error.includes('User rejected') || error.includes('cancelled') || error.includes('closed') || error.includes('Rejected')) {
        console.log('❌ [LoginSSOButton] Usuario rechazó la conexión, activando modales');
        handleSporranRejection();
      } else if (error.includes('FullDID') || error.includes('identidades completas')) {
        console.log('❌ [LoginSSOButton] Usuario no tiene FullDID, activando modales');
        // En lugar de activar VisitorConversionFlow directamente, 
        // vamos a mostrar WalletDetection para que el usuario pueda conectar Sporran
        handleSporranRejection();
      }
    }
  }, [state, error]);

  const handleSporranPromoContinue = () => {
    console.log('✅ [LoginSSOButton] Usuario continuó desde SporranPromo');
    setShowSporranPromo(false);
    setShowWalletDetection(true);
  };

  const handleSporranPromoClose = () => {
    console.log('❌ [LoginSSOButton] Usuario cerró SporranPromo');
    setShowSporranPromo(false);
  };

  const handleWalletDetectionClose = () => {
    console.log('❌ [LoginSSOButton] Usuario cerró WalletDetection');
    setShowWalletDetection(false);
  };

  const handleVisitorConversionClose = () => {
    console.log('❌ [LoginSSOButton] Usuario cerró VisitorConversionFlow');
    setShowVisitorConversion(false);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleConnect}
        disabled={!isReady || isConnecting || isConnected}
        className={`font-bold bg-primary text-primary-foreground rounded hover:bg-primary/90 transition px-4 py-2 ${className}`}
      >
        {buttonText}
      </button>
      
      {isConnecting && (
        <div className="text-xs text-muted-foreground max-w-xs text-center">
          <strong>Se abrirá una ventana de Sporran para autenticarte.</strong><br />
          <br />
          <strong>IMPORTANTE - Pasos a seguir:</strong><br />
          1. En la ventana de Sporran, selecciona una <strong>identidad completa (Full DID)</strong><br />
          2. <span className="text-red-600 font-semibold">NO selecciones una identidad Light</span><br />
          3. Ingresa tu contraseña si es necesario<br />
          4. Autoriza la conexión con esta aplicación<br />
          <br />
          <span className="text-yellow-600 font-semibold">No cierres esta página hasta terminar.</span><br />
          Si no ves la ventana, revisa si está minimizada o bloqueada por el navegador.<br />
          <br />
          <span className="text-blue-600 font-semibold">¿No puedes seleccionar ningún FullDID?</span><br />
          Si no puedes seleccionar una identidad completa (Full DID) o cierras la ventana de Sporran, se abrirá el flujo de onboarding para que puedas adquirir tu identidad digital y crear tu Full DID.<br />
          <br />
          <span className="text-blue-600 font-semibold">💡 Consejo:</span> Las identidades completas (Full DIDs) no contienen &quot;:light:&quot; en su dirección.
        </div>
      )}
      
      {state === "error" && error && (
        <div className="text-xs text-red-600 max-w-xs text-center whitespace-pre-line">
          {error}
          {error.includes('FullDID') && (
            <div className="mt-2">
              <button
                onClick={handleOnboardingClick}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                ¿No tienes FullDID? Ve al onboarding para crear tu identidad digital
              </button>
            </div>
          )}
        </div>
      )}
      
      {showOnboardingHint && (
        <div className="text-xs text-blue-600 max-w-xs text-center">
          <strong>¿No tienes FullDID?</strong><br />
          <button
            onClick={handleOnboardingClick}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Ve al onboarding para crear tu identidad digital
          </button>
        </div>
      )}

      {/* Modal SporranPromo */}
      {showSporranPromo && (
        <SporranPromo
          onContinue={handleSporranPromoContinue}
          onClose={handleSporranPromoClose}
        />
      )}

      {/* Modal WalletDetection */}
      {showWalletDetection && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-start justify-center p-4 overflow-y-auto">
          <div className="max-w-2xl w-full mx-auto my-4">
            <WalletDetection
              onWalletsDetected={(address) => {
                console.log('✅ [LoginSSOButton] Wallet detectada:', address);
                setShowWalletDetection(false);
                
                if (address) {
                  console.log('💰 [LoginSSOButton] Procediendo al flujo de pago con dirección:', address);
                  // Proceder al flujo de pago en lugar de intentar conectar
                  window.location.href = `/onboarding?address=${encodeURIComponent(address)}`;
                } else {
                  console.log('❌ [LoginSSOButton] No se recibió dirección de wallet');
                  // Si no hay dirección, intentar conectar nuevamente
                  handleConnect();
                }
              }}

              onSkipToOnboarding={() => {
                console.log('🚀 [LoginSSOButton] Saltando al onboarding desde WalletDetection');
                setShowWalletDetection(false);
                window.location.href = '/onboarding';
              }}
            />
            <button
              onClick={handleWalletDetectionClose}
              className="mt-4 w-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Modal VisitorConversionFlow */}
      {showVisitorConversion && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-start justify-center p-4 overflow-y-auto">
          <div className="max-w-2xl w-full mx-auto my-4">
            <VisitorConversionFlow />
            <button
              onClick={handleVisitorConversionClose}
              className="mt-4 w-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 