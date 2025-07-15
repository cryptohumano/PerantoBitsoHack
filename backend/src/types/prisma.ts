import { Role } from '@prisma/client';

export interface CType {
  id: string;
  hash: string;
  title: string;
  schema: any;
  network: string;
  createdAt: Date;
  claims: Claim[];
  attesters: User[];
  attestations: Attestation[];
}

export interface Claim {
  id: string;
  ctypeId: string;
  data: any;
  owner: string;
  createdAt: Date;
  ctype: CType;
  attestations: Attestation[];
  ownerUser: User;
}

export interface Attestation {
  id: string;
  claimId: string;
  attester: User;
  attesterId: string;
  ctype: CType;
  ctypeId: string;
  claim: Claim;
  revoked: boolean;
  createdAt: Date;
}

export interface User {
  id: string;
  did: string;
  role: Role;
  attesterForCtypes: CType[];
  createdAt: Date;
  claims: Claim[];
  attestations: Attestation[];
} 