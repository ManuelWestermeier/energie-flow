import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Page } from '../components/Layout.jsx';
import { Logo, Spinner } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { user, loading, login, register } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const dest = loc.state?.from || '/dashboard';

  useEffect(() => {
    if (!loading && user) nav(dest, { replace: true });
  }, [user, loading, dest, nav]);

  const submit = async (kind) => {
    setErr('');
    setBusy(true);
    try {
      const payload = {
        username: username.trim().toLowerCase(),
        password,
        name: name.trim(),
      };

      if (kind === 'register') {
        await register(payload);
      } else {
        await login(payload.username, payload.password);
      }
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading || user) return <div className="wrap py-24"><Spinner /></div>;

  return (
    <Page>
      <div className="wrap py-14 sm:py-20 max-w-md">
        <div className="text-center mb-7"><Logo /></div>
        <div className="card p-7">
          <h1 className="text-2xl mb-1">Anmelden</h1>
          <p className="text-ink-soft text-sm mb-6">
            Benutzername und Passwort. Keine Google-Anmeldung, keine Tokens, keine Sessions.
          </p>

          <div className="grid grid-cols-2 gap-2 mb-5">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={mode === 'login' ? 'btn-primary !py-2.5' : 'btn-ghost !py-2.5'}>
              Login
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={mode === 'register' ? 'btn-primary !py-2.5' : 'btn-ghost !py-2.5'}>
              Registrierung
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <span className="label">Benutzername</span>
              <input
                className="input"
                value={username}
                autoComplete="username"
                spellCheck="false"
                onChange={(e) => setUsername(e.target.value)}
                placeholder="beispielname" />
            </div>
            {mode === 'register' && (
              <div>
                <span className="label">Name (optional)</span>
                <input
                  className="input"
                  value={name}
                  autoComplete="name"
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Vorname Nachname" />
              </div>
            )}
            <div>
              <span className="label">Passwort</span>
              <input
                className="input"
                type="password"
                value={password}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="mindestens 8 Zeichen" />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => submit('login')}
                className="btn-primary !py-3"
                disabled={busy}>
                {busy && mode === 'login' ? 'Anmelden …' : 'Anmelden'}
              </button>
              <button
                type="button"
                onClick={() => submit('register')}
                className="btn-ghost !py-3"
                disabled={busy}>
                {busy && mode === 'register' ? 'Registrieren …' : 'Registrieren'}
              </button>
            </div>

            <p className="text-[12px] text-ink-faint">
              Der angemeldete Benutzer wird lokal gespeichert. Der Server speichert nur den bcrypt-Hash.
            </p>
          </div>

          {err && <p className="mt-4 text-sm text-amber-deep">{err}</p>}
        </div>
      </div>
    </Page>
  );
}
