import { upstreamJson } from '../../_lib/upstream.js';
import { json, err } from '../../_lib/http.js';

export async function onRequestGet({ request }) {
  const sp = new URL(request.url).searchParams;
  const lat = Number(sp.get('lat')), lon = Number(sp.get('lon'));
  const peakpower = Number(sp.get('peakpower')) || 1;
  const loss = sp.get('loss') != null ? Number(sp.get('loss')) : 14;
  const angle = sp.get('angle') != null ? Number(sp.get('angle')) : 35;
  const aspect = sp.get('aspect') != null ? Number(sp.get('aspect')) : 0; // 0=Süd, -90=Ost, 90=West
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return err('lat/lon erforderlich', 400);
  try {
    const qp = new URLSearchParams({
      lat: String(lat), lon: String(lon), peakpower: String(peakpower), loss: String(loss),
      angle: String(angle), aspect: String(aspect), mountingplace: 'building',
      pvtechchoice: 'crystSi', outputformat: 'json',
    });
    const url = 'https://re.jrc.ec.europa.eu/api/v5_2/PVcalc?' + qp.toString();
    const data = await upstreamJson(url);
    const fixed = data?.outputs?.totals?.fixed || {};
    const monthly = (data?.outputs?.monthly?.fixed || []).map((m) => ({ month: m.month, E_m: m.E_m, H_m: m['H(i)_m'] }));
    return json({
      annual: fixed.E_y ?? null,
      perKwp: fixed.E_y && peakpower ? fixed.E_y / peakpower : null,
      irradiationYear: fixed['H(i)_y'] ?? null,
      lossesTotalPct: fixed.l_total ?? null,
      monthly,
      inputsUsed: { peakpower, loss, angle, aspect },
      source: 'PVGIS-SARAH (re.jrc.ec.europa.eu, v5_2)',
    });
  } catch (e) { return err('PVGIS-Simulation fehlgeschlagen: ' + e.message, 502); }
}
