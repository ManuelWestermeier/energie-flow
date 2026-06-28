// URL-sichere ID-Erzeugung über Web Crypto (Workers-tauglich, ohne Abhängigkeit).
const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_';
export function nid(size = 12) {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < size; i++) out += ALPHABET[bytes[i] & 63];
  return out;
}
