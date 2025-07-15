import { Role } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        did: string;
        roles: Role[];
        primaryRole: Role;
      };
    }
  }
}

export {}; 