import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { User } from '../types/api';
import { authApi } from '../api/auth';
import { setTokenGetter, setOnUnauthorized } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('wms_token'));
  const [loading, setLoading] = useState(true);

  // Register token getter for api client
  useEffect(() => {
    setTokenGetter(() => token);
    setOnUnauthorized(() => {
      setToken(null);
      setUser(null);
      localStorage.removeItem('wms_token');
      localStorage.removeItem('wms_user');
    });
  }, [token]);

  // Restore session on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('wms_token');
    const savedUser = localStorage.getItem('wms_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      try { setUser(JSON.parse(savedUser)); } catch { /* ignore */ }
      // Verify token is still valid
      authApi.me().then((u) => {
        setUser(u);
        localStorage.setItem('wms_user', JSON.stringify(u));
      }).catch(() => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('wms_token');
        localStorage.removeItem('wms_user');
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await authApi.login(email, password);
    setToken(result.accessToken);
    setUser(result.user);
    localStorage.setItem('wms_token', result.accessToken);
    localStorage.setItem('wms_user', JSON.stringify(result.user));
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('wms_token');
    localStorage.removeItem('wms_user');
    authApi.logout().catch(() => {});
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
