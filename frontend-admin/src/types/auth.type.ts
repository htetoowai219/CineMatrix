export type UserRole = "customer" | "cinema_owner" | "admin";

export interface User {
  name: string;
  email: string;
  phone: string;
}

export interface AuthResponse {
  message: string;
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface JwtPayload {
  userId: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface MessageResponse {
  message: string;
}
