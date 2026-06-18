import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { Page } from '../components/Layout.jsx';
import { Logo, Spinner } from '../components/ui.jsx';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { MapPin, Home, KeyRound, ArrowRight, AlertCircle } from 'lucide-react';

export default function Join() {
  const { token } = useParams();
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [info, setInfo] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.inviteInfo(token).then(setInfo).catch((e) => setErr(e.message));
  }, [token]);

  const join = async () => {
    setBusy(true); setErr('');
    try {
      const full = await api.acceptInvite(token, {});
      nav(`/projekt/${full.id}`, { replace: true });
    } catch (e) { setErr(e.message); setBusy(false); }
  };

  const isVermieter = info?.role === 'vermieter';

  return (
    <Page>
      <div className="wrap py-14 sm:py-20 max-w-lg">
        <div className="text-center mb-6"><Logo /></div>

        {err && !info && (
          <div className="card p-7 text-center">
            <AlertCircle className="h-9 w-9 text-amber-deep mx-auto mb-3" />
            <h1 className="text-2xl mb-1">Einladung ungültig</h1>
            <p className="text-ink-soft mb-6">{err}</p>
            <Link to="/" className="btn-ghost mx-auto">Zur Startseite</Link>
          </div>
        )}

        {!info && !err && <div className="py-10"><Spinner label="Einladung wird geprüft …" /></div>}

        {info && (
          <div className="card p-7">
            <span className={isVermieter ? 'pill pill-amber' : 'pill'}>
              {isVermieter ? 'Einladung für die Eigentümerseite' : 'Einladung in die Hausgemeinschaft'}
            </span>
            <h1 className="text-2xl sm:text-3xl mt-4 mb-1">{info.project.name}</h1>
            {info.label && <p className="text-ink-soft -mt-1 mb-3">Persönlich für: <strong className="text-ink">{info.label}</strong></p>}

            <div className="space-y-2 text-[14.5px] text-ink-soft my-5">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-ink-faint" />
                {[info.project.street, info.project.hausnr].filter(Boolean).join(' ') + (info.project.ort ? `, ${info.project.ort}` : '') || '—'}
              </div>
              <div className="flex items-center gap-2">
                {isVermieter ? <KeyRound className="h-4 w-4 text-ink-faint" /> : <Home className="h-4 w-4 text-ink-faint" />}
                {isVermieter
                  ? 'Du kannst alle Daten einsehen, die Analyse aktualisieren und Preise vorschlagen.'
                  : 'Du kannst alle Daten einsehen und deinen Stromverbrauch bestätigen.'}
              </div>
            </div>

            {loading ? (
              <Spinner />
            ) : user ? (
              <>
                <button onClick={join} disabled={busy} className="btn-primary w-full !py-3">
                  {busy ? 'Trete bei …' : 'Projekt beitreten'} <ArrowRight className="h-4 w-4" />
                </button>
                <p className="text-[12px] text-ink-faint mt-3">Angemeldet als {user.username}.</p>
              </>
            ) : (
              <>
                <button
                  onClick={() => nav('/login', { state: { from: loc.pathname } })}
                  className="btn-primary w-full !py-3">
                  Anmelden & beitreten <ArrowRight className="h-4 w-4" />
                </button>
                <p className="text-[12px] text-ink-faint mt-3">
                  Nach der Anmeldung kommst du automatisch hierher zurück.
                </p>
              </>
            )}
            {err && info && <p className="text-amber-deep text-sm mt-4">{err}</p>}
          </div>
        )}
      </div>
    </Page>
  );
}
