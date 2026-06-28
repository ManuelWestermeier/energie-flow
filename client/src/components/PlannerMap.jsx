import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const STYLE = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png', 'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256, attribution: '© OpenStreetMap-Mitwirkende',
    },
  },
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
};

function closeRing(ring) {
  if (!ring || ring.length < 3) return ring || [];
  const a = ring[0], b = ring[ring.length - 1];
  return a[0] === b[0] && a[1] === b[1] ? ring : [...ring, a];
}
function fc(buildings) {
  return {
    type: 'FeatureCollection',
    features: (buildings || []).map((b) => ({
      type: 'Feature', id: b.id, properties: { id: b.id },
      geometry: { type: 'Polygon', coordinates: [closeRing(b.ring)] },
    })),
  };
}
function treeFc(trees, center) {
  return {
    type: 'FeatureCollection',
    features: (trees || []).map((t) => ({
      type: 'Feature', geometry: { type: 'Point', coordinates: [t.lon, t.lat] }, properties: {},
    })),
  };
}

export default function PlannerMap({ center, buildings, selectedId, onSelect, trees = [], height = 400 }) {
  const ref = useRef(null);
  const mapRef = useRef(null);
  const readyRef = useRef(false);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    if (!ref.current || !center) return;
    const map = new maplibregl.Map({
      container: ref.current, style: STYLE,
      center: [center.lon, center.lat], zoom: 18, attributionControl: true,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    mapRef.current = map;
    map.on('load', () => {
      readyRef.current = true;
      map.addSource('buildings', { type: 'geojson', data: fc(buildings) });
      map.addSource('trees', { type: 'geojson', data: treeFc(trees) });
      map.addLayer({ id: 'b-fill', type: 'fill', source: 'buildings', paint: { 'fill-color': '#3f8f2c', 'fill-opacity': 0.16 } });
      map.addLayer({ id: 'b-line', type: 'line', source: 'buildings', paint: { 'line-color': '#2c6b22', 'line-width': 1.3 } });
      map.addLayer({ id: 'b-sel', type: 'fill', source: 'buildings', filter: ['==', ['get', 'id'], selectedId ?? -1], paint: { 'fill-color': '#e3851d', 'fill-opacity': 0.5 } });
      map.addLayer({ id: 't-dot', type: 'circle', source: 'trees', paint: { 'circle-radius': 4, 'circle-color': '#3f8f2c', 'circle-stroke-color': '#fff', 'circle-stroke-width': 1 } });
      map.on('click', 'b-fill', (e) => { const f = e.features && e.features[0]; if (f) onSelectRef.current && onSelectRef.current(f.properties.id); });
      map.on('mouseenter', 'b-fill', () => (map.getCanvas().style.cursor = 'pointer'));
      map.on('mouseleave', 'b-fill', () => (map.getCanvas().style.cursor = ''));
    });
    return () => { map.remove(); mapRef.current = null; readyRef.current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (map && center) map.flyTo({ center: [center.lon, center.lat], zoom: 18, duration: 800 });
  }, [center?.lat, center?.lon]);

  useEffect(() => {
    const map = mapRef.current;
    if (map && readyRef.current && map.getSource('buildings')) map.getSource('buildings').setData(fc(buildings));
    if (map && readyRef.current && map.getSource('trees')) map.getSource('trees').setData(treeFc(trees));
  }, [buildings, trees]);

  useEffect(() => {
    const map = mapRef.current;
    if (map && readyRef.current && map.getLayer('b-sel')) map.setFilter('b-sel', ['==', ['get', 'id'], selectedId ?? -1]);
  }, [selectedId]);

  return <div ref={ref} style={{ height }} className="w-full rounded-card overflow-hidden border border-line" />;
}
