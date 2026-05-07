import { createContext, useContext, useEffect, useState } from "react";
import { clearAuthToken, getAuthToken, getAuthUser, saveAuthToken, saveAuthUser } from "../services/preferences";
import type { AuthUser } from "../types/domain";

export type { AuthUser };

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: AuthUser, token: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from Preferences on mount
  useEffect(() => {
    void (async () => {
      const token = await getAuthToken();
      const savedUser = await getAuthUser();
      if (token && savedUser) {
        setUser(savedUser as AuthUser);
      }
      setIsLoading(false);
    })();
  }, []);

  async function login(nextUser: AuthUser, token: string): Promise<void> {
    await saveAuthToken(token);
    await saveAuthUser(nextUser);
    setUser(nextUser);
  }

  async function logout(): Promise<void> {
    await clearAuthToken();
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isLoading,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  }
  return ctx;
}
