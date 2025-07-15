"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, XCircle, AlertCircle, Download, ArrowRight, Info } from 'lucide-react';

interface WalletDetectionProps {
  onWalletsDetected: (address?: string) => void;
  onSkipToOnboarding?: () => void; // Nueva prop para saltar al onboarding
}

interface WalletStatus {
  name: string;
  installed: boolean;
  connected: boolean;
  hasFullDid?: boolean;
  address?: string;
  accounts?: Array<{
    address: string;
    name?: string;
    type?: string;
  }>;
  selectedAccountIndex?: number;
}

export const WalletDetection: React.FC<WalletDetectionProps> = ({
  onWalletsDetected,
  onSkipToOnboarding,
}) => {
  console.log('🔄 [WalletDetection] Renderizando modal de detección de wallets');
  
  const [wallets, setWallets] = useState<WalletStatus[]>([
    { name: 'Sporran', installed: false, connected: false },
    { name: 'Polkadot.js', installed: false, connected: false },
  ]);
  const [loading, setLoading] = useState(true);
  const [hasFullDid, setHasFullDid] = useState(false);
  const [showOnboardingOption, setShowOnboardingOption] = useState(false);

  useEffect(() => {
    detectWallets();
  }, []);

  const detectWallets = async () => {
    console.log('🔍 [WalletDetection] Detectando wallets...');
    setLoading(true);
    
    const detectedWallets = [...wallets];
    let detectedKiltAddress: string | undefined = undefined;

    // Detectar Sporran
    try {
      const sporran = (window as unknown as { kilt?: { sporran?: { 
        getAccounts?: () => Promise<Array<{ address: string; name?: string }>>;
        getDids?: () => Promise<Array<{ did?: string }>>;
      } } }).kilt?.sporran;
      if (sporran) {
        console.log('✅ [WalletDetection] Sporran detectado');
        detectedWallets[0].installed = true;
        
        // Intentar conectar usando Polkadot Extension DApp
        try {
          // Obtener todas las cuentas disponibles
          const { web3Enable, web3Accounts } = await import('@polkadot/extension-dapp');
          await web3Enable('peranto-cigo');
          const accounts = await web3Accounts();
          
          if (accounts && accounts.length > 0) {
            console.log('✅ [WalletDetection] Cuentas encontradas:', accounts.length);
            
            // Convertir cuentas a formato KILT
            const kiltAccounts = [];
            for (const account of accounts) {
              try {
                const { encodeAddress } = await import('@polkadot/util-crypto');
                const kiltAddress = encodeAddress(account.address, 38);
                kiltAccounts.push({
                  address: kiltAddress,
                  name: account.meta?.name || 'Cuenta sin nombre',
                  type: account.type
                });
              } catch (error) {
                console.log('⚠️ [WalletDetection] Error convirtiendo cuenta:', account.address, error);
              }
            }
            
            if (kiltAccounts.length > 0) {
              detectedWallets[0].connected = true;
              detectedWallets[0].accounts = kiltAccounts;
              detectedWallets[0].selectedAccountIndex = 0; // Seleccionar la primera por defecto
              detectedWallets[0].address = kiltAccounts[0].address;
              detectedKiltAddress = kiltAccounts[0].address;
              
              console.log('✅ [WalletDetection] Sporran conectado con cuentas KILT:', kiltAccounts.length);
              
              // Verificar si tiene FullDID
              if (sporran.getDids) {
                const dids = await sporran.getDids();
                const hasFullDid = dids.some((did: { did?: string }) => did.did && did.did.includes('Full'));
                detectedWallets[0].hasFullDid = hasFullDid;
                setHasFullDid(hasFullDid);
                console.log('🔍 [WalletDetection] FullDID detectado:', hasFullDid);
              }
            }
          }
        } catch (error) {
          console.log('❌ [WalletDetection] Sporran no conectado:', error);
        }
      } else {
        console.log('❌ [WalletDetection] Sporran no detectado');
      }
    } catch (error) {
      console.log('❌ [WalletDetection] Error detectando Sporran:', error);
    }

    // Detectar Polkadot.js
    try {
      const polkadot = (window as unknown as { injectedWeb3?: { 'polkadot-js'?: { accounts?: { get?: () => Promise<Array<{ address: string }>> } } } }).injectedWeb3?.['polkadot-js'];
      if (polkadot) {
        console.log('✅ [WalletDetection] Polkadot.js detectado');
        detectedWallets[1].installed = true;
        
        try {
          if (polkadot.accounts?.get) {
            const accounts = await polkadot.accounts.get();
            if (accounts && accounts.length > 0) {
              console.log('✅ [WalletDetection] Polkadot.js conectado con cuentas:', accounts.length);
              detectedWallets[1].connected = true;
              detectedWallets[1].address = accounts[0].address;
            }
          }
        } catch (error) {
          console.log('❌ [WalletDetection] Polkadot.js no conectado:', error);
        }
      } else {
        console.log('❌ [WalletDetection] Polkadot.js no detectado');
      }
    } catch (error) {
      console.log('❌ [WalletDetection] Error detectando Polkadot.js:', error);
    }

    setWallets(detectedWallets);
    setLoading(false);

    // Determinar si mostrar opción de onboarding
    const hasSporran = detectedWallets[0].installed;
    const hasConnectedWallet = detectedWallets.some(w => w.connected);
    const shouldShowOnboarding = !hasSporran || !hasConnectedWallet || !hasFullDid;
    
    console.log('📊 [WalletDetection] Estado de wallets:', {
      hasSporran,
      hasConnectedWallet,
      hasFullDid,
      shouldShowOnboarding
    });

    setShowOnboardingOption(shouldShowOnboarding);

    // Si tiene FullDID y dirección, proceder automáticamente
    if (hasFullDid && detectedKiltAddress) {
      console.log('✅ [WalletDetection] FullDID detectado, procediendo automáticamente');
      onWalletsDetected(detectedKiltAddress);
    }
  };

  const connectWallet = async (walletIndex: number) => {
    console.log('🔌 [WalletDetection] Conectando wallet:', wallets[walletIndex].name);
    try {
      const wallet = wallets[walletIndex];
      
      if (wallet.name === 'Sporran') {
        console.log('🔍 [WalletDetection] Intentando obtener cuentas usando Polkadot Extension DApp...');
        
        try {
          // Obtener todas las cuentas disponibles
          const { web3Enable, web3Accounts } = await import('@polkadot/extension-dapp');
          await web3Enable('peranto-cigo');
          const accounts = await web3Accounts();
          
          if (accounts && accounts.length > 0) {
            console.log('✅ [WalletDetection] Cuentas encontradas:', accounts.length);
            
            // Convertir cuentas a formato KILT
            const kiltAccounts = [];
            for (const account of accounts) {
              try {
                const { encodeAddress } = await import('@polkadot/util-crypto');
                const kiltAddress = encodeAddress(account.address, 38);
                kiltAccounts.push({
                  address: kiltAddress,
                  name: account.meta?.name || 'Cuenta sin nombre',
                  type: account.type
                });
              } catch (error) {
                console.log('⚠️ [WalletDetection] Error convirtiendo cuenta:', account.address, error);
              }
            }
            
            if (kiltAccounts.length > 0) {
              // Actualizar el estado de la wallet
              const updatedWallets = [...wallets];
              updatedWallets[walletIndex].connected = true;
              updatedWallets[walletIndex].accounts = kiltAccounts;
              updatedWallets[walletIndex].selectedAccountIndex = 0; // Seleccionar la primera por defecto
              updatedWallets[walletIndex].address = kiltAccounts[0].address;
              setWallets(updatedWallets);
              
              console.log('✅ [WalletDetection] Cuentas KILT obtenidas exitosamente:', kiltAccounts.length);
              
              // Verificar si tiene FullDID usando Sporran
              try {
                const sporran = (window as unknown as { kilt?: { sporran?: { 
                  getDids?: () => Promise<Array<{ did?: string }>>;
                } } }).kilt?.sporran;
                
                if (sporran?.getDids) {
                  const dids = await sporran.getDids();
                  const hasFullDid = dids.some((did: { did?: string }) => did.did && did.did.includes('Full'));
                  updatedWallets[walletIndex].hasFullDid = hasFullDid;
                  setHasFullDid(hasFullDid);
                  console.log('🔍 [WalletDetection] FullDID detectado:', hasFullDid);
                }
              } catch (didError) {
                console.log('ℹ️ [WalletDetection] No se pudo verificar FullDID:', didError);
              }
            } else {
              console.log('⚠️ [WalletDetection] No se pudo convertir cuentas a formato KILT');
              alert('No se pudo convertir cuentas a formato KILT. Verifica tu wallet.');
            }
          } else {
            console.log('⚠️ [WalletDetection] No se encontraron cuentas');
            alert('No se encontraron cuentas en tu wallet. Por favor, crea una cuenta y vuelve a intentar.');
          }
        } catch (error) {
          console.error('❌ [WalletDetection] Error obteniendo cuentas KILT:', error);
          alert(`Error obteniendo cuentas KILT: ${error}`);
        }
      } else if (wallet.name === 'Polkadot.js') {
        const polkadot = (window as unknown as { injectedWeb3?: { 'polkadot-js'?: { accounts?: { subscribe?: () => Promise<void> } } } }).injectedWeb3?.['polkadot-js'];
        if (polkadot && polkadot.accounts?.subscribe) {
          await polkadot.accounts.subscribe();
          await detectWallets();
        }
      }
    } catch (error) {
      console.error(`❌ [WalletDetection] Error conectando ${wallets[walletIndex].name}:`, error);
      alert(`Error conectando ${wallets[walletIndex].name}: ${error}`);
    }
  };

  const installSporran = () => {
    console.log('📥 [WalletDetection] Abriendo página de descarga de Sporran');
    window.open('https://www.sporran.org/', '_blank');
  };

  const handleSkipToOnboarding = () => {
    console.log('🚀 [WalletDetection] Saltando al onboarding');
    if (onSkipToOnboarding) {
      onSkipToOnboarding();
    }
  };

  const handleAccountChange = (walletIndex: number, accountIndex: string) => {
    console.log('🔄 [WalletDetection] Cambiando cuenta:', accountIndex);
    const updatedWallets = [...wallets];
    const selectedIndex = parseInt(accountIndex);
    
    if (updatedWallets[walletIndex].accounts && updatedWallets[walletIndex].accounts[selectedIndex]) {
      updatedWallets[walletIndex].selectedAccountIndex = selectedIndex;
      updatedWallets[walletIndex].address = updatedWallets[walletIndex].accounts[selectedIndex].address;
      setWallets(updatedWallets);
      console.log('✅ [WalletDetection] Cuenta seleccionada:', updatedWallets[walletIndex].address);
    }
  };

  const handleContinue = async () => {
    console.log('🚀 [WalletDetection] Procesando continuar con cuenta seleccionada');
    
    // Buscar la wallet conectada con cuenta seleccionada
    const connectedWallet = wallets.find(w => w.connected && w.address);
    
    if (connectedWallet && connectedWallet.address) {
      console.log('✅ [WalletDetection] Wallet conectada encontrada:', connectedWallet.address);
      
      // Si tiene FullDID, proceder directamente
      if (connectedWallet.hasFullDid) {
        console.log('✅ [WalletDetection] FullDID detectado, procediendo directamente');
        onWalletsDetected(connectedWallet.address);
        return;
      }
      
      // Si no tiene FullDID, proceder al pago
      console.log('💰 [WalletDetection] Sin FullDID, procediendo al pago');
      onWalletsDetected(connectedWallet.address);
    } else {
      console.log('❌ [WalletDetection] No hay wallet conectada con cuenta seleccionada');
      alert('Por favor, selecciona una cuenta antes de continuar');
    }
  };

  const getWalletStatusIcon = (wallet: WalletStatus) => {
    if (!wallet.installed) {
      return <XCircle className="w-5 h-5 text-red-500" />;
    }
    if (wallet.connected) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    return <AlertCircle className="w-5 h-5 text-yellow-500" />;
  };

  const getWalletStatusText = (wallet: WalletStatus) => {
    if (!wallet.installed) {
      return 'No instalado';
    }
    if (wallet.connected) {
      return wallet.hasFullDid ? 'Conectado (FullDID)' : 'Conectado';
    }
    return 'No conectado';
  };

  if (loading) {
    console.log('⏳ [WalletDetection] Mostrando estado de carga');
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2">Detectando wallets...</p>
        </div>
      </div>
    );
  }

  console.log('🔄 [WalletDetection] Estado actual:', {
    hasFullDid,
    showOnboardingOption,
    wallets: wallets.map(w => ({ name: w.name, installed: w.installed, connected: w.connected, hasFullDid: w.hasFullDid }))
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            Configuración de Wallet
          </CardTitle>
          <CardDescription>
            Para usar peranto Ci.Go necesitas una wallet compatible con KILT
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {wallets.map((wallet, index) => (
              <div key={wallet.name} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {getWalletStatusIcon(wallet)}
                  <div>
                    <h3 className="font-medium">{wallet.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {getWalletStatusText(wallet)}
                    </p>
                    {wallet.address && (
                      <p className="text-xs text-muted-foreground font-mono">
                        {wallet.address.slice(0, 10)}...{wallet.address.slice(-8)}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {wallet.hasFullDid && (
                    <Badge variant="secondary">FullDID</Badge>
                  )}
                  
                  {!wallet.installed ? (
                    wallet.name === 'Sporran' ? (
                      <Button onClick={installSporran} size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Instalar
                      </Button>
                    ) : (
                      <Button disabled size="sm">
                        Instalar manualmente
                      </Button>
                    )
                  ) : !wallet.connected ? (
                    <Button onClick={() => connectWallet(index)} size="sm">
                      Conectar
                    </Button>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">Conectado</Badge>
                      
                      {/* Dropdown para seleccionar cuenta */}
                      {wallet.accounts && wallet.accounts.length > 1 && (
                        <Select
                          value={wallet.selectedAccountIndex?.toString() || "0"}
                          onValueChange={(value) => handleAccountChange(index, value)}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Seleccionar cuenta" />
                          </SelectTrigger>
                          <SelectContent>
                            {wallet.accounts.map((account, accountIndex) => (
                              <SelectItem key={accountIndex} value={accountIndex.toString()}>
                                {account.name || `Cuenta ${accountIndex + 1}`}
                                <span className="text-xs text-muted-foreground ml-2">
                                  ({account.address.slice(0, 8)}...{account.address.slice(-6)})
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {hasFullDid ? (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            ¡Excelente! Ya tienes un FullDID. Puedes proceder directamente al dashboard.
          </AlertDescription>
        </Alert>
      ) : showOnboardingOption ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No se detectó un FullDID. Necesitarás realizar un pago para obtener tu identidad digital.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="flex justify-center gap-4">
        {showOnboardingOption && (
          <Button 
            onClick={handleSkipToOnboarding}
            variant="outline"
            className="px-6"
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            Ir al Onboarding
          </Button>
        )}
        
        <Button 
          onClick={handleContinue}
          disabled={!wallets.some(w => w.installed && w.connected)}
          className="px-8"
        >
          Continuar
        </Button>
      </div>
    </div>
  );
}; 