import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, tokenStore, setUnauthorizedHandler } from '../services/api';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(tokenStore.get()));

  const logout = useCallback(() => {
    tokenStore.clear(); // logout = remove the token from the client
    setUser(null);
  }, []);

  // Token expiry handling: any protected request that returns 401 -> back to login
  useEffect(() => {
    setUnauthorizedHandler(() => {
      tokenStore.clear();
      setUser(null);
      toast.info('Your session expired. Please log in again.');
      navigate('/login', { replace: true });
    });
  }, [navigate, toast]);

  // Restore session on page load using GET /api/auth/me
  useEffect(() => {
    if (!tokenStore.get()) { setLoading(false); return; }
    api('/auth/me', { silent: true })
      .then((d) => setUser(d.user))
      .catch(() => { tokenStore.clear(); setUser(null); })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await api('/auth/login', { method: 'POST', body: { email, password } });
    tokenStore.set(data.token);
    setUser(data.user);
  }, []);

  const register = useCallback(
    (name, email, password) => api('/auth/register', { method: 'POST', body: { name, email, password } }),
    []
  );

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
