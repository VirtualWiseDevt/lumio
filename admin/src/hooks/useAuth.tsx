import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { AdminUser } from "@/api/auth";
import * as authApi from "@/api/auth";

interface AuthState {
  user: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: localStorage.getItem("admin_token"),
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      setState((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    authApi
      .getProfile()
      .then((user) => {
        setState({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      })
      .catch(() => {
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_user");
        setState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { user, token } = await authApi.login(email, password);
    localStorage.setItem("admin_token", token);
    localStorage.setItem("admin_user", JSON.stringify(user));
    setState({
      user,
      token,
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      login,
      logout,
    }),
    [state, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
