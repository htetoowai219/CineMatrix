import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

type DecodedToken = {
  userId: string;
  role: string;
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
    };

    return next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Access token expired." });
    }
    return res.status(403).json({ message: "Invalid access token." });
  }
};
