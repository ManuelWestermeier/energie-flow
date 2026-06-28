import { useEffect, useMemo, useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Field, Stat, Spinner, InfoNote } from '../components/ui.jsx';
import PlannerMap from '../components/PlannerMap.jsx';
const Building3D = lazy(() => import('../components/Building3D.jsx'));
import ResultsCharts from '../components/ResultsCharts.jsx';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import {
  geocode, loadBuildings, simulate,
  ringAreaM2, centroid, estimateHeight, roofFromOSM, roofLabel, ROOF_TYPES,
  estimateSystem, azimuthToAspect, COMPASS,
} from '../lib/planner.js';
import { suggestInvest, suggestOpex } from '../lib/economics.js';
import { de, eur, ct, kwh, pct } from '../lib/format.js';
import {
  Search, MapPin, Building2, Sun, Calculator, ArrowRight, ChevronLeft, Home,
  Zap, Compass as CompassIcon, Info, RotateCcw, Cuboid, BarChart3,
} from 'lucide-react';

const STEPS = [
  { key: 'address', label: 'Adresse', icon: MapPin },
  { key: 'building', label: 'Gebäude', icon: Building2 },
  { key: 'design', label: 'Dach & Module', icon: Sun },
  { key: 'result', label: 'Ertrag', icon: BarChart3 },
];
const PEND = 'ef_pv_pending';
const PAYL = 'ef_pv_payload';

function nearestBuilding(buildings, lat, lon) {
  let best = null, bd = Infinity;
  for (const b of buildings) {
    const [clon, clat] = centroid(b.ring);
    const d = (clat - lat) ** 2 + (clon - lon) ** 2;
    if (d < bd) { bd = d; best = b; }
  }
  return best;
}

export default function Rechner() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [step, setStep] = useState(0);

  // Adresse
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [picked, setPicked] = useState(null);

  // Gebäude
  const [buildings, setBuildings] = useState([]);
  const [trees, setTrees] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loadingB, setLoadingB] = useState(false);
  const [radius, setRadius] = useState(140);

  // Auslegung
  const [roofType, setRoofType] = useState('sattel');
  const [tilt, setTilt] = useState(35);
  const [az, setAz] = useState(180);
  const [usable, setUsable] = useState(0.7);
  const [loss, setLoss] = useState(14);
  const [we, setWe] = useState(8);
  const [gvpreis, setGvpreis] = useState(35);
  const [manualKwp, setManualKwp] = useState(null);

  // Simulation
  const [sim, setSim] = useState(null);
  const [simulating, setSimulating] = useState(false);
  const [err, setErr] = useState('');

  const selected = useMemo(() => buildings.find((b) => b.id === selectedId) || null, [buildings, selectedId]);
  const footprintM2 = useMemo(() => (selected ? Math.round(ringAreaM2(selected.ring, picked?.lat || 50)) : 0), [selected, picked]);
  const sys = useMemo(() => estimateSystem({ footprintM2, roofType, tilt, usable }), [footprintM2, roofType, tilt, usable]);
  const kwp = manualKwp != null ? manualKwp : sys.kwp;

  // ---- nach Login: ausstehendes Projekt anlegen ----
  useEffect(() => {
    if (user && sessionStorage.getItem(PEND) === '1') {
      const raw = sessionStorage.getItem(PAYL);
      if (raw) { try { doCreate(JSON.parse(raw)); } catch { sessionStorage.removeItem(PEND); } }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function search() {
    const q = query.trim();
    if (q.length < 3) return;
    setSearching(true); setErr(''); setResults(null);
    try { setResults(await geocode(q)); }
    catch (e) { setErr(e.message); } finally { setSearching(false); }
  }

  async function pick(r) {
    setPicked(r); setResults(null); setStep(1);
    await fetchBuildings(r.lat, r.lon, radius);
  }

  async function fetchBuildings(lat, lon, rad) {
    setLoadingB(true); setErr('');
    try {
      const data = await loadBuildings(lat, lon, rad);
      setBuildings(data.buildings || []);
      setTrees(data.trees || []);
      const nb = nearestBuilding(data.buildings || [], lat, lon);
      if (nb) selectBuilding(nb.id, data.buildings);
    } catch (e) { setErr(e.message); } finally { setLoadingB(false); }
  }

  function selectBuilding(id, list = buildings) {
    setSelectedId(id);
    const b = list.find((x) => x.id === id);
    if (b && b.roofShape) { const rt = roofFromOSM(b.roofShape); if (rt) setRoofType(rt); }
    if (b && Number.isFinite(b.levels)) setWe(Math.max(2, b.levels * 2));
    setManualKwp(null);
  }

  async function runSimulation() {
    setSimulating(true); setErr('');
    try {
      const data = await simulate({ lat: picked.lat, lon: picked.lon, peakpower: kwp, loss, angle: tilt, aspect: azimuthToAspect(az) });
      setSim(data); setStep(3);
    } catch (e) { setErr(e.message); } finally { setSimulating(false); }
  }

  function buildPayload() {
    return {
      name: `Solaranlage ${[picked?.road, picked?.houseNumber].filter(Boolean).join(' ') || (picked?.city || 'Projekt')}`.trim(),
      street: picked?.road || '', hausnr: picked?.houseNumber || '',
      plz: picked?.postcode || '', ort: picked?.city || '', bundesland: picked?.state || 'Bayern',
      we: Number(we) || 8, kwp,
      ertrag: sim?.perKwp ? Math.round(sim.perKwp) : 900,
      invest: suggestInvest(kwp), opex: suggestOpex(kwp),
      gvpreis: Number(gvpreis) || 35, arbeitspreis: Number(gvpreis) || 35, share_pct: 90,
      intake: {
        source: 'pv-planer', lat: picked?.lat, lon: picked?.lon, label: picked?.label,
        roofType, tilt, azimuth: az, loss, usable, footprintM2, height: selected ? estimateHeight(selected) : null,
        modules: sys.modules, pvgis: sim,
      },
    };
  }

  async function doCreate(payload) {
    setErr('');
    try {
      const full = await api.createProject(payload);
      sessionStorage.removeItem(PEND); sessionStorage.removeItem(PAYL);
      nav(`/projekt/${full.id}`, { replace: true });
    } catch (e) { setErr(e.message); }
  }

  function createProject() {
    const payload = buildPayload();
    if (!user) {
      sessionStorage.setItem(PAYL, JSON.stringify(payload));
      sessionStorage.setItem(PEND, '1');
      nav('/login', { state: { from: '/rechner' } });
      return;
    }
    doCreate(payload);
  }

  return (
    <div className="wrap py-8 sm:py-12 max-w-4xl">
      <div className="mb-2 eyebrow">PV-Planer</div>
      <h1 className="text-2xl sm:text-3xl mb-1">Anlage am echten Gebäude planen</h1>
      <p className="text-ink-soft mb-6 text-[14.5px]">Adresse suchen, Dach auf der Karte wählen, Module auslegen und den Ertrag mit echten PVGIS-Wetterdaten berechnen.</p>

      <Stepper step={step} setStep={setStep} canResult={!!sim} />

      {err && <InfoNote tone="sun"><span className="inline-flex items-center gap-1.5"><Info className="h-4 w-4" /> {err}</span></InfoNote>}

      <div className="mt-4">
        {step === 0 && (
          <Card>
            <Field label="Adresse des Gebäudes" hint="Straße, Hausnummer und Ort – z. B. „Marienplatz 1, München“.">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="h-4 w-4 text-ink-faint absolute left-3 top-1/2 -translate-y-1/2" />
                  <input className="input !pl-9" value={query} onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && search()} placeholder="Marienplatz 1, München" />
                </div>
                <button onClick={search} disabled={searching || query.trim().length < 3} className="btn-primary">{searching ? 'Sucht …' : 'Suchen'}</button>
              </div>
            </Field>
            {searching && <Spinner label="Adresse wird gesucht …" />}
            {results && results.length === 0 && <p className="text-[13.5px] text-ink-soft mt-3">Keine Treffer. Schreibweise prüfen oder Ort ergänzen.</p>}
            {results && results.length > 0 && (
              <ul className="mt-3 divide-y divide-line border border-line rounded-card overflow-hidden">
                {results.map((r, i) => (
                  <li key={i}>
                    <button onClick={() => pick(r)} className="w-full text-left px-4 py-3 hover:bg-paper-2 flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-grass-deep mt-0.5 shrink-0" />
                      <span className="text-[13.5px]">{r.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}

        {step === 1 && picked && (
          <div className="space-y-4">
            <PlannerMap center={{ lat: picked.lat, lon: picked.lon }} buildings={buildings} trees={trees} selectedId={selectedId} onSelect={(id) => selectBuilding(id)} />
            {loadingB ? <Spinner label="Gebäude werden geladen …" /> : (
              <div className="grid sm:grid-cols-[1fr_auto] gap-3 items-center">
                <Card className="!p-4">
                  {selected ? (
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                      <KV k="Grundfläche" v={`${de(footprintM2)} m²`} />
                      <KV k="Höhe (geschätzt)" v={`${de(estimateHeight(selected), 1)} m`} />
                      <KV k="Geschosse" v={selected.levels ? String(selected.levels) : '—'} />
                      <KV k="Dachform (OSM)" v={selected.roofShape ? roofLabel(roofFromOSM(selected.roofShape) || 'sattel') : 'unbekannt'} />
                    </div>
                  ) : <p className="text-[13.5px] text-ink-soft">Klicke dein Gebäude auf der Karte an{buildings.length === 0 ? ' – in diesem Umkreis wurden keine Gebäude gefunden.' : '.'}</p>}
                </Card>
                <button onClick={() => fetchBuildings(picked.lat, picked.lon, Math.min(radius + 80, 400))} className="btn-ghost btn-sm"><RotateCcw className="h-4 w-4" /> Umkreis erweitern</button>
              </div>
            )}
            <Nav onBack={() => setStep(0)} onNext={() => setStep(2)} nextLabel="Weiter zur Auslegung" nextDisabled={!selected} />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <Card>
              <div className="label">Dachform</div>
              <div className="flex flex-wrap gap-2">
                {ROOF_TYPES.map((t) => (
                  <button key={t} onClick={() => setRoofType(t)}
                    className={`px-3 py-1.5 rounded-pill text-[13px] font-medium border ${roofType === t ? 'bg-grass-soft text-grass-ink border-grass/30' : 'bg-paper text-ink-soft border-line hover:border-line-strong'}`}>
                    {roofLabel(t)}
                  </button>
                ))}
              </div>

              <div className="grid sm:grid-cols-2 gap-5 mt-5">
                <Slider label="Dachneigung" value={tilt} setV={setTilt} min={0} max={60} step={1} unit="°" />
                <div>
                  <div className="label">Ausrichtung</div>
                  <div className="flex flex-wrap gap-1.5">
                    {COMPASS.map((c) => (
                      <button key={c.label} onClick={() => setAz(c.az)}
                        className={`px-2.5 py-1.5 rounded-pill text-[12.5px] font-medium border ${az === c.az ? 'bg-sun-soft text-sun-ink border-sun/30' : 'bg-paper text-ink-soft border-line'}`}>
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
                <Slider label="Dachausnutzung" value={Math.round(usable * 100)} setV={(v) => setUsable(v / 100)} min={30} max={95} step={5} unit="%" />
                <Slider label="Systemverluste (PVGIS)" value={loss} setV={setLoss} min={5} max={25} step={1} unit="%" sun />
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <div className="eyebrow">Vorgeschlagene Anlage</div>
                  <div className="font-display text-3xl font-bold tnum mt-1">{de(kwp, 1)} <span className="text-base font-semibold text-ink-faint">kWp</span></div>
                  <div className="text-2xs text-ink-faint mt-0.5">≈ {sys.modules} Module · {de(sys.moduleArea)} m² Modulfläche{footprintM2 ? ` · aus ${de(footprintM2)} m² Grundfläche` : ''}</div>
                </div>
                <Field label="Manuell überschreiben (kWp)">
                  <input type="number" step="0.5" className="input tnum w-36" value={manualKwp ?? ''} placeholder={String(sys.kwp)}
                    onChange={(e) => setManualKwp(e.target.value === '' ? null : Number(e.target.value))} />
                </Field>
              </div>
            </Card>

            <Card>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Wohneinheiten im Haus" hint="Für die spätere Wirtschaftlichkeit (GGV).">
                  <input type="number" min="2" className="input tnum" value={we} onChange={(e) => setWe(e.target.value)} />
                </Field>
                <Field label="Aktueller Strompreis (ct/kWh)" hint="Grundpreis je kWh – steht auf der Stromrechnung.">
                  <input type="number" step="0.1" className="input tnum" value={gvpreis} onChange={(e) => setGvpreis(e.target.value)} />
                </Field>
              </div>
            </Card>

            <Nav onBack={() => setStep(1)} onNext={runSimulation} nextLabel={simulating ? 'Berechnet …' : 'Ertrag berechnen'} nextDisabled={simulating || kwp <= 0} nextIcon={<Calculator className="h-4 w-4" />} />
            {simulating && <Spinner label="PVGIS rechnet den Jahresertrag …" />}
          </div>
        )}

        {step === 3 && sim && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Stat label="Jahresertrag" tone="grass" value={`${de(Math.round(sim.annual))} kWh`} sub="laut PVGIS" />
              <Stat label="Spez. Ertrag" value={`${de(Math.round(sim.perKwp))}`} sub="kWh je kWp·a" />
              <Stat label="Anlagengröße" value={`${de(kwp, 1)} kWp`} sub={`${sys.modules} Module`} />
              <Stat label="Systemverluste" tone="sun" value={sim.lossesTotalPct != null ? pct(Math.abs(sim.lossesTotalPct), 1) : `${loss}%`} sub="inkl. Temperatur" />
            </div>

            <Card>
              <div className="flex items-center gap-2 mb-2"><BarChart3 className="h-4 w-4 text-grass-deep" /><h3>Monatsertrag</h3></div>
              <ResultsCharts monthly={sim.monthly} />
            </Card>

            <Card>
              <div className="flex items-center gap-2 mb-2"><Cuboid className="h-4 w-4 text-grass-deep" /><h3>3D-Ansicht</h3>
                <span className="text-2xs text-ink-faint ml-1">Ziehen zum Drehen · Scrollen zum Zoomen</span></div>
              <Suspense fallback={<Spinner label="3D-Ansicht wird geladen …" />}><Building3D building={selected} neighbors={buildings} trees={trees} roofType={roofType} tilt={tilt} modules={sys.modules} lat={picked?.lat || 50} /></Suspense>
              <p className="text-2xs text-ink-faint mt-2">Vereinfachte Massendarstellung; präzise Dachgeometrie und stundengenaue Verschattung folgen in einer späteren Ausbaustufe.</p>
            </Card>

            <InfoNote>
              Datengrundlage: <strong>{sim.source}</strong>. Diese Werte fließen in die Wirtschaftlichkeit deines Projekts ein.
            </InfoNote>

            <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
              <button onClick={() => setStep(2)} className="btn-ghost"><ChevronLeft className="h-4 w-4" /> Auslegung ändern</button>
              <button onClick={createProject} className="btn-primary !py-3 text-[15px]">{user ? 'Projekt erstellen' : 'Anmelden & Projekt erstellen'} <ArrowRight className="h-4 w-4" /></button>
            </div>
            {!user && <p className="text-2xs text-ink-faint text-right">Deine Planung bleibt erhalten.</p>}
          </div>
        )}
      </div>
    </div>
  );
}

function Stepper({ step, setStep, canResult }) {
  return (
    <div className="flex items-center gap-1 sm:gap-2">
      {STEPS.map((s, i) => {
        const Icon = s.icon;
        const done = i < step;
        const active = i === step;
        const clickable = i < step || (i === 3 && canResult);
        return (
          <div key={s.key} className="flex items-center gap-1 sm:gap-2 flex-1">
            <button disabled={!clickable && !active} onClick={() => clickable && setStep(i)}
              className={`flex items-center gap-2 min-w-0 ${clickable ? 'cursor-pointer' : 'cursor-default'}`}>
              <span className={`h-8 w-8 rounded-full grid place-items-center shrink-0 text-[13px] font-bold ${active ? 'bg-grass text-white' : done ? 'bg-grass-soft text-grass-deep' : 'bg-paper border border-line text-ink-faint'}`}>
                {done ? '✓' : <Icon className="h-4 w-4" />}
              </span>
              <span className={`text-[12.5px] font-medium truncate hidden sm:block ${active ? 'text-ink' : 'text-ink-faint'}`}>{s.label}</span>
            </button>
            {i < STEPS.length - 1 && <span className="h-0.5 flex-1 rounded-full" style={{ background: done ? 'var(--flow)' : '#e5e8e1' }} />}
          </div>
        );
      })}
    </div>
  );
}

function Card({ children, className = '' }) { return <div className={`card p-5 ${className}`}>{children}</div>; }
function KV({ k, v }) { return <div><div className="text-2xs text-ink-faint uppercase tracking-wide">{k}</div><div className="font-display font-bold tnum text-lg leading-tight">{v}</div></div>; }

function Slider({ label, value, setV, min, max, step, unit, sun }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <span className="label !mb-0">{label}</span>
        <span className={`font-display font-bold tnum ${sun ? 'text-sun-deep' : 'text-grass-deep'}`}>{value}<span className="text-xs text-ink-faint ml-0.5">{unit}</span></span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => setV(Number(e.target.value))} className={`w-full ${sun ? 'sun' : ''}`} />
    </div>
  );
}

function Nav({ onBack, onNext, nextLabel, nextDisabled, nextIcon }) {
  return (
    <div className="flex items-center justify-between">
      <button onClick={onBack} className="btn-ghost"><ChevronLeft className="h-4 w-4" /> Zurück</button>
      <button onClick={onNext} disabled={nextDisabled} className="btn-primary">{nextLabel} {nextIcon || <ArrowRight className="h-4 w-4" />}</button>
    </div>
  );
}
