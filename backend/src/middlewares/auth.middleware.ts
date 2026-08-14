import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserRole } from "../types/user.type";

type DecodedToken = {
  userId: string;
  role: string;
  managedByOwnerId?: string;
};

export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized access." });
    }
    if (!roles.includes(req.user.role as UserRole)) {
      return res
        .status(403)
        .json({ message: "Access denied. Insufficient permissions." });
    }
    return next();
  };
};

export const verifyAccessToken = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Access token missing or invalid authorization header.",
      });
    }

    const token = authHeader.split(" ")[1];
    const secret = process.env.ACCESS_TOKEN_SECRET;

    if (!secret) {
      console.error("ACCESS_TOKEN_SECRET is not configured.");
      return res.status(500).json({ message: "Internal server error." });
    }

    // Verify token
    const decoded = jwt.verify(token, secret) as DecodedToken;

    // Attach user payload to request
    req.user = {
      id: decoded.userId,
      role: decoded.role,
      managedByOwnerId: decoded.managedByOwnerId,
    };

    return next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Access token expired." });
    }
    return res.status(403).json({ message: "Invalid access token." });
  }
};

// Same as `verifyAccessToken`, but never rejects the request: when a valid
// token is present `req.user` is populated, otherwise the request continues
// anonymously. Used on public routes that must still let owners/admins see
// their own non-active records (e.g. a pending cinema).
export const verifyOptionalAccessToken = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) return next();

    const token = authHeader.split(" ")[1];
    const secret = process.env.ACCESS_TOKEN_SECRET;

    if (!secret) {
      console.error("ACCESS_TOKEN_SECRET is not configured.");
      return next();
    }

    const decoded = jwt.verify(token, secret) as DecodedToken;
    req.user = {
      id: decoded.userId,
      role: decoded.role,
      managedByOwnerId: decoded.managedByOwnerId,
    };
    return next();
  } catch {
    return next();
  }
};
