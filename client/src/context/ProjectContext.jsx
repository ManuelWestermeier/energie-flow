import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { getSocket } from '../lib/socket.js';
import { useAuth } from './AuthContext.jsx';

const Ctx = createContext(null);
export const useProject = () => useContext(Ctx);

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
    const s = getSocket();
    const onUpdate = (p) => { if (p && p.id === id) setProject(p); };
    if (s) { s.emit('project:join', id); s.on('project:update', onUpdate); }
    return () => { alive = false; if (s) { s.emit('project:leave', id); s.off('project:update', onUpdate); } };
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
