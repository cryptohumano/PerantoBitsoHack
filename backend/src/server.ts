import app from './app';
import { initializeDappDid, config, getDappEncryptionKeyUri } from './config';

const startServer = async () => {
  try {
    // Inicializar KILT y DID antes de iniciar el servidor
    await initializeDappDid();
    console.log('Valor final de dappEncryptionKeyUri:', getDappEncryptionKeyUri());
    
    app.listen(config.port, '0.0.0.0', () => {
      console.log(`🚀 Servidor corriendo en el puerto ${config.port}`);
      console.log(`🌍 Ambiente: ${config.nodeEnv}`);
      console.log(`🌐 Accesible desde: http://192.168.100.102:${config.port}`);
      console.log(`🏠 Local: http://localhost:${config.port}`);
    });
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

startServer(); 