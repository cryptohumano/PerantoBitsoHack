import * as dotenv from 'dotenv';
import * as Kilt from '@kiltprotocol/sdk-js';
import { ApiPromise } from '@polkadot/api';
import type { KeyringPair } from '@kiltprotocol/types';
import { Crypto } from '@kiltprotocol/utils';

// Load environment variables from .env file
dotenv.config();

const PEREGRINE_ENDPOINT = process.env.PEREGRINE_ENDPOINT || 'wss://peregrine.kilt.io';
const PAYER_MNEMONIC = process.env.PEREGRINE_SECRET_PAYER_MNEMONIC;
const ASSERTION_MNEMONIC = process.env.SECRET_ASSERTION_METHOD_MNEMONIC;

const derivationPaths = [
  '', // Default (no path)
  '//0',
  '//1',
  '//hard/0',
  '//hard/1',
  '//0//0',
  '//0//1',
  '//sr25519',
  '//sr25519//0',
  '//sr25519//1',
  '//ed25519',
  '//ed25519//0',
  '//ed25519//1',
  '//did//0',
  '//did//1',
];

async function checkBalance(api: ApiPromise, address: string): Promise<string> {
  try {
    const accountInfo = await api.query.system.account(address);
    // @ts-ignore - Assuming Balance is available on Kilt despite linter error for older versions
    const balance = Kilt.Balance.fromChain(accountInfo.data.free);
    return balance.toHuman();
  } catch (error) {
    return `Error fetching balance: ${error instanceof Error ? error.message : String(error)}`;
  }
}

async function diagnoseAccount(api: ApiPromise, name: string, mnemonic: string) {
  console.log(`\n\n--- Diagnosing Mnemonic: ${name} ---`);
  console.log(`Mnemonic: "${mnemonic.substring(0, 15)}..."`);
  console.log('--------------------------------------------------');

  if (!mnemonic) {
    console.log('Mnemonic not found in .env file. Skipping.');
    return;
  }

  for (const path of derivationPaths) {
    try {
      const fullUri = `${mnemonic}${path}`;
      const keypair = Crypto.makeKeypairFromUri(fullUri, 'sr25519');
      const address = keypair.address;
      const balance = await checkBalance(api, address);

      console.log(`\n  Path: "${path || 'default'}"`);
      console.log(`    Address: ${address}`);
      console.log(`    Balance: ${balance}`);

    } catch (error) {
      console.log(`\n  Path: "${path}"`);
      console.log(`    Error deriving key: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

async function main() {
  console.log(`Connecting to ${PEREGRINE_ENDPOINT}...`);
  await Kilt.connect(PEREGRINE_ENDPOINT);
  const api = Kilt.ConfigService.get('api');

  try {
    if (PAYER_MNEMONIC) {
      await diagnoseAccount(api, 'PAYER', PAYER_MNEMONIC);
    } else {
      console.log('\n\n--- Skipping PAYER Mnemonic: Not found in .env ---');
    }

    if (ASSERTION_MNEMONIC) {
      await diagnoseAccount(api, 'ASSERTION', ASSERTION_MNEMONIC);
    } else {
      console.log('\n\n--- Skipping ASSERTION Mnemonic: Not found in .env ---');
    }
  } catch (error) {
    console.error('An unexpected error occurred:', error);
  } finally {
    await Kilt.disconnect();
    console.log('\nDisconnected from the node.');
  }
}

main(); 