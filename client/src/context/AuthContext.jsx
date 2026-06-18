import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, getToken, setToken } from '../lib/api.js';
import { disconnectSocket } from '../lib/socket.js';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState({ google: false, dev: true });

  // Token, das Google im URL-Fragment zurückgibt (#token=...), übernehmen
  useEffect(() => {
    if (window.location.hash.startsWith('#token=')) {
      const t = decodeURIComponent(window.location.hash.slice(7));
      setToken(t);
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!getToken()) { setUser(null); setLoading(false); return; }
    try { setUser(await api.me()); }
    catch { setToken(null); setUser(null); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    api.authConfig().then(setConfig).catch(() => {});
    refresh();
  }, [refresh]);

  const loginDev = async (email, name) => {
    const { token } = await api.devLogin(email, name);
    setToken(token);
    await refresh();
  };
  const loginGoogle = () => { window.location.href = '/auth/google'; };
  const logout = () => { setToken(null); setUser(null); disconnectSocket(); };

  return (
    <AuthCtx.Provider value={{ user, loading, config, loginDev, loginGoogle, logout, refresh }}>
      {children}
    </AuthCtx.Provider>
  );
}
