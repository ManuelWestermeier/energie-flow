import { upstreamJson } from '../../_lib/upstream.js';
import { json, err } from '../../_lib/http.js';

export async function onRequestGet({ request }) {
  const q = (new URL(request.url).searchParams.get('q') || '').trim();
  if (q.length < 3) return json([]);
  try {
    const url = 'https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=6&q=' + encodeURIComponent(q);
    const data = await upstreamJson(url);
    return json((Array.isArray(data) ? data : []).map((d) => {
      const a = d.address || {};
      return {
        label: d.display_name,
        lat: Number(d.lat), lon: Number(d.lon),
        type: d.type, category: d.category,
        road: a.road || null, houseNumber: a.house_number || null,
        postcode: a.postcode || null,
        city: a.city || a.town || a.village || a.municipality || a.suburb || null,
        state: a.state || null,
        boundingbox: d.boundingbox ? d.boundingbox.map(Number) : null,
      };
    }));
  } catch (e) { return err('Adresssuche fehlgeschlagen: ' + e.message, 502); }
}
