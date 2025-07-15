declare global {
  interface Window {
    kilt?: {
      [key: string]: {
        name: string;
        version: string;
        specVersion: string;
        signWithDid: (plaintext: string) => Promise<{ signature: string; didKeyUri: string }>;
        signExtrinsicWithDid: (extrinsic: string, signer: string) => Promise<{ signed: string; didKeyUri: string }>;
        getSignedDidCreationExtrinsic: (submitter: string) => Promise<{ signedExtrinsic: string }>;
        startSession: (dAppName: string, dAppEncryptionKeyId: string, challenge: string) => Promise<unknown>;
      };
    };
  }
}

export {};
