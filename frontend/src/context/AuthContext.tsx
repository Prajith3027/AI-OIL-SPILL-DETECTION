import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authApi } from "../services/authApi";
import { tokenStore, SESSION_EXPIRED_EVENT } from "../services/http";
import type { User, UserRole } from "../types/auth";

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(tokenStore.get());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = useCallback(() => {
    tokenStore.clear();
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    const handleExpired = () => {
      logout();
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, handleExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleExpired);
  }, [logout]);

  useEffect(() => {
    let isMounted = true;
    async function initUser() {
      const storedToken = tokenStore.get();
      if (!storedToken) {
        setIsLoading(false);
        return;
      }
      try {
        const me = await authApi.me();
        if (isMounted) {
          setUser(me);
          setToken(storedToken);
        }
      } catch (err) {
        tokenStore.clear();
        if (isMounted) {
          setUser(null);
          setToken(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    initUser();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email: string, password: string, role: UserRole): Promise<User> => {
    const res = await authApi.login({ email, password, role });
    tokenStore.set(res.access_token);
    setToken(res.access_token);
    setUser(res.user);
    return res.user;
  };

  const register = async (name: string, email: string, password: string): Promise<User> => {
    const createdUser = await authApi.register({ name, email, password });
    return createdUser;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role ?? null,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
