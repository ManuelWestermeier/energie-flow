import { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Filler,
} from 'chart.js';
import { irrCurve } from '../lib/economics.js';
import { pct } from '../lib/format.js';

Chart.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Filler);

// Zeigt: Rendite (IRR) der Eigentümerseite über dem Solarstrompreis,
// einmal bei aktueller Beteiligung, einmal bei voller Beteiligung (100 %).
export default function LeverChart({ E, quote, height = 220 }) {
  const atQuote = useMemo(() => irrCurve(E, quote, 55, 105, 2.5), [E, quote]);
  const atFull = useMemo(() => irrCurve(E, 100, 55, 105, 2.5), [E]);

  const data = {
    labels: atFull.map((p) => p.share),
    datasets: [
      {
        label: `bei ${pct(quote, 0)} Beteiligung`,
        data: atQuote.map((p) => p.irr),
        borderColor: '#e3851d', backgroundColor: 'rgba(227,133,29,.10)',
        tension: 0.35, spanGaps: false, pointRadius: 0, borderWidth: 2.5, fill: true,
      },
      {
        label: 'wenn alle (100 %) mitmachen',
        data: atFull.map((p) => p.irr),
        borderColor: '#3f8f2c', backgroundColor: 'rgba(63,143,44,.06)',
        tension: 0.35, spanGaps: false, pointRadius: 0, borderWidth: 2.5, borderDash: [5, 4], fill: false,
      },
    ],
  };
  const opts = {
    responsive: true, maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { labels: { boxWidth: 12, boxHeight: 12, font: { size: 11 }, color: '#525b50', usePointStyle: true } },
      tooltip: {
        callbacks: {
          title: (it) => `Preis: ${it[0].label} % des Grundpreises`,
          label: (it) => `${it.dataset.label}: ${it.parsed.y == null ? 'trägt sich nicht' : it.parsed.y + ' % p.a.'}`,
        },
      },
    },
    scales: {
      x: { title: { display: true, text: 'Solarstrompreis (% des Grundpreises)', color: '#878f83', font: { size: 10 } }, grid: { display: false }, ticks: { color: '#878f83', font: { size: 10 } } },
      y: { title: { display: true, text: 'Rendite Eigentümer (% p.a.)', color: '#878f83', font: { size: 10 } }, grid: { color: '#eef0ea' }, ticks: { color: '#878f83', font: { size: 10 } }, beginAtZero: true },
    },
  };
  return <div style={{ height }}><Line data={data} options={opts} /></div>;
}
