import * as Kilt from '@kiltprotocol/sdk-js';
import { resolver } from '@kiltprotocol/did';

const WS_ENDPOINT = 'wss://spiritnet.kilt.io';
const DID = 'did:kilt:4pCaJEa3oesmxtxff6sgiEgrY4ngqnE8FeTPkPesX7PnUzAv';

async function main() {
  await Kilt.connect(WS_ENDPOINT);
  const api = Kilt.ConfigService.get('api');

  // Ahora sí puedes hacer el query manual
  const didDetails = await api.call.did.query('4pCaJEa3oesmxtxff6sgiEgrY4ngqnE8FeTPkPesX7PnUzAv');
  console.log('Resultado de api.call.did.query:', didDetails.toHuman());

  // Y usar el resolver oficial
  try {
    const result = await resolver.resolve(DID);
    console.log('Resultado del resolver:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error al resolver el DID:', error);
  } finally {
    await api.disconnect();
  }
}

main();
