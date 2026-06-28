import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const MON = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

export default function ResultsCharts({ monthly = [], height = 240 }) {
  const data = monthly.map((m) => ({ name: MON[(m.month || 1) - 1] || String(m.month), kWh: Math.round(m.E_m || 0) }));
  if (data.length === 0) return null;
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 6, right: 6, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="pvbar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#74b73c" />
              <stop offset="100%" stopColor="#3f8f2c" />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#eef0ea" />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#838c7f' }} tickLine={false} axisLine={{ stroke: '#e5e8e1' }} />
          <YAxis tick={{ fontSize: 11, fill: '#838c7f' }} tickLine={false} axisLine={false} width={48} />
          <Tooltip
            cursor={{ fill: 'rgba(63,143,44,.06)' }}
            contentStyle={{ borderRadius: 12, border: '1px solid #e5e8e1', fontSize: 12 }}
            formatter={(v) => [`${v.toLocaleString('de-DE')} kWh`, 'Ertrag']}
            labelStyle={{ color: '#4f584c', fontWeight: 600 }}
          />
          <Bar dataKey="kWh" fill="url(#pvbar)" radius={[4, 4, 0, 0]} maxBarSize={34} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
