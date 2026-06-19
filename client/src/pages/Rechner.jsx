import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Page } from '../components/Layout.jsx';
import { Field, Stat, Spinner } from '../components/ui.jsx';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import {
  REGIONS, suggestErtrag, suggestKwp, suggestInvest, suggestOpex,
  paramsFromProject, scenario,
} from '../lib/economics.js';
import { de, eur, ct, pct } from '../lib/format.js';
import {
  MapPin, Building2, Plug, Sparkles, ChevronRight, ChevronLeft,
  Sun, Leaf, PiggyBank, Info, ArrowRight,
} from 'lucide-react';

const INTAKE_KEY = 'ef_intake';
const PENDING_KEY = 'ef_pending_create';

const EMPTY = {
  street: '', hausnr: '', plz: '', ort: '', bundesland: 'Bayern',
  we: 8, eigentum: 'vermieter', wohnung: '',
  gvpreis: 35, verbrauch: '',
  detail: false, dachflaeche: '', ausrichtung: 'so-sw', verschattung: 'keine',
  kwp: '', invest: '',
};

const OWNERS = [
  ['vermieter', 'Vermieter:in / Einzeleigentümer:in'],
  ['weg', 'Eigentümergemeinschaft (WEG)'],
  ['gesellschaft', 'Wohnungsbaugesellschaft / Genossenschaft'],
  ['unbekannt', 'Weiß ich nicht genau'],
];
const ORIENT = [['sued', 'Süd'], ['so-sw', 'Südost–Südwest'], ['ost-west', 'Ost–West'], ['nord', 'Nord'], ['flach', 'Flachdach']];
const SHADE = [['keine', 'keine'], ['gering', 'gering'], ['teilweise', 'teilweise'], ['stark', 'stark']];

const STEPS = [
  { key: 'standort', icon: MapPin, title: 'Standort', sub: 'Wo steht euer Haus?' },
  { key: 'gebaeude', icon: Building2, title: 'Gebäude', sub: 'Größe und Eigentum' },
  { key: 'strom', icon: Plug, title: 'Strom', sub: 'Was zahlst du aktuell?' },
  { key: 'detail', icon: Sparkles, title: 'Genauer (optional)', sub: 'Wenn du mehr weißt' },
  { key: 'ergebnis', icon: Sun, title: 'Schätzung', sub: 'Dein erstes Ergebnis' },
];

function loadInitial() {
  try { const s = sessionStorage.getItem(INTAKE_KEY); if (s) return { ...EMPTY, ...JSON.parse(s) }; } catch {}
  return EMPTY;
}

function toPayload(f) {
  const kwp = +f.kwp || suggestKwp({ we: f.we, dachflaeche: f.dachflaeche });
  const ertrag = suggestErtrag({ bundesland: f.bundesland, ausrichtung: f.ausrichtung, verschattung: f.verschattung });
  const invest = +f.invest || suggestInvest(kwp);
  return {
    name: `Solaranlage ${[f.street, f.hausnr].filter(Boolean).join(' ')}`.trim() || 'Solarprojekt',
    street: f.street, hausnr: f.hausnr, plz: f.plz, ort: f.ort, bundesland: f.bundesland,
    eigentum: f.eigentum, we: +f.we || 8, kwp, ertrag, invest,
    gvpreis: +f.gvpreis || 35, arbeitspreis: +f.gvpreis || 35,
    opex: suggestOpex(kwp), share_pct: 90,
    wohnung: f.wohnung, intake: f,
  };
}

export default function Rechner() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState(loadInitial);
  const [i, setI] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const set = (k) => (e) => {
    const v = e && e.target ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value) : e;
    setForm((f) => ({ ...f, [k]: v }));
  };

  // Live-Schätzung (Planungsannahme: alle Wohneinheiten beteiligt, 90 % Preis)
  const est = useMemo(() => {
    const p = toPayload(form);
    const E = paramsFromProject(p);
    return { p, E, r: scenario(E, { quotePct: 100, sharePct: 90 }) };
  }, [form]);

  const create = async (data) => {
    setBusy(true); setErr('');
    try {
      const full = await api.createProject(toPayload(data));
      sessionStorage.removeItem(INTAKE_KEY);
      sessionStorage.removeItem(PENDING_KEY);
      nav(`/projekt/${full.id}`, { replace: true });
    } catch (e) { setErr(e.message); setBusy(false); }
  };

  // Nach Login zurückgekehrt? Dann ausstehende Erstellung abschließen.
  useEffect(() => {
    if (user && sessionStorage.getItem(PENDING_KEY) === '1') {
      try { create(JSON.parse(sessionStorage.getItem(INTAKE_KEY) || '{}')); } catch { sessionStorage.removeItem(PENDING_KEY); }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const submit = () => {
    if (!user) {
      sessionStorage.setItem(INTAKE_KEY, JSON.stringify(form));
      sessionStorage.setItem(PENDING_KEY, '1');
      nav('/login', { state: { from: '/rechner' } });
      return;
    }
    create(form);
  };

  // Schritte: „detail" überspringen, wenn nicht aktiviert
  const visible = STEPS.filter((s) => s.key !== 'detail' || form.detail || i >= 3);
  const step = STEPS[i];
  const last = i === STEPS.length - 1;

  const canNext = () => {
    if (step.key === 'standort') return form.bundesland;
    if (step.key === 'gebaeude') return +form.we >= 2;
    if (step.key === 'strom') return +form.gvpreis > 0;
    return true;
  };

  const next = () => {
    if (step.key === 'strom' && !form.detail) { setI(4); return; } // Detailschritt überspringen
    setI((x) => Math.min(x + 1, STEPS.length - 1));
  };
  const back = () => {
    if (last && !form.detail) { setI(2); return; }
    setI((x) => Math.max(x - 1, 0));
  };

  if (busy) return <div className="wrap py-24"><Spinner label="Projekt wird erstellt …" /></div>;

  return (
    <Page>
      <div className="wrap py-10 sm:py-14 max-w-2xl">
        {/* Stepper */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, idx) => {
            const active = idx === i, done = idx < i;
            if (s.key === 'detail' && !form.detail && i < 3) return null;
            return (
              <div key={s.key} className="flex items-center gap-2 flex-1">
                <div className={`h-1.5 flex-1 rounded-full transition ${done || active ? 'bg-green-deep' : 'bg-paper-2'}`} />
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-3 mb-1">
          <span className="inline-grid place-items-center h-10 w-10 rounded-xl bg-green-soft text-green-deep">
            <step.icon className="h-5 w-5" />
          </span>
          <div>
            <div className="text-[12px] font-semibold uppercase tracking-wide text-ink-faint">Schritt {i + 1} von {form.detail ? 5 : 4}</div>
            <h1 className="text-2xl">{step.title}</h1>
          </div>
        </div>
        <p className="text-ink-soft mb-6 ml-[52px]">{step.sub}</p>

        <div className="card p-6 sm:p-7">
          <AnimatePresence mode="wait">
            <motion.div key={step.key}
              initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -14 }}
              transition={{ duration: 0.22 }}>

              {step.key === 'standort' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2"><Field label="Straße"><input className="input" value={form.street} onChange={set('street')} placeholder="Sonnenallee" /></Field></div>
                    <Field label="Nr."><input className="input" value={form.hausnr} onChange={set('hausnr')} placeholder="12" /></Field>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <Field label="PLZ"><input className="input" value={form.plz} onChange={set('plz')} placeholder="83278" /></Field>
                    <div className="col-span-2"><Field label="Ort"><input className="input" value={form.ort} onChange={set('ort')} placeholder="Traunstein" /></Field></div>
                  </div>
                  <Field label="Bundesland" hint="Bestimmt den durchschnittlichen Sonnenertrag.">
                    <select className="input" value={form.bundesland} onChange={set('bundesland')}>
                      {Object.keys(REGIONS).map((b) => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </Field>
                </div>
              )}

              {step.key === 'gebaeude' && (
                <div className="space-y-4">
                  <Field label="Wohneinheiten im Haus" hint="So viele Wohnungen gibt es insgesamt.">
                    <input type="number" min="2" className="input" value={form.we} onChange={set('we')} />
                  </Field>
                  <Field label="Wem gehört das Haus?">
                    <select className="input" value={form.eigentum} onChange={set('eigentum')}>
                      {OWNERS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </Field>
                  <Field label="Deine Wohnung (optional)" hint="z. B. 2. OG links – nur für dich sichtbar.">
                    <input className="input" value={form.wohnung} onChange={set('wohnung')} placeholder="2. OG links" />
                  </Field>
                </div>
              )}

              {step.key === 'strom' && (
                <div className="space-y-4">
                  <Field label="Dein aktueller Strompreis (ct/kWh)" hint="Steht auf deiner Stromrechnung – der Arbeitspreis pro kWh.">
                    <input type="number" step="0.1" className="input" value={form.gvpreis} onChange={set('gvpreis')} />
                  </Field>
                  <Field label="Dein Jahresverbrauch (kWh, optional)" hint="Ungefähr. Genauer geht es später im Projekt.">
                    <input type="number" className="input" value={form.verbrauch} onChange={set('verbrauch')} placeholder="2500" />
                  </Field>
                  <label className="flex items-start gap-3 mt-2 p-3.5 rounded-xl bg-paper-2/70 cursor-pointer">
                    <input type="checkbox" className="mt-1 accent-green-deep h-4 w-4" checked={form.detail} onChange={set('detail')} />
                    <span className="text-[14px] text-ink-soft">
                      <strong className="text-ink">Ich kenne schon mehr Details</strong> (Dach, Ausrichtung, Anlagengröße).
                      Dann wird die Schätzung genauer.
                    </span>
                  </label>
                </div>
              )}

              {step.key === 'detail' && (
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <Field label="Nutzbare Dachfläche (m², optional)"><input type="number" className="input" value={form.dachflaeche} onChange={set('dachflaeche')} placeholder="120" /></Field>
                    <Field label="Ausrichtung">
                      <select className="input" value={form.ausrichtung} onChange={set('ausrichtung')}>{ORIENT.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
                    </Field>
                  </div>
                  <Field label="Verschattung">
                    <select className="input" value={form.verschattung} onChange={set('verschattung')}>{SHADE.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
                  </Field>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <Field label="Anlagengröße (kWp, optional)" hint="Leer lassen = wir schätzen."><input type="number" className="input" value={form.kwp} onChange={set('kwp')} placeholder={String(suggestKwp({ we: form.we, dachflaeche: form.dachflaeche }))} /></Field>
                    <Field label="Investition (€, optional)"><input type="number" className="input" value={form.invest} onChange={set('invest')} placeholder={String(suggestInvest(+form.kwp || suggestKwp({ we: form.we, dachflaeche: form.dachflaeche })))} /></Field>
                  </div>
                </div>
              )}

              {step.key === 'ergebnis' && (
                <div>
                  <div className="flex items-center gap-2 text-[13px] text-ink-soft mb-4 p-3 rounded-xl bg-amber-soft/60">
                    <Info className="h-4 w-4 text-amber-deep shrink-0" />
                    Erste Schätzung – angenommen, alle {de(form.we)} Wohnungen machen mit, zu 90 % des Grundpreises.
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Stat label="Anlagengröße" value={`${de(est.p.kwp)} kWp`} tone="green" />
                    <Stat label="Solarstrompreis" value={ct(est.r.solarpreis)} sub="bei 90 % des Grundpreises" />
                    <Stat label="Ersparnis je Haushalt" value={`${eur(est.r.tenantSavingsPerHH)}/a`} tone="green" sub="bei voller Beteiligung" />
                    <Stat label="CO₂ vermieden" value={`${de(est.r.co2)} kg/a`} />
                  </div>
                  <div className="mt-4 p-4 rounded-xl border border-line">
                    <div className="flex items-center gap-2 text-sm font-semibold text-ink mb-1"><PiggyBank className="h-4 w-4 text-green-deep" />Für die Eigentümerseite</div>
                    <p className="text-[13.5px] text-ink-soft">
                      Überschuss rund <strong className="text-ink">{eur(est.r.netto)}/Jahr</strong>,
                      Rendite {est.r.irr == null ? 'rechnet sich im Zeitraum noch nicht' : <strong className="text-ink">{pct(est.r.irr * 100, 1)} p.a.</strong>}.
                      Im Projekt verhandelt ihr den Preis – mehr Beteiligung schafft mehr Spielraum.
                    </p>
                  </div>
                  <button onClick={submit} className="btn-primary w-full !py-3.5 mt-5 text-[15px]">
                    {user ? 'Projekt erstellen' : 'Anmelden & Projekt erstellen'} <ArrowRight className="h-4 w-4" />
                  </button>
                  {!user && <p className="text-[12px] text-ink-faint text-center mt-2">Deine Eingaben bleiben erhalten.</p>}
                  {err && <p className="text-amber-deep text-sm mt-3 text-center">{err}</p>}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        {!last && (
          <div className="flex items-center justify-between mt-5">
            <button onClick={back} disabled={i === 0} className="btn-ghost disabled:opacity-40">
              <ChevronLeft className="h-4 w-4" /> Zurück
            </button>
            <button onClick={next} disabled={!canNext()} className="btn-primary">
              Weiter <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
        {last && (
          <div className="flex items-center justify-start mt-5">
            <button onClick={back} className="btn-ghost"><ChevronLeft className="h-4 w-4" /> Zurück</button>
          </div>
        )}
      </div>
    </Page>
  );
}
