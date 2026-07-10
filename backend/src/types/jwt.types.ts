import { UserRole } from '../models/base.model';

export interface JwtPayload {
  id: string;
  email: string;
  role: UserRole;
}

export interface JwtSignOptions {
  expiresIn?: string;
}
