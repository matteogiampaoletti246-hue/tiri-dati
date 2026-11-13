#!/usr/bin/env node
// Controllo a tappeto di Affidabilita' e Calcolatore (13/11/2026): gira il livello dati dell'app in Node (nessun telefono) e conta, per campionato,
// quanti giocatori hanno prossima partita, righe per l'Hit Rate (almeno 3) e voto di affidabilita'; poi i profili della nazionale senza club.
// Uso: node native/tools/controllo_affidabilita.mjs      (dalla radice del repository, serve solo `npx esbuild`)
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { pathToFileURL } from 'url';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const OUT = path.join(ROOT, 'controllo_bundle.tmp.mjs');
execFileSync('npx', ['--yes', 'esbuild', path.join(ROOT, 'native/tools/controllo_entry.mjs'), '--bundle', '--platform=node', '--format=esm', `--alias:@=${ROOT}/aurora-src/src`, `--outfile=${OUT}`, '--log-level=error'], { stdio: 'inherit' });

globalThis.document = { baseURI: `file://${ROOT}/aurora/`, addEventListener() {}, removeEventListener() {}, visibilityState: 'visible' };
globalThis.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
globalThis.window = globalThis;
globalThis.addEventListener = () => {}; globalThis.removeEventListener = () => {};
globalThis.fetch = async (u) => {
  u = String(u);
  if (u.includes('workers.dev')) return new Response('null', { status: 404 });
  try { return new Response(fs.readFileSync(u.replace('file://', '').split('?')[0])); } catch (e) { return new Response('', { status: 404 }); }
};
const m = await import(pathToFileURL(OUT).href);
fs.unlinkSync(OUT);
const { L, LG, T, CD, M, RF, P, CP, TP, UT, PC } = m;
await L.loadRaw();
LG.buildLeagues(); T.buildTeams(); CD.buildCalcData(); RF.buildReferees(); M.buildMatches(); P.buildPlayers();

const iso = (ts) => UT.romeDay(ts);
const tot = { giocatori: 0, senzaProssima: 0, righeMenoDi3: 0, senzaVoto: 0, squadreSenzaCampionato: 0 };
const per = {};
for (const p of P.PLAYERS) {
  if (p.nat) continue;
  tot.giocatori += 1;
  const lg = p.leagueId || '?';
  const b = (per[lg] = per[lg] || { n: 0, senzaProssima: 0, righeMenoDi3: 0, senzaVoto: 0 });
  b.n += 1;
  if (!CD.pickLeagueKey(p.teamName, null)) tot.squadreSenzaCampionato += 1;
  const fx = CD.nextFixture(p.teamName);
  if (!fx) { tot.senzaProssima += 1; b.senzaProssima += 1; }
  if (CP.hitRows(p).length < 3) { tot.righeMenoDi3 += 1; b.righeMenoDi3 += 1; }
  if (fx && !TP.playerReliability(p, iso(fx.ts), 1.5, true, 'totali')) { tot.senzaVoto += 1; b.senzaVoto += 1; }
}
const nats = P.PLAYERS.filter((p) => p.nat);
console.log('CLUB', JSON.stringify(tot));
console.log(`NAZIONALI ${nats.length}, senza profilo di club collegato: ${nats.filter((p) => !p.club).length}`);
const peggiori = Object.entries(per).filter(([, v]) => v.n >= 30).sort((a, b) => (b[1].senzaVoto + b[1].righeMenoDi3) / b[1].n - (a[1].senzaVoto + a[1].righeMenoDi3) / a[1].n).slice(0, 15);
console.log('CAMPIONATI PIU\' SCOPERTI (senza prossima partita = stagione finita, non e\' un errore)');
peggiori.forEach(([k, v]) => console.log(' ', k.padEnd(22), JSON.stringify(v)));
void PC;
process.exit(0);
