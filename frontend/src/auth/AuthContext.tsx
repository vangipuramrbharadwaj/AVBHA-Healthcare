import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import * as authApi from "../api/auth.api";
import { ApiClientError } from "../types/api";
import type { AuthUser, LoginResponse, SessionState } from "../types/auth";
import { clearSession, loadSession, saveSession } from "../utils/storage";

interface AuthContextValue {
  user: AuthUser | null;
  authenticated: boolean;
  initializing: boolean;
  login(input: authApi.LoginInput): Promise<LoginResponse>;
  logout(): Promise<void>;
  reloadProfile(): Promise<AuthUser>;
  can(permission: string): boolean;
  canAny(...permissions: string[]): boolean;
  hasRole(role: string): boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const initial = loadSession();
  const [session, setSession] = useState<SessionState | null>(initial);
  const [initializing, setInitializing] = useState(Boolean(initial));

  const endSession = useCallback(() => {
    clearSession();
    setSession(null);
  }, []);

  useEffect(() => {
    const onExpired = () => endSession();
    window.addEventListener("avbha:session-expired", onExpired);
    return () => window.removeEventListener("avbha:session-expired", onExpired);
  }, [endSession]);

  useEffect(() => {
    if (!initial) return;

    let active = true;
    authApi
      .me()
      .then((user) => {
        if (!active) return;
        const current = loadSession();
        if (!current) return;
        const next = { ...current, user };
        saveSession(next);
        setSession(next);
      })
      .catch(() => {
        if (active) endSession();
      })
      .finally(() => {
        if (active) setInitializing(false);
      });

    return () => {
      active = false;
    };
  }, []); // intentional one-time validation

  const login = useCallback(async (input: authApi.LoginInput) => {
    const result = await authApi.login(input);
    const next: SessionState = {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
    };
    saveSession(next);
    setSession(next);
    return result;
  }, []);

  const logout = useCallback(async () => {
    try {
      if (loadSession()) await authApi.logout();
    } catch (error) {
      if (!(error instanceof ApiClientError && error.status === 401)) {
        console.error("Logout request failed", error);
      }
    } finally {
      endSession();
    }
  }, [endSession]);

  const reloadProfile = useCallback(async () => {
    const user = await authApi.me();
    const current = loadSession();
    if (!current) throw new Error("No active session");
    const next = { ...current, user };
    saveSession(next);
    setSession(next);
    return user;
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const user = session?.user ?? null;
    const superAdmin = user?.roles.includes("SUPER_ADMIN") ?? false;
    return {
      user,
      authenticated: Boolean(session),
      initializing,
      login,
      logout,
      reloadProfile,
      can: (permission) => superAdmin || Boolean(user?.permissions.includes(permission)),
      canAny: (...permissions) =>
        superAdmin || permissions.some((permission) => user?.permissions.includes(permission)),
      hasRole: (role) => Boolean(user?.roles.includes(role)),
    };
  }, [session, initializing, login, logout, reloadProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
