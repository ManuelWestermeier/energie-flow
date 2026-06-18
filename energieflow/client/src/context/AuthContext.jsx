import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, setCredentials, clearCredentials, hasCredentials } from '../lib/api.js';
import { disconnectSocket } from '../lib/socket.js';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!hasCredentials()) { setUser(null); setLoading(false); return; }
    try { setUser(await api.me()); }
    catch { clearCredentials(); setUser(null); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // Anmeldung: Zugangsdaten merken und serverseitig prüfen.
  const login = async (username, password) => {
    setCredentials(username, password);
    try {
      const u = await api.login();
      setUser(u);
      return u;
    } catch (e) {
      clearCredentials();
      throw e;
    }
  };

  // Registrierung: Konto anlegen, dann direkt anmelden.
  const register = async (username, password, name) => {
    await api.register(username, password, name);
    return login(username, password);
  };

  const logout = () => { clearCredentials(); setUser(null); disconnectSocket(); };

  return (
    <AuthCtx.Provider value={{ user, loading, login, register, logout, refresh }}>
      {children}
    </AuthCtx.Provider>
  );
}
