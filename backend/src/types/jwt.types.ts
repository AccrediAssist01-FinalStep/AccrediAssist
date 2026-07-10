import { UserRole } from '../database/enums';

export interface JwtPayload {
  id: string;
  email: string;
  role: UserRole;
}

export interface JwtSignOptions {
  expiresIn?: string;
}
