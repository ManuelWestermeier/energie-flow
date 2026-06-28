// ===========================================================================
//  lib/planner.js – Client-Logik für den PV-Planer
//  • Aufrufe an den serverseitigen Proxy (/api/planner/*)
//  • Geometrie: Projektion lon/lat -> lokale Meter, Polygonfläche, Schwerpunkt
// ===========================================================================

async function getJson(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  let data = null;
  try { data = await res.json(); } catch { /* */ }
  if (!res.ok) throw new Error((data && data.error) || `Anfrage fehlgeschlagen (${res.status})`);
  return data;
}

export const geocode = (q) => getJson('/api/planner/geocode?q=' + encodeURIComponent(q));
export const loadBuildings = (lat, lon, radius = 130) =>
  getJson(`/api/planner/buildings?lat=${lat}&lon=${lon}&radius=${radius}`);
export const simulate = ({ lat, lon, peakpower, loss = 14, angle = 35, aspect = 0 }) =>
  getJson(`/api/planner/pvgis?lat=${lat}&lon=${lon}&peakpower=${peakpower}&loss=${loss}&angle=${angle}&aspect=${aspect}`);

// ---- Geometrie -------------------------------------------------------------
const R = 6378137;
export function metersPerDegree(lat) {
  const rad = (lat * Math.PI) / 180;
  return { x: (Math.PI / 180) * R * Math.cos(rad), y: (Math.PI / 180) * R };
}

// Ring: [[lon,lat], ...] -> lokale Meter relativ zum Ursprung
export function toLocalMeters(ring, originLat, originLon) {
  const m = metersPerDegree(originLat);
  return ring.map(([lon, lat]) => [(lon - originLon) * m.x, (lat - originLat) * m.y]);
}

// Flächeninhalt in m² (Ring in lon/lat), projiziert auf Meter
export function ringAreaM2(ring, lat) {
  if (!ring || ring.length < 3) return 0;
  const m = metersPerDegree(lat);
  let a = 0;
  for (let i = 0, n = ring.length; i < n; i++) {
    const [x1, y1] = [ring[i][0] * m.x, ring[i][1] * m.y];
    const j = (i + 1) % n;
    const [x2, y2] = [ring[j][0] * m.x, ring[j][1] * m.y];
    a += x1 * y2 - x2 * y1;
  }
  return Math.abs(a) / 2;
}

// Polygon-Schwerpunkt (lon/lat)
export function centroid(ring) {
  if (!ring || ring.length === 0) return [0, 0];
  let x = 0, y = 0, n = 0;
  for (const [lon, lat] of ring) { x += lon; y += lat; n++; }
  return [x / n, y / n];
}

// Höhe schätzen: aus height-Tag, sonst Geschosse × 3 m (+ Dach), sonst Default
export function estimateHeight(b) {
  if (b && Number.isFinite(b.height)) return b.height;
  if (b && Number.isFinite(b.levels)) return b.levels * 3 + 1;
  return 9; // ~3 Geschosse
}

const ROOF_FACTOR = { flach: 0.6, pult: 0.55, sattel: 0.48, walm: 0.42, mansard: 0.45, zelt: 0.4 };
const ROOF_LABEL = {
  flach: 'Flachdach', pult: 'Pultdach', sattel: 'Satteldach',
  walm: 'Walmdach', mansard: 'Mansarddach', zelt: 'Zeltdach',
};
export const roofLabel = (t) => ROOF_LABEL[t] || 'Satteldach';
export const ROOF_TYPES = Object.keys(ROOF_LABEL);

// OSM roof:shape -> interner Typ
export function roofFromOSM(shape) {
  if (!shape) return null;
  const s = shape.toLowerCase();
  if (s.includes('flat')) return 'flach';
  if (s.includes('skillion') || s.includes('lean')) return 'pult';
  if (s.includes('hip')) return 'walm';
  if (s.includes('mansard')) return 'mansard';
  if (s.includes('pyramid')) return 'zelt';
  if (s.includes('gable')) return 'sattel';
  return null;
}

// kWp-Abschätzung aus Grundfläche, Dachtyp, Neigung und Belegung
export function estimateSystem({ footprintM2, roofType = 'sattel', tilt = 35, usable = 0.7, density = 0.19 }) {
  const base = ROOF_FACTOR[roofType] ?? 0.48;
  const planeArea = roofType === 'flach' ? footprintM2 : footprintM2 / Math.cos((tilt * Math.PI) / 180);
  const moduleArea = planeArea * base * usable;     // nutzbare Modulfläche (m²)
  const kwp = Math.max(0, moduleArea * density);    // ~0,19 kWp/m² monokristallin
  const modules = Math.round(moduleArea / 1.9);     // ~1,9 m² je Modul
  return { kwp: Math.round(kwp * 10) / 10, modules, moduleArea: Math.round(moduleArea) };
}

// Himmelsrichtung (Azimut-Grad, 0=N,90=O,180=S,270=W) -> PVGIS aspect (0=Süd,-90=Ost,+90=West)
export function azimuthToAspect(az) { return ((az - 180 + 540) % 360) - 180; }
export const COMPASS = [
  { label: 'Süd', az: 180 }, { label: 'Südost', az: 135 }, { label: 'Südwest', az: 225 },
  { label: 'Ost', az: 90 }, { label: 'West', az: 270 }, { label: 'Nord', az: 0 },
];
