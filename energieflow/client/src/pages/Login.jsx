import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Page } from '../components/Layout.jsx';
import { Logo, Spinner } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { LogIn, UserPlus, AtSign, KeyRound, User } from 'lucide-react';

export default function Login() {
  const { user, loading, login, register } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const dest = loc.state?.from || '/dashboard';
  useEffect(() => { if (!loading && user) nav(dest, { replace: true }); }, [user, loading, dest, nav]);

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      if (mode === 'register') await register(username.trim(), password, name.trim());
      else await login(username.trim(), password);
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  if (loading || user) return <div className="wrap py-24"><Spinner /></div>;
  const isReg = mode === 'register';

  return (
    <Page>
      <div className="wrap py-14 sm:py-20 max-w-md">
        <div className="text-center mb-7"><Logo /></div>
        <div className="card p-7">
          <h1 className="text-2xl mb-1">{isReg ? 'Konto erstellen' : 'Anmelden'}</h1>
          <p className="text-ink-soft text-sm mb-6">
            {isReg
              ? 'Lege ein Konto mit Benutzername und Passwort an.'
              : 'Melde dich mit Benutzername und Passwort an.'}
          </p>

          <form onSubmit={submit} className="space-y-3">
            {isReg && (
              <div>
                <span className="label">Anzeigename</span>
                <div className="relative">
                  <User className="h-4 w-4 text-ink-faint absolute left-3 top-1/2 -translate-y-1/2" />
                  <input className="input !pl-9" value={name} onChange={(e) => setName(e.target.value)} placeholder="Vorname Nachname" />
                </div>
              </div>
            )}
            <div>
              <span className="label">Benutzername</span>
              <div className="relative">
                <AtSign className="h-4 w-4 text-ink-faint absolute left-3 top-1/2 -translate-y-1/2" />
                <input className="input !pl-9" required value={username} autoComplete="username"
                       onChange={(e) => setUsername(e.target.value)} placeholder="z. B. justus" />
              </div>
            </div>
            <div>
              <span className="label">Passwort</span>
              <div className="relative">
                <KeyRound className="h-4 w-4 text-ink-faint absolute left-3 top-1/2 -translate-y-1/2" />
                <input className="input !pl-9" type="password" required value={password}
                       autoComplete={isReg ? 'new-password' : 'current-password'}
                       onChange={(e) => setPassword(e.target.value)} placeholder={isReg ? 'mind. 6 Zeichen' : 'Passwort'} />
              </div>
            </div>

            <button className="btn-primary w-full !py-3" disabled={busy}>
              {busy ? 'Bitte warten …' : isReg ? <>Konto erstellen <UserPlus className="h-4 w-4" /></> : <>Anmelden <LogIn className="h-4 w-4" /></>}
            </button>
          </form>

          {err && <p className="mt-4 text-sm text-amber-deep">{err}</p>}

          <div className="mt-6 pt-5 border-t border-line text-center text-sm text-ink-soft">
            {isReg ? 'Schon ein Konto?' : 'Noch kein Konto?'}{' '}
            <button onClick={() => { setErr(''); setMode(isReg ? 'login' : 'register'); }} className="link">
              {isReg ? 'Anmelden' : 'Jetzt registrieren'}
            </button>
          </div>
        </div>
        <p className="text-center text-[12px] text-ink-faint mt-4">
          Anmeldung über Benutzername und Passwort – ohne externe Dienste.
        </p>
      </div>
    </Page>
  );
}
