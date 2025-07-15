import { Crypto } from '@kiltprotocol/utils';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import dotenv from 'dotenv';

dotenv.config();

export async function getAssertionKey() {
  await cryptoWaitReady();
  const mnemonic = process.env.DAPP_ACCOUNT_MNEMONIC as string;
  if (!mnemonic) throw new Error('Falta DAPP_ACCOUNT_MNEMONIC en el .env');
  const seed = Crypto.mnemonicToMiniSecret(mnemonic);
  const baseKey = Crypto.makeKeypairFromSeed(seed, 'sr25519');
  return baseKey.derive('//did//attestation//0');
}

export async function signWithAssertionKey(data: Uint8Array): Promise<Uint8Array> {
  const assertionKey = await getAssertionKey();
  return assertionKey.sign(data);
} 