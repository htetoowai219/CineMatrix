import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import jwt from "jsonwebtoken";
import type { Request } from "express";
import type { AuthUser } from "../types/auth-user.type";

type DecodedToken = {
  userId: string;
  role: string;
  managedByOwnerId?: string;
};

/**
 * Never rejects the request: populates req.user when a valid token is present,
 * otherwise continues anonymously. Mirrors the Express `verifyOptionalAccessToken`.
 */
@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthUser }>();

    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) return true;

    const token = authHeader.split(" ")[1];
    const secret = process.env.ACCESS_TOKEN_SECRET;
    if (!secret) {
      console.error("ACCESS_TOKEN_SECRET is not configured.");
      return true;
    }

    try {
      const decoded = jwt.verify(token, secret) as DecodedToken;
      request.user = {
        id: decoded.userId,
        role: decoded.role,
        managedByOwnerId: decoded.managedByOwnerId,
      };
    } catch {
      // Invalid/expired token on a public route is treated as anonymous.
    }
    return true;
  }
}
