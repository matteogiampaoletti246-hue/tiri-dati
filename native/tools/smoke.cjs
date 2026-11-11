// Prova di avvio dell'app nativa SENZA telefono: impacchetta native/App.js con esbuild (pacchetti finti) e lo esegue in Node.
// Trova subito errori come "Property 'document'/'SITE' doesn't exist" o import mancanti che sul telefono fanno schermata di errore.
// Uso: node native/tools/smoke.cjs   (dalla radice del repository)
const { execSync } = require('child_process');
const OUT = '/tmp/smoke-app.cjs';
execSync(`npx --yes esbuild native/App.js --bundle --platform=node --format=cjs --packages=external --alias:@=./aurora-src/src --loader:.js=jsx --loader:.png=file --loader:.json=json --define:__DEV__=false --outfile=${OUT} --log-level=error`, { stdio: 'inherit' });
const fs = require('fs'), path = require('path'), Module = require('module');
const names = {};
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { const p = path.join(d, e.name); if (e.isDirectory()) { if (e.name !== 'node_modules' && e.name !== 'tools') walk(p); } else if (/\.js$/.test(e.name)) { const s = fs.readFileSync(p, 'utf8'); for (const m of s.matchAll(/import\s+([\w$]+\s*,\s*)?\{([^}]*)\}\s*from\s*'([^'.@][^']*|@[^'/]+\/[^']*)'/g)) { (names[m[3]] = names[m[3]] || new Set()); m[2].split(',').forEach((x) => { const n = x.trim().split(/\s+as\s+/)[0]; if (n) names[m[3]].add(n); }); } } });
walk('native'); ['aurora-src/src'].forEach(walk);
const mk = () => new Proxy(function () {}, { get: (t, k) => (k === '__esModule' ? true : k === Symbol.toPrimitive ? () => 0 : k === 'then' ? () => mk() : mk()), apply: () => mk(), construct: () => mk() });
const mod = (req) => { const o = {}; (names[req] ? [...names[req]] : []).forEach((n) => { o[n] = mk(); }); o.default = mk(); o.__esModule = true; return o; };
const orig = Module._load;
Module._load = function (req, ...a) { if (req === 'react' || req.startsWith('/') || req.startsWith('.') || req.startsWith('node:') || ['fs','path','module'].includes(req)) return orig.call(this, req, ...a); if (req === 'react/jsx-runtime') return orig.call(this, req, ...a); return mod(req); };
global.__DEV__ = false;
try { require(OUT); console.log('Prova di avvio OK: tutti i moduli si caricano'); process.exit(0); } catch (e) { process.exitCode = 1; console.error('PROVA DI AVVIO FALLITA:', e.stack.split('\n').slice(0, 6).join('\n')); }
