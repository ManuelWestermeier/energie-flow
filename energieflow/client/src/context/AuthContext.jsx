import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, clearCredentials, getCredentials, setCredentials } from '../lib/api.js';
import { disconnectSocket } from '../lib/socket.js';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const credentials = getCredentials();
    if (!credentials) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      setUser(await api.me());
    } catch {
      clearCredentials();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = async (username, password) => {
    const { user } = await api.login(username, password);
    setCredentials({ username, password });
    setUser(user);
  };

  const register = async ({ username, password, name, email }) => {
    const { user } = await api.register({ username, password, name, email });
    setCredentials({ username, password });
    setUser(user);
  };

  const logout = () => {
    clearCredentials();
    setUser(null);
    disconnectSocket();
  };

  return (
    <AuthCtx.Provider value={{ user, loading, login, register, logout, refresh }}>
      {children}
    </AuthCtx.Provider>
  );
}
