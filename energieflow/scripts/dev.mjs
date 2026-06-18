// ---------------------------------------------------------------------------
//  Entwicklungs-Starter – EIN Port.
//  Startet parallel:
//    1) Vite im Watch-Modus  ->  baut das Frontend bei jeder Änderung nach /dist
//    2) den Backend-Server via nodemon (Neustart bei Server-Änderungen)
//  Der Server liefert /dist aus. Es wird KEIN zweiter (Frontend-)Port geöffnet.
//  Bewusst ohne Zusatz-Abhängigkeit wie "concurrently".
// ---------------------------------------------------------------------------
import { spawn } from 'node:child_process';
import process from 'node:process';

const isWin = process.platform === 'win32';
const bin = (name) => (isWin ? `${name}.cmd` : name);

const procs = [];
function run(label, cmd, args, color) {
  const p = spawn(cmd, args, { stdio: ['inherit', 'pipe', 'pipe'], env: process.env });
  const tag = `\x1b[${color}m[${label}]\x1b[0m `;
  const pipe = (stream, out) => {
    let buf = '';
    stream.on('data', (d) => {
      buf += d.toString();
      const lines = buf.split('\n');
      buf = lines.pop();
      for (const l of lines) out.write(tag + l + '\n');
    });
  };
  pipe(p.stdout, process.stdout);
  pipe(p.stderr, process.stderr);
  p.on('exit', (code) => {
    process.stdout.write(tag + `beendet (Code ${code}).\n`);
    shutdown(code ?? 0);
  });
  procs.push(p);
  return p;
}

function shutdown(code = 0) {
  for (const p of procs) { try { p.kill('SIGTERM'); } catch {} }
  process.exit(code);
}
process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

console.log('\n  EnergieFlow – Entwicklungsmodus (ein Port)\n');
// 1) Frontend bauen (Watch). Erstbau dauert kurz; danach inkrementell.
run('vite ', bin('vite'), ['build', '--watch', '--mode', 'development'], '35');
// 2) Backend mit Auto-Neustart.
run('server', bin('nodemon'), ['--quiet', '--watch', 'server', '-e', 'js,json', 'server/src/index.js'], '36');
