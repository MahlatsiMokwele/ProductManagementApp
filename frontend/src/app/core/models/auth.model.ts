export type UserRole = "admin" | "employee";

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  name: string;
  surname: string;
  role: UserRole;
}

export interface AuthResponse {
  token: string;
  expiresAt: string;
  username: string;
  role: UserRole;
}

export interface AuthenticatedUser {
  username: string;
  role: UserRole;
  token: string;
  expiresAt: string;
}
