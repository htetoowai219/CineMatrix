import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from "@nestjs/common";
import jwt from "jsonwebtoken";
import type { Request } from "express";
import type { AuthUser } from "../types/auth-user.type";

type DecodedToken = {
  userId: string;
  role: string;
  managedByOwnerId?: string;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthUser }>();

    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedException(
        "Access token missing or invalid authorization header.",
      );
    }

    const token = authHeader.split(" ")[1];
    const secret = process.env.ACCESS_TOKEN_SECRET;

    if (!secret) {
      console.error("ACCESS_TOKEN_SECRET is not configured.");
      throw new InternalServerErrorException("Internal server error.");
    }

    try {
      const decoded = jwt.verify(token, secret) as DecodedToken;
      request.user = {
        id: decoded.userId,
        role: decoded.role,
        managedByOwnerId: decoded.managedByOwnerId,
      };
      return true;
    } catch (error: any) {
      if (error?.name === "TokenExpiredError") {
        throw new UnauthorizedException("Access token expired.");
      }
      throw new ForbiddenException("Invalid access token.");
    }
  }
}
