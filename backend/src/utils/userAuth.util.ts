import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { UserRole } from "../types/user.type";

// Hash plain text password
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// Compare candidate password with stored hash
export const verifyPassword = async (
  plainPassword: string,
  hashedPassword: string,
): Promise<boolean> => {
  return bcrypt.compare(plainPassword, hashedPassword);
};

// Generate Access Token
export const generateAccessToken = (
  userId: string,
  role: UserRole,
  managedByOwnerId?: string,
): string => {
  const secret = process.env.ACCESS_TOKEN_SECRET;
  const expiresIn = (process.env.ACCESS_TOKEN_EXP ||
    "1d") as SignOptions["expiresIn"];

  return jwt.sign({ userId, role, managedByOwnerId }, secret!, { expiresIn });
};

// Generate Refresh Token
export const generateRefreshToken = (userId: string): string => {
  const secret = process.env.REFRESH_TOKEN_SECRET;
  const expiresIn = (process.env.REFRESH_TOKEN_EXP ||
    "7d") as SignOptions["expiresIn"];

  return jwt.sign({ userId }, secret!, { expiresIn });
};
