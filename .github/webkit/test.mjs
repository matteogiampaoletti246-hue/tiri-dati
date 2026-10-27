// Test dell'app in WebKit (il motore di Safari) con emulazione iPhone. Salva screenshot e un rapporto.
import { webkit, devices } from 'playwright';
import { PNG } from 'pngjs';
import fs from 'fs';

const BASE = 'https://matteogiampaoletti246-hue.github.io/tiri-dati/aurora/';
const OUT = 'webkit-out';
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const report = { when: new Date().toISOString(), steps: [], errors: [], console: [] };
const lum = (buf) => { const p = PNG.sync.read(buf); let s = 0; for (let i = 0; i < p.data.length; i += 4) s += (p.data[i] + p.data[i + 1] + p.data[i + 2]) / 3; return Math.round(s / (p.data.length / 4)); };

const b = await webkit.launch();
const ctx = await b.newContext({ ...devices['iPhone 13'] });
const pg = await ctx.newPage();
pg.on('pageerror', (e) => report.errors.push(String(e).slice(0, 300)));
pg.on('console', (m) => { if (m.type() === 'error') report.console.push(m.text().slice(0, 200)); });

let n = 0;
async function shot(name, extra = {}) {
  const buf = await pg.screenshot();
  const f = `${String(++n).padStart(2, '0')}-${name}.png`;
  fs.writeFileSync(`${OUT}/${f}`, buf);
  const l = lum(buf);
  report.steps.push({ step: name, luminance: l, whiteScreen: l > 150, ...extra });
}
async function step(name, fn) {
  try { await fn(); } catch (e) { report.steps.push({ step: name, failed: String(e).slice(0, 250) }); }
}
const click = (sel) => pg.evaluate((s) => { const e = document.querySelector(s); if (e) e.click(); return !!e; }, sel);
const clickText = (t, exact = true) => pg.evaluate(([t, ex]) => { const b = [...document.querySelectorAll('button,a')].find((x) => (ex ? x.textContent.trim() === t : x.textContent.includes(t))); if (b) b.click(); return !!b; }, [t, exact]);
// swipe con eventi puntatore e touch sintetici
async function swipe(x0, y, x1, steps = 12) {
  await pg.evaluate(async ([x0, y, x1, steps]) => {
    const t = document.elementFromPoint(x0, y) || document.body;
    const pt = (type, x) => { try { t.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, pointerId: 1, pointerType: 'touch', isPrimary: true })); } catch (e) { /* ignore */ } };
    const tc = (type, x) => { try { const o = new Touch({ identifier: 1, target: t, clientX: x, clientY: y }); t.dispatchEvent(new TouchEvent(type, { bubbles: true, cancelable: true, touches: type === 'touchend' ? [] : [o], changedTouches: [o], targetTouches: type === 'touchend' ? [] : [o] })); } catch (e) { /* Touch non disponibile */ } };
    pt('pointerdown', x0); tc('touchstart', x0);
    for (let i = 1; i <= steps; i++) { const x = x0 + ((x1 - x0) * i) / steps; pt('pointermove', x); tc('touchmove', x); await new Promise((r) => setTimeout(r, 16)); }
    pt('pointerup', x1); tc('touchend', x1);
  }, [x0, y, x1, steps]);
}
const wait = (ms) => pg.waitForTimeout(ms);

await step('home', async () => { await pg.goto(BASE); await wait(7000); await shot('home'); });
await step('support', async () => {
  const s = await pg.evaluate(() => ({ colorMix: CSS.supports('background', 'color-mix(in srgb, red 20%, transparent)'), cv: CSS.supports('content-visibility', 'auto'), touch: typeof Touch !== 'undefined', backdrop: CSS.supports('backdrop-filter', 'blur(2px)') || CSS.supports('-webkit-backdrop-filter', 'blur(2px)'), ua: navigator.userAgent }));
  report.support = s;
});
await step('giorni', async () => { await clickText('Domani', false); await wait(1200); await shot('home-domani'); await clickText('Oggi', false); await wait(800); });
await step('partita', async () => {
  const ok = await pg.evaluate(() => { const a = [...document.querySelectorAll('a[href*="#/match/"]')].find((x) => { const r = x.getBoundingClientRect(); return r.top > 150 && r.top < 600 && r.left >= 0 && r.left < 300; }); if (a) a.click(); return !!a; });
  await wait(2500); await shot('partita', { clicked: ok });
  for (const t of ['Statistiche', 'Formazioni', 'Giocatori']) { await clickText(t); await wait(700); await shot('partita-' + t.toLowerCase()); }
  for (let i = 0; i < 4; i++) { await swipe(60, 420, 340); await wait(500); }
  await shot('partita-prima-scheda');
  await swipe(12, 420, 320); await wait(1200);
  const url = pg.url();
  report.steps.push({ step: 'swipe-indietro-dalla-partita', backToHome: !url.includes('#/match'), url });
  await shot('dopo-swipe-indietro');
});
await step('matchup', async () => {
  await pg.goto(BASE + '#/migliori-matchup'); await wait(3500);
  await clickText('Angoli'); await wait(600); await shot('matchup-tendina');
  await clickText('Tiri in porta'); await wait(900); await shot('matchup-tiri-porta');
  await swipe(300, 450, 100); await wait(1000); await shot('matchup-giorno-dopo');
});
await step('giocatore', async () => {
  await pg.goto(BASE + '#/migliori-giocatori'); await wait(3500);
  await click('a[href*="giocatore"]'); await wait(3000); await shot('giocatore-profilo');
  await clickText('Statistiche'); await wait(1500); await shot('giocatore-statistiche');
  await clickText('Stagione attuale', false); await wait(600); await shot('giocatore-tendina-stagioni');
  await swipe(12, 420, 320); await wait(1200);
  report.steps.push({ step: 'swipe-indietro-giocatore', url: pg.url() });
});
await step('squadra', async () => {
  await pg.goto(BASE + '#/squadra/inter'); await wait(3500); await shot('squadra-partite');
  for (const t of ['Classifica', 'Statistiche', 'Giocatori']) { await clickText(t); await wait(1200); await shot('squadra-' + t.toLowerCase()); }
});
await step('campionato', async () => {
  await pg.goto(BASE + '#/campionato/serie-a'); await wait(3500); await shot('campionato');
  await clickText('Giocatori'); await wait(1500);
  const t0 = []; for (let i = 0; i < 6; i++) { await pg.mouse.wheel(0, 600); await wait(150); t0.push(await pg.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === 'Vai a'); return b ? Math.round(b.getBoundingClientRect().top * 10) / 10 : null; })); }
  report.steps.push({ step: 'vai-a-posizioni', tops: t0 });
});
report.problems = report.steps.filter((s) => s.failed || s.whiteScreen || s.backToHome === false).length + report.errors.length;
fs.writeFileSync('webkit-report.json', JSON.stringify(report, null, 2));
await b.close();
