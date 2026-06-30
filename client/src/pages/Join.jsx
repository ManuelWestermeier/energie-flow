import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { LogoWide, Spinner, Field } from '../components/ui.jsx';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { MapPin, Home, KeyRound, ArrowRight, AlertCircle } from 'lucide-react';

const CONS_PRESETS = [['1 Pers.', 1500], ['2 Pers.', 2500], ['3 Pers.', 3600], ['4 Pers.', 4250], ['5+', 5200]];

export default function Join() {
  const { token } = useParams();
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [info, setInfo] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [verbrauch, setVerbrauch] = useState('');

  useEffect(() => { api.inviteInfo(token).then(setInfo).catch((e) => setErr(e.message)); }, [token]);

  const isVermieter = info?.role === 'vermieter';
  const isSelbstnutzer = info?.role === 'selbstnutzer';

  const join = async () => {
    setBusy(true); setErr('');
    const body = isVermieter ? {} : { verbrauch: verbrauch === '' ? null : Number(verbrauch) };
    try { const full = await api.acceptInvite(token, body); nav(`/projekt/${full.id}`, { replace: true }); }
    catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-canvas">
      <div className="wrap py-12 sm:py-20 max-w-lg">
        <div className="text-center mb-6"><Link to="/" className="inline-block"><LogoWide className="h-9 mx-auto" /></Link></div>

        {err && !info && (
          <div className="card p-7 text-center">
            <AlertCircle className="h-9 w-9 text-sun-deep mx-auto mb-3" />
            <h1 className="text-2xl mb-1">Einladung ungültig</h1>
            <p className="text-ink-soft mb-6">{err}</p>
            <Link to="/" className="btn-ghost mx-auto w-max">Zur Startseite</Link>
          </div>
        )}

        {!info && !err && <div className="py-10"><Spinner label="Einladung wird geprüft …" /></div>}

        {info && (
          <div className="card p-7">
            <span className={isVermieter || isSelbstnutzer ? 'chip-sun' : 'chip-grass'}>
              {isVermieter ? 'Einladung für die Eigentümerseite' : isSelbstnutzer ? 'Einladung für selbstnutzende Eigentümer' : 'Einladung in die Hausgemeinschaft'}
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
                  : isSelbstnutzer
                    ? 'Du wohnst hier und bist Miteigentümer: alle Daten einsehen, mitentscheiden und deinen Verbrauch hinterlegen.'
                    : 'Du kannst alle Daten einsehen und deinen Stromverbrauch bestätigen.'}
              </div>
            </div>

            {loading ? <Spinner />
              : user ? (
                <>
                  {!isVermieter && (
                    <div className="mb-4">
                      <Field label="Dein Jahresstromverbrauch (kWh)" hint="Fließt direkt in die Wirtschaftlichkeit ein. Kann später ergänzt werden.">
                        <input type="number" className="input tnum" value={verbrauch} onChange={(e) => setVerbrauch(e.target.value)} placeholder="2500" />
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          <span className="text-2xs text-ink-faint mr-0.5">Unbekannt? Schätzen:</span>
                          {CONS_PRESETS.map(([lbl, v]) => (
                            <button key={lbl} type="button" onClick={() => setVerbrauch(String(v))}
                              className="px-2 py-0.5 rounded-pill text-2xs font-medium border border-line bg-paper hover:border-grass/40 hover:bg-grass-soft/40 tnum">{lbl}</button>
                          ))}
                        </div>
                      </Field>
                    </div>
                  )}
                  <button onClick={join} disabled={busy} className="btn-primary w-full !py-3">{busy ? 'Trete bei …' : 'Projekt beitreten'} <ArrowRight className="h-4 w-4" /></button>
                  <p className="text-[12px] text-ink-faint mt-3">Angemeldet als {user.name}.</p>
                </>
              ) : (
                <>
                  <button onClick={() => nav('/login', { state: { from: loc.pathname } })} className="btn-primary w-full !py-3">Anmelden & beitreten <ArrowRight className="h-4 w-4" /></button>
                  <p className="text-[12px] text-ink-faint mt-3">Nach der Anmeldung kommst du automatisch hierher zurück.</p>
                </>
              )}
            {err && info && <p className="text-danger text-sm mt-4">{err}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
