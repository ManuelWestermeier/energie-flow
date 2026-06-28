import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from './AuthContext.jsx';

const Ctx = createContext(null);
export const useProject = () => useContext(Ctx);

// Live-Aktualisierung ohne WebSocket: Die handelnde Person sieht ihre eigenen
// Änderungen sofort (jede Mutation liefert den vollständigen Projektzustand
// zurück). Änderungen anderer werden per kurzem Polling übernommen – und
// zusätzlich immer dann, wenn der Tab wieder in den Vordergrund kommt.
const POLL_MS = 7000;

export function ProjectProvider({ children }) {
  const { id } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try { setProject(await api.getProject(id)); }
    catch (e) { setError(e.message); }
  }, [id]);

  useEffect(() => {
    let alive = true;
    setLoading(true); setError(''); setProject(null);

    api.getProject(id)
      .then((p) => { if (alive) setProject(p); })
      .catch((e) => { if (alive) setError(e.message); })
      .finally(() => { if (alive) setLoading(false); });

    const sync = () => {
      if (document.visibilityState !== 'visible') return;
      api.getProject(id)
        .then((p) => { if (alive && p && p.id === id) setProject(p); })
        .catch(() => { /* stilles Polling */ });
    };
    const iv = setInterval(sync, POLL_MS);
    document.addEventListener('visibilitychange', sync);
    window.addEventListener('focus', sync);

    return () => {
      alive = false;
      clearInterval(iv);
      document.removeEventListener('visibilitychange', sync);
      window.removeEventListener('focus', sync);
    };
  }, [id]);

  const me = project ? (project.members || []).find((m) => m.userId === user?.id) : null;
  const value = {
    id, project, setProject, reload, loading, error, me,
    isAdmin: me?.role === 'admin',
    isOwner: me?.role === 'vermieter',
    canEdit: me?.role === 'admin' || me?.role === 'vermieter',
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
