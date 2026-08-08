import * as SecureStore from "expo-secure-store";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ApiError, loginRequest, logoutRequest, meRequest, type MobileUser } from "@/src/api";

const SESSION_KEY = "reklaio.mobile.session";

type AuthStatus = "loading" | "authenticated" | "anonymous";

type AuthContextValue = {
  status: AuthStatus;
  token: string | null;
  user: MobileUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<MobileUser | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function saveToken(token: string) {
  await SecureStore.setItemAsync(SESSION_KEY, token, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY
  });
}

async function clearToken() {
  await SecureStore.deleteItemAsync(SESSION_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<MobileUser | null>(null);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      try {
        const storedToken = await SecureStore.getItemAsync(SESSION_KEY);
        if (!storedToken) {
          if (active) setStatus("anonymous");
          return;
        }

        const response = await meRequest(storedToken);
        if (!active) return;
        setToken(storedToken);
        setUser(response.user);
        setStatus("authenticated");
      } catch {
        await clearToken().catch(() => undefined);
        if (!active) return;
        setToken(null);
        setUser(null);
        setStatus("anonymous");
      }
    }

    void restoreSession();
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await loginRequest(email, password);
    await saveToken(response.token);
    setToken(response.token);
    setUser(response.user);
    setStatus("authenticated");
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) return null;
    const response = await meRequest(token);
    setUser(response.user);
    return response.user;
  }, [token]);

  const logout = useCallback(async () => {
    const currentToken = token;
    setToken(null);
    setUser(null);
    setStatus("anonymous");
    await clearToken().catch(() => undefined);

    if (currentToken) {
      await logoutRequest(currentToken).catch((error) => {
        if (!(error instanceof ApiError && error.status === 401)) throw error;
      });
    }
  }, [token]);

  const value = useMemo<AuthContextValue>(
    () => ({ status, token, user, login, logout, refreshUser }),
    [status, token, user, login, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
