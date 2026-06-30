import { UserRole } from '../generated/prisma/client';

export type AuthTokenPayload = {
  sub: number;
  email: string;
  fullName: string;
  role: UserRole;
};
