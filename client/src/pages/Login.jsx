import { useEffect, useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Page } from '../components/Layout.jsx';
import { Logo, Spinner } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { user, loading, config, loginDev, loginGoogle } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [params] = useSearchParams();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(params.get('error') ? 'Anmeldung fehlgeschlagen. Bitte erneut versuchen.' : '');

  const dest = loc.state?.from || '/dashboard';
  useEffect(() => { if (!loading && user) nav(dest, { replace: true }); }, [user, loading, dest, nav]);

  const doDev = async (e) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    try { await loginDev(email.trim(), name.trim()); }
    catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  if (loading || user) return <div className="wrap py-24"><Spinner /></div>;

  return (
    <Page>
      <div className="wrap py-14 sm:py-20 max-w-md">
        <div className="text-center mb-7"><Logo /></div>
        <div className="card p-7">
          <h1 className="text-2xl mb-1">Anmelden</h1>
          <p className="text-ink-soft text-sm mb-6">
            Melde dich an, um ein Projekt zu erstellen oder einem beizutreten.
          </p>

          {config.google && (
            <button onClick={loginGoogle} className="btn-ghost w-full !py-3 mb-3">
              <GoogleMark /> Mit Google anmelden
            </button>
          )}

          {config.google && config.dev && (
            <div className="flex items-center gap-3 my-5">
              <div className="divider flex-1" /><span className="text-xs text-ink-faint">oder zum Testen</span><div className="divider flex-1" />
            </div>
          )}

          {config.dev && (
            <form onSubmit={doDev} className="space-y-3">
              <div>
                <span className="label">E-Mail</span>
                <input className="input" type="email" required value={email}
                       onChange={(e) => setEmail(e.target.value)} placeholder="du@beispiel.de" />
              </div>
              <div>
                <span className="label">Name (optional)</span>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Vorname Nachname" />
              </div>
              <button className="btn-primary w-full !py-3" disabled={busy}>
                {busy ? 'Anmelden …' : 'Test-Login (lokal)'}
              </button>
              <p className="text-[12px] text-ink-faint">
                Der Test-Login funktioniert ohne Google-Konto und ist nur für die lokale Entwicklung gedacht.
              </p>
            </form>
          )}

          {!config.google && !config.dev && (
            <p className="text-sm text-amber-deep">Es ist kein Login-Verfahren konfiguriert. Bitte Google-Zugangsdaten in <code>server/.env</code> hinterlegen.</p>
          )}
          {err && <p className="mt-4 text-sm text-amber-deep">{err}</p>}
        </div>
      </div>
    </Page>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5c-6.3 0-11.5-5.1-11.5-11.5S17.7 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.6 6.1 29 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.6 6.1 29 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 34.9 26.7 35.5 24 35.5c-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.6 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.1-2.2 3.9-4.1 5.1l6.2 5.2C40.9 35.6 44 30.3 44 24c0-1.2-.1-2.3-.4-3.5z" />
    </svg>
  );
}
