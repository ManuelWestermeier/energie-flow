// ---------------------------------------------------------------------------
//  auth.js – Authentifizierung für Cloudflare Pages Functions
//
//  Bewusst dieselbe Architektur wie zuvor: KEIN Token, KEINE Session. Die
//  Anwendung sendet die Zugangsdaten bei jeder Anfrage per HTTP Basic mit
//  (Authorization: Basic base64(user:pass)). Geprüft wird gegen einen
//  gehashten Passwortwert.
//
//  Statt bcrypt (auf dem Workers-Runtime CPU-kritisch und nicht nativ) wird
//  PBKDF2 über die native Web-Crypto-API verwendet – schnell und ohne
//  Abhängigkeit. Format:  pbkdf2$<iterationen>$<saltB64>$<hashB64>
// ---------------------------------------------------------------------------
import { getUserByUsername } from './store.js';

const ITER = 100000;
const enc = new TextEncoder();

function bytesToB64(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
function b64ToBytes(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function derive(plain, salt, iterations) {
  const key = await crypto.subtle.importKey('raw', enc.encode(plain), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, key, 256);
  return new Uint8Array(bits);
}

export async function hashPassword(plain) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(String(plain), salt, ITER);
  return `pbkdf2$${ITER}$${bytesToB64(salt)}$${bytesToB64(hash)}`;
}

export async function verifyPassword(plain, stored) {
  if (!stored || !String(stored).startsWith('pbkdf2$')) return false;
  const [, iterStr, saltB64, hashB64] = String(stored).split('$');
  const iterations = Number(iterStr) || ITER;
  let salt, expected;
  try { salt = b64ToBytes(saltB64); expected = b64ToBytes(hashB64); } catch { return false; }
  const actual = await derive(String(plain), salt, iterations);
  if (actual.length !== expected.length) return false;
  let diff = 0; // konstante Laufzeit
  for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i];
  return diff === 0;
}

// UTF-8-sicheres Dekodieren von base64("user:pass") – wegen Umlauten.
function decodeBasic(b64) {
  let bytes;
  try { bytes = b64ToBytes(b64); } catch { return null; }
  const raw = new TextDecoder().decode(bytes);
  const i = raw.indexOf(':');
  if (i < 0) return null;
  return { username: raw.slice(0, i), password: raw.slice(i + 1) };
}
export function parseBasic(request) {
  const h = request.headers.get('Authorization') || '';
  if (!h.startsWith('Basic ')) return null;
  return decodeBasic(h.slice(6));
}

// Authentifizierten Nutzer ermitteln (oder null). db = geladenes Store-Objekt.
export async function authUser(request, db) {
  const creds = parseBasic(request);
  if (!creds || !creds.username || !creds.password) return null;
  const u = getUserByUsername(db, creds.username);
  if (!u) {
    // Etwas Arbeit leisten, um Timing-Unterschiede zu glätten.
    await derive(creds.password, enc.encode('xxxxxxxxxxxxxxxx'), 1000);
    return null;
  }
  return (await verifyPassword(creds.password, u.password_hash)) ? u : null;
}

export const profile = (u) => ({ id: u.id, username: u.username, name: u.name });
export const USERNAME_RE = /^[A-Za-z0-9_.\-]{3,32}$/;
