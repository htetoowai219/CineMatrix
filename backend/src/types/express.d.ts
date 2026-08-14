import { JwtPayload } from "jsonwebtoken";

export interface AuthUser {
  id: string;
  role: string;
  managedByOwnerId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
