import { useMemo, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Filler,
} from 'chart.js';
import { scenario, irrCurve } from '../lib/economics.js';
import { eur, ct, pct, dateDE } from '../lib/format.js';
import { Send, Sparkles, History, Handshake } from 'lucide-react';

Chart.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Filler);

export function NegotiationPanel({ project, E, quote, role, onPropose }) {
  const [share, setShare] = useState(Math.round(project.share_pct));
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const cur = useMemo(() => scenario(E, { quotePct: quote, sharePct: share }), [E, quote, share]);
  const atCommitted = useMemo(() => irrCurve(E, quote, 55, 105, 2.5), [E, quote]);
  const atFull = useMemo(() => irrCurve(E, 100, 55, 105, 2.5), [E]);

  const labels = atFull.map((p) => p.share);
  const data = {
    labels,
    datasets: [
      {
        label: `bei ${pct(quote, 0)} Beteiligung`,
        data: atCommitted.map((p) => p.irr),
        borderColor: '#e8851f', backgroundColor: 'rgba(232,133,31,.10)',
        tension: 0.35, spanGaps: false, pointRadius: 0, borderWidth: 2.5, fill: true,
      },
      {
        label: 'wenn alle (100 %) mitmachen',
        data: atFull.map((p) => p.irr),
        borderColor: '#2f6e2a', backgroundColor: 'rgba(79,157,46,.08)',
        tension: 0.35, spanGaps: false, pointRadius: 0, borderWidth: 2.5, borderDash: [5, 4], fill: false,
      },
    ],
  };
  const opts = {
    responsive: true, maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { labels: { boxWidth: 12, boxHeight: 12, font: { size: 11 }, color: '#56604c', usePointStyle: true } },
      tooltip: {
        callbacks: {
          title: (it) => `Preis: ${it[0].label} % des Grundpreises`,
          label: (it) => `${it.dataset.label}: ${it.parsed.y == null ? 'trägt sich nicht' : it.parsed.y + ' % p.a.'}`,
        },
      },
    },
    scales: {
      x: { title: { display: true, text: 'Solarstrompreis (% des Grundpreises)', color: '#8a917f', font: { size: 10 } },
           grid: { display: false }, ticks: { color: '#8a917f', font: { size: 10 } } },
      y: { title: { display: true, text: 'Rendite Eigentümer (% p.a.)', color: '#8a917f', font: { size: 10 } },
           grid: { color: '#eee7d6' }, ticks: { color: '#8a917f', font: { size: 10 } }, beginAtZero: true },
    },
  };

  const send = async () => {
    setBusy(true);
    try {
      await onPropose({
        share_pct: share, quote_pct: quote,
        params: E, result: cur,
        note: note.trim() || undefined,
      });
      setNote('');
    } finally { setBusy(false); }
  };

  const changed = Math.round(project.share_pct) !== share;

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-1">
        <Handshake className="h-5 w-5 text-green-deep" />
        <h2 className="text-xl">Preis verhandeln</h2>
      </div>
      <p className="text-[13.5px] text-ink-soft mb-5">
        Schiebe den Solarstrompreis und sieh sofort, wie er auf beide Seiten wirkt. Für die GGV
        (§42b EnWG) gibt es keine gesetzliche Obergrenze – 90 % sind unser fairer Startwert.
      </p>

      {/* Slider */}
      <div className="mb-5">
        <div className="flex items-baseline justify-between mb-2">
          <span className="label !mb-0">Solarstrompreis</span>
          <span className="font-display text-2xl text-green-deep tnum">{share}<span className="text-base text-ink-soft"> % · {ct(cur.solarpreis)}/kWh</span></span>
        </div>
        <div className="relative">
          <input type="range" min="50" max="110" step="1" value={share}
                 onChange={(e) => setShare(+e.target.value)}
                 className="w-full accent-green-deep" />
          {/* Fairness-Marke bei 90 % */}
          <div className="absolute -bottom-5 text-[10px] text-ink-faint" style={{ left: `${((90 - 50) / 60) * 100}%`, transform: 'translateX(-50%)' }}>
            ▲ 90 % fair
          </div>
        </div>
        <div className="flex justify-between text-[10px] text-ink-faint mt-1"><span>günstiger für Mieter</span><span>besser für Eigentümer</span></div>
      </div>

      {/* Trade-off-Readout */}
      <div className="grid grid-cols-2 gap-3 mb-5 mt-6">
        <div className="rounded-xl bg-green-soft p-3.5">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-green-deep">Mieter:innen sparen</div>
          <div className="font-display text-xl text-green-ink mt-1 tnum">{eur(cur.tenantSavingsTotal)}/a</div>
          <div className="text-[12px] text-green-deep/80">{eur(cur.tenantSavingsPerHH)} je Haushalt</div>
        </div>
        <div className="rounded-xl bg-amber-soft p-3.5">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-amber-deep">Rendite Eigentümer</div>
          <div className="font-display text-xl text-ink mt-1 tnum">{cur.irr == null ? '—' : pct(cur.irr * 100, 1)}</div>
          <div className="text-[12px] text-amber-deep/80">{cur.irr == null ? 'trägt sich nicht' : `${eur(cur.netto)}/a Überschuss`}</div>
        </div>
      </div>

      {/* Hebel-Chart */}
      <div className="h-52 mb-2">
        <Line data={data} options={opts} />
      </div>
      <p className="text-[12px] text-ink-faint mb-5 flex items-start gap-1.5">
        <Sparkles className="h-3.5 w-3.5 mt-0.5 shrink-0 text-green-deep" />
        Der Abstand der Linien ist euer Hebel: Mehr Beteiligung hebt die Rendite – ihr könnt
        denselben Preis fairer gestalten oder günstiger werden, ohne die Anlage unrentabel zu machen.
      </p>

      {/* Vorschlag senden */}
      <div className="border-t border-line pt-4">
        <textarea className="input !py-2 text-sm" rows="2" value={note} onChange={(e) => setNote(e.target.value)}
                  placeholder={role === 'vermieter' ? 'Begründung (optional), z. B. höhere Investitionskosten …' : 'Notiz an die Eigentümerseite (optional) …'} />
        <button onClick={send} disabled={busy || (!changed && (project.proposals || []).length > 0)}
                className="btn-primary w-full mt-3">
          {busy ? 'Sende …' : changed ? `Vorschlag senden: ${share} %` : 'Aktuellen Stand vorschlagen'} <Send className="h-4 w-4" />
        </button>
        <p className="text-[12px] text-ink-faint mt-2">
          Ein neuer Vorschlag wird zum aktuellen Stand und setzt bestehende Zustimmungen zurück.
        </p>
      </div>

      {/* Verlauf */}
      {(project.proposals || []).length > 0 && (
        <div className="mt-5 border-t border-line pt-4">
          <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-ink-faint mb-3">
            <History className="h-4 w-4" /> Verhandlungsverlauf
          </div>
          <ol className="space-y-2.5">
            {project.proposals.slice(0, 8).map((p) => (
              <li key={p.id} className="flex items-start gap-3 text-[13px]">
                <span className={`pill ${p.by_role === 'vermieter' ? 'pill-amber' : ''} shrink-0`}>{Math.round(p.share_pct)} %</span>
                <div className="min-w-0">
                  <div className="text-ink">
                    <strong>{p.by_name || 'Teilnehmer:in'}</strong>
                    <span className="text-ink-faint"> · {p.by_role === 'vermieter' ? 'Eigentümerseite' : p.by_role === 'admin' ? 'Initiator:in' : 'Mieter:in'} · {dateDE(p.created_at)}</span>
                  </div>
                  {p.note && <div className="text-ink-soft text-[12.5px] mt-0.5">„{p.note}"</div>}
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
