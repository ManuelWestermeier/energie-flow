import { upstream } from '../../_lib/upstream.js';
import { json, err } from '../../_lib/http.js';

export async function onRequestGet({ request }) {
  const sp = new URL(request.url).searchParams;
  const lat = Number(sp.get('lat')), lon = Number(sp.get('lon'));
  const radius = Math.min(Math.max(Number(sp.get('radius')) || 120, 30), 400);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return err('lat/lon erforderlich', 400);
  const query = `[out:json][timeout:25];(
      way["building"](around:${radius},${lat},${lon});
      node["natural"="tree"](around:${radius},${lat},${lon});
    );out body geom;`;
  try {
    const r = await upstream('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'data=' + encodeURIComponent(query),
    });
    if (r.status >= 400) throw new Error('Overpass ' + r.status);
    const data = JSON.parse(r.text);
    const buildings = [];
    const trees = [];
    for (const el of data.elements || []) {
      if (el.type === 'way' && Array.isArray(el.geometry)) {
        const ring = el.geometry.map((p) => [p.lon, p.lat]);
        const t = el.tags || {};
        buildings.push({
          id: el.id, ring, tags: t,
          levels: t['building:levels'] ? Number(t['building:levels']) : null,
          height: t.height ? parseFloat(t.height) : null,
          roofShape: t['roof:shape'] || null,
          roofLevels: t['roof:levels'] ? Number(t['roof:levels']) : null,
          name: t.name || null,
        });
      } else if (el.type === 'node' && el.tags && el.tags.natural === 'tree') {
        trees.push({ id: el.id, lat: el.lat, lon: el.lon, height: el.tags.height ? parseFloat(el.tags.height) : null });
      }
    }
    return json({ center: { lat, lon }, radius, buildings, trees });
  } catch (e) { return err('Gebäudedaten konnten nicht geladen werden: ' + e.message, 502); }
}
