export interface User {
  name: string;
  email: string;
  phone: string;
  profileImageUrl?: string;
}

export interface AuthResponse {
  message: string;
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phone: string;
  profileImage?: File;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface UpdateProfilePayload {
  name?: string;
  phone?: string;
  profileImage?: File;
}

export interface UpdatePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface MessageResponse {
  message: string;
}

export interface UpdateProfileResponse {
  message: string;
  user: User;
}
