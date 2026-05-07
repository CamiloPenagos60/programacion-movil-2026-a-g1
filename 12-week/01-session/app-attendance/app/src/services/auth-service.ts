import { ApiClient } from "./api";
import type { AuthUser } from "../context/AuthContext";

export interface LoginCredentials {
  documento: string;
  password: string;
}

export interface AuthResponse {
  data: {
    token: string;
    person: AuthUser;
  };
}

class AuthService {
  /**
   * Performs login against the given backendUrl.
   * Returns the raw API response (token + person).
   * Callers are responsible for persisting to AuthContext.
   */
  async login(credentials: LoginCredentials, backendUrl: string): Promise<AuthResponse> {
    const client = new ApiClient(backendUrl);
    return client.loginRequest(credentials) as Promise<AuthResponse>;
  }
}

export const authService = new AuthService();
