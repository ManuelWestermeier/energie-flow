import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { toLocalMeters, centroid, estimateHeight, metersPerDegree } from '../lib/planner.js';

function pointInPoly(x, y, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function bbox(ring) {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const [x, y] of ring) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
  return { minX, maxX, minY, maxY, w: maxX - minX, d: maxY - minY };
}
function extrude(ring, height, material) {
  const shape = new THREE.Shape();
  ring.forEach(([x, y], i) => (i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y)));
  const geo = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false });
  geo.rotateX(-Math.PI / 2);
  return new THREE.Mesh(geo, material);
}

export default function Building3D({ building, neighbors = [], trees = [], roofType = 'sattel', tilt = 35, modules = 0, lat = 50, height = 420 }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !building || !building.ring || building.ring.length < 3) return;

    const [oLon0, oLat0] = centroid(building.ring);
    const local = toLocalMeters(building.ring, oLat0, oLon0);
    const box = bbox(local);
    const span = Math.max(box.w, box.d, 12);
    const bh = estimateHeight(building);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#eef1ec');
    scene.fog = new THREE.Fog('#eef1ec', span * 4, span * 12);

    const camera = new THREE.PerspectiveCamera(50, el.clientWidth / height, 0.1, 2000);
    camera.position.set(span * 1.4, bh + span * 1.1, span * 1.6);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(el.clientWidth, height);
    el.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.maxPolarAngle = Math.PI / 2.05;
    controls.target.set(0, bh * 0.5, 0);

    // Licht (Sonne aus Sommer-Mittag-Näherung)
    const elev = (90 - lat + 23.44) * Math.PI / 180;
    const sunDir = new THREE.Vector3(Math.cos(elev) * Math.sin(Math.PI), Math.sin(elev), Math.cos(elev) * Math.cos(Math.PI));
    const sun = new THREE.DirectionalLight('#fff6e6', 1.15);
    sun.position.copy(sunDir.clone().multiplyScalar(span * 3));
    scene.add(sun);
    scene.add(new THREE.HemisphereLight('#dfeaff', '#9fae93', 0.7));
    scene.add(new THREE.AmbientLight('#ffffff', 0.25));
    const sunMesh = new THREE.Mesh(new THREE.SphereGeometry(span * 0.05, 16, 16), new THREE.MeshBasicMaterial({ color: '#ffd166' }));
    sunMesh.position.copy(sun.position);
    scene.add(sunMesh);

    // Boden
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(span * 16, span * 16), new THREE.MeshStandardMaterial({ color: '#dfe5d8' }));
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // Nachbargebäude (relativ zum gewählten Schwerpunkt)
    const neighMat = new THREE.MeshStandardMaterial({ color: '#c4cabb' });
    for (const n of neighbors) {
      if (!n.ring || n.ring.length < 3 || n.id === building.id) continue;
      const lr = toLocalMeters(n.ring, oLat0, oLon0);
      const m = extrude(lr, estimateHeight(n), neighMat);
      scene.add(m);
    }

    // Bäume (Krone + Stamm)
    const trunkMat = new THREE.MeshStandardMaterial({ color: '#6b4a2b' });
    const leafMat = new THREE.MeshStandardMaterial({ color: '#3f7a2e' });
    for (const t of trees) {
      if (t.lon == null || t.lat == null) continue;
      const [tx, ty] = toLocalMeters([[t.lon, t.lat]], oLat0, oLon0)[0];
      const th = Number.isFinite(t.height) ? t.height : 8;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.25, th * 0.45, 8), trunkMat);
      trunk.position.set(tx, th * 0.225, -ty);
      const crown = new THREE.Mesh(new THREE.ConeGeometry(th * 0.32, th * 0.7, 10), leafMat);
      crown.position.set(tx, th * 0.45 + th * 0.35, -ty);
      scene.add(trunk); scene.add(crown);
    }

    // Gewähltes Gebäude (Korpus)
    const body = extrude(local, bh, new THREE.MeshStandardMaterial({ color: '#eae6df' }));
    scene.add(body);

    // Dach (vereinfachte Masse)
    const roofMat = new THREE.MeshStandardMaterial({ color: '#9d5b3f' });
    const cx = (box.minX + box.maxX) / 2, cy = (box.minY + box.maxY) / 2;
    if (roofType === 'flach') {
      const slab = new THREE.Mesh(new THREE.BoxGeometry(box.w * 1.02, 0.5, box.d * 1.02), new THREE.MeshStandardMaterial({ color: '#cfd3c8' }));
      slab.position.set(cx, bh + 0.25, -cy);
      scene.add(slab);
    } else {
      const roofH = Math.min(Math.max(0.5 * Math.min(box.w, box.d) * Math.tan(tilt * Math.PI / 180), 1.5), 7);
      const r = 0.5 * Math.max(box.w, box.d) * 1.02;
      const pyr = new THREE.Mesh(new THREE.ConeGeometry(r, roofH, 4), roofMat);
      pyr.rotation.y = Math.PI / 4;
      pyr.scale.set(box.w / Math.max(box.w, box.d), 1, box.d / Math.max(box.w, box.d));
      pyr.position.set(cx, bh + roofH / 2, -cy);
      scene.add(pyr);
    }

    // PV-Module (illustrativ über der Grundfläche)
    const panelMat = new THREE.MeshStandardMaterial({ color: '#1b2a55', metalness: 0.3, roughness: 0.5 });
    const cap = Math.min(modules || 0, 90);
    if (cap > 0) {
      const step = 1.5;
      const group = new THREE.Group();
      let count = 0;
      for (let x = box.minX + 1; x < box.maxX - 1 && count < cap; x += step) {
        for (let y = box.minY + 1; y < box.maxY - 1 && count < cap; y += step) {
          if (!pointInPoly(x + 0.01, y + 0.01, local)) continue;
          const p = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.06, 1.3), panelMat);
          p.position.set(x, bh + (roofType === 'flach' ? 0.6 : 0.55), -y);
          if (roofType === 'flach') p.rotation.x = -0.28;
          group.add(p);
          count++;
        }
      }
      scene.add(group);
    }

    let raf;
    const loop = () => { controls.update(); renderer.render(scene, camera); raf = requestAnimationFrame(loop); };
    loop();

    const onResize = () => {
      if (!el) return;
      camera.aspect = el.clientWidth / height; camera.updateProjectionMatrix();
      renderer.setSize(el.clientWidth, height);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      controls.dispose();
      scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) { const m = o.material; (Array.isArray(m) ? m : [m]).forEach((x) => x.dispose()); } });
      renderer.dispose();
      if (renderer.domElement.parentNode === el) el.removeChild(renderer.domElement);
    };
  }, [building, neighbors, trees, roofType, tilt, modules, lat, height]);

  return <div ref={ref} style={{ height }} className="w-full rounded-card overflow-hidden border border-line bg-paper-2" />;
}
