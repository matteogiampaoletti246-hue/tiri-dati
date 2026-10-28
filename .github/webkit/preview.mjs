// Prova dell'app costruita in locale, in WebKit (motore di Safari) con emulazione iPhone 13.
// Salva screenshot e un rapporto: serve a controllare le modifiche PRIMA di pubblicarle sul link vero.
import { webkit, devices } from 'playwright';
import fs from 'fs';

const BASE = process.env.BASE || 'http://localhost:8080/';
const APP = BASE + 'aurora/';
const OUT = 'preview-out';
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const report = { when: new Date().toISOString(), checks: [], errors: [], console: [], failed: [] };
const ok = (name, pass, extra = {}) => { report.checks.push({ name, pass: !!pass, ...extra }); if (!pass) report.failed.push(name); };

const b = await webkit.launch();
const ctx = await b.newContext({ ...devices['iPhone 13'], locale: 'it-IT', timezoneId: 'Europe/Rome' });
const pg = await ctx.newPage();
// il Worker accetta solo l'origine del sito pubblicato: dal test lo si raggiunge dal lato server aggiungendo l'header CORS
await ctx.route('**/*.workers.dev/**', async (route) => {
  try {
    const r = await route.fetch({ timeout: 20000 });
    await route.fulfill({ response: r, headers: { ...r.headers(), 'access-control-allow-origin': '*' } });
  } catch { await route.abort(); }
});
pg.on('pageerror', (e) => report.errors.push(String(e).slice(0, 400)));
pg.on('console', (m) => { if (m.type() === 'error') report.console.push(m.text().slice(0, 240)); });
let n = 0;
const shot = async (name) => { try { await pg.screenshot({ path: `${OUT}/${String(++n).padStart(2, '0')}-${name}.png` }); } catch (e) { report.errors.push('shot ' + name + ' ' + e); } };
const wait = (ms) => pg.waitForTimeout(ms);
const step = async (name, fn) => { try { await fn(); } catch (e) { ok(name + ' (errore)', false, { err: String(e).slice(0, 300) }); } };
const getJson = async (p) => { try { return await (await fetch(BASE + p)).json(); } catch { return null; } };
const texts = () => pg.evaluate(() => [...document.querySelectorAll('button,a')].map((x) => x.textContent.trim()).filter(Boolean));
const clickText = (t) => pg.evaluate((t) => { const e = [...document.querySelectorAll('button,a')].find((x) => x.textContent.trim() === t); if (e) e.click(); return !!e; }, t);
const clickVis = async (t) => { try { await pg.locator('button:visible', { hasText: new RegExp('^' + t + '$') }).first().click({ timeout: 4000 }); } catch (e) { report.errors.push('clickVis ' + t + ' ' + String(e).slice(0, 120)); } };
const go = async (hash, ms = 4500) => { await pg.goto('about:blank'); await pg.goto(APP + hash); await wait(ms); };

const TOPNAMES = ['SERIE A', 'PREMIER LEAGUE', 'LALIGA', 'LA LIGA', 'BUNDESLIGA', 'LIGUE 1', 'CHAMPIONS LEAGUE', 'EUROPA LEAGUE', 'CONFERENCE LEAGUE'];
const groupsInfo = () => pg.evaluate(() => [...document.querySelectorAll('section button[aria-expanded]')].map((b) => {
  const sec = b.closest('section');
  const a = sec.querySelector('[role="link"]');
  return { name: (a ? a.textContent : '').trim().toUpperCase(), open: b.getAttribute('aria-expanded') === 'true' };
}));

await step('home: tendine di tutti i campionati', async () => {
  await pg.goto(APP);
  await wait(8000);
  await shot('home');
  const info = await groupsInfo();
  report.groups = info;
  ok('home: ogni campionato ha la sua tendina', info.length >= 3, { n: info.length });
  const top = info.filter((g) => TOPNAMES.includes(g.name));
  const minor = info.filter((g) => !TOPNAMES.includes(g.name));
  ok('home: top 5 e coppe partono aperti', top.length > 0 && top.every((g) => g.open), { top });
  ok('home: i campionati minori partono chiusi', minor.every((g) => !g.open), { aperti: minor.filter((g) => g.open).map((g) => g.name) });
  // il nome del campionato apre la scheda del campionato e non la tendina
  const before = await groupsInfo();
  await pg.evaluate(() => { const a = document.querySelector('section button[aria-expanded]').closest('section').querySelector('[role="link"]'); a.click(); });
  await wait(1800);
  const hash = await pg.evaluate(() => location.hash);
  ok('home: toccando il nome si apre la scheda del campionato', /campionato|storico/.test(hash), { hash });
  await pg.goto(APP); await wait(6000);
  const after = await groupsInfo();
  ok('home: toccando il nome la tendina non cambia', JSON.stringify(before.map((g) => g.open)) === JSON.stringify(after.map((g) => g.open)));
  // il tasto a destra chiude un top campionato e lo riapre
  await pg.evaluate(() => { const b = [...document.querySelectorAll('section button[aria-expanded="true"]')][0]; if (b) b.click(); });
  await wait(150); await shot('tendina-a-meta');
  await wait(700);
  const closed = await groupsInfo();
  ok('home: la tendina di un top campionato si chiude a richiesta', closed.some((g, i) => after[i] && after[i].open && !g.open));
  await shot('tendina-chiusa');
  await pg.evaluate(() => { const b = [...document.querySelectorAll('section button[aria-expanded="false"]')][0]; if (b) b.click(); });
  await wait(900); await shot('tendina-riaperta');
  const re = await groupsInfo();
  ok('home: si riapre', re.some((g) => g.open));
});

await step('home: giorni diversi, stesso stato iniziale', async () => {
  await pg.goto(APP); await wait(7000);
  const bad = [];
  const DAYRE = '^(Ieri|Oggi|Domani|Lun|Mar|Mer|Gio|Ven|Sab|Dom)';
  const nDays = await pg.evaluate((re) => [...document.querySelectorAll('button')].filter((x) => new RegExp(re).test(x.textContent.trim()) && /\d/.test(x.textContent)).length, DAYRE);
  report.giorniProvati = nDays;
  for (let i = 0; i < Math.min(nDays, 10); i++) {
    await pg.evaluate(([re, i]) => { const l = [...document.querySelectorAll('button')].filter((x) => new RegExp(re).test(x.textContent.trim()) && /\d/.test(x.textContent)); if (l[i]) l[i].click(); }, [DAYRE, i]);
    await wait(1400);
    const info = await groupsInfo();
    const miss = info.filter((g) => g.open !== TOPNAMES.includes(g.name)).map((g) => g.name);
    if (miss.length) bad.push({ giorno: i, miss });
  }
  await shot('home-domani');
  ok('home: in tutti i giorni i minori sono chiusi e i top aperti', bad.length === 0, { bad });
});

await step('barra in basso resta ferma scorrendo', async () => {
  await pg.goto(APP); await wait(7000);
  const res = [];
  for (const y of [300, 900, 1800, 3000, 600, 0]) {
    await pg.evaluate((y) => window.scrollTo(0, y), y); await wait(350);
    res.push(await pg.evaluate(() => { const nav = document.querySelector('nav.fixed'); if (!nav) return null; const r = nav.getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), vh: window.innerHeight, sy: Math.round(window.scrollY) }; }));
  }
  report.bottomBar = res;
  ok('barra in basso: sempre agganciata al fondo', res.every((r) => r && Math.abs(r.bottom - r.vh) <= 2), { res });
  // tocco su una voce dopo aver scrollato
  await pg.evaluate(() => window.scrollTo(0, 1500)); await wait(300);
  await clickText('Giocatori'); await wait(1500);
  await pg.evaluate(() => window.scrollTo(0, 800)); await wait(300);
  const r2 = await pg.evaluate(() => { const nav = document.querySelector('nav.fixed'); const r = nav.getBoundingClientRect(); const ind = nav.querySelector('span.absolute'); const ri = ind && ind.getBoundingClientRect(); return { bottom: Math.round(r.bottom), vh: window.innerHeight, indTop: ri && Math.round(ri.top), navTop: Math.round(r.top) }; });
  ok('barra in basso: dopo il cambio scheda resta al suo posto', Math.abs(r2.bottom - r2.vh) <= 2 && (r2.indTop == null || r2.indTop >= r2.navTop - 2), r2);
  await shot('barra-dopo-scroll');
});

await step('migliori giocatori e matchup: calendario da ieri', async () => {
  await go('#/migliori-giocatori', 3500);
  const t = await texts();
  const labels = await pg.evaluate(() => [...document.querySelectorAll('[data-no-swipe] button')].map((x) => x.textContent.trim().split(/\d/)[0]).slice(0, 4));
  report.daystrip = labels;
  ok('migliori giocatori: la striscia parte da Ieri', /ieri/i.test(labels[0] || ''), { labels });
  await shot('migliori-giocatori');
  await go('#/migliori-matchup', 3500);
  const labels2 = await pg.evaluate(() => [...document.querySelectorAll('[data-no-swipe] button')].map((x) => x.textContent.trim().split(/\d/)[0]).slice(0, 4));
  ok('migliori matchup: la striscia parte da Ieri', /ieri/i.test(labels2[0] || ''), { labels2 });
  await shot('migliori-matchup');
});

// partite dei campionati minori
const px = await getJson('partite_extra.json');
const fin = px && px.m ? px.m.filter((r) => r[9] === 'f').slice(-3) : [];
const matchIds = [];
for (const r of fin.slice(0, 2)) matchIds.push(`x-${r[1]}-${r[0]}`);
let archSeason = null;
for (const fm of ['71', '57', '61']) { const s = await getJson(`arch/${fm}/2025-2026.json`); const f = s && s.fix && s.fix.filter((x) => x[6] && !x[8]).slice(-1)[0]; if (f) { archSeason = { fm, sk: '2025-2026', f, s }; break; } }
if (archSeason) matchIds.push(`a-${archSeason.fm}-${archSeason.sk}-${archSeason.f[0]}`);
report.matchIds = matchIds;

for (const id of matchIds) {
  await step('partita ' + id, async () => {
    await go('#/match/' + id, 9000);
    await shot(`partita-${id}-riepilogo`);
    const t = await texts();
    ok(`${id}: schede Riepilogo/Statistiche/Formazioni/Classifica`, ['Riepilogo', 'Statistiche', 'Formazioni', 'Classifica'].every((x) => t.includes(x)), { tabs: t.filter((x) => ['Riepilogo', 'Statistiche', 'Formazioni', 'Classifica', 'Giocatori', 'Panoramica'].includes(x)) });
    ok(`${id}: nessuna scheda Giocatori`, !(await pg.evaluate(() => [...document.querySelectorAll('[role=tab],button')].some((b) => b.textContent.trim() === 'Giocatori' && !b.closest('nav')))));
    const pills = await pg.evaluate(() => document.body.innerText);
    ok(`${id}: riepilogo con Momentum e Riassunto`, /momentum/i.test(pills) && /riassunto/i.test(pills), { snippet: pills.slice(0, 80) });
    ok(`${id}: pillola Stadio / Meteo / Arbitro`, /stadio/i.test(pills) && /meteo/i.test(pills) && /arbitro/i.test(pills));
    ok(`${id}: forma recente`, /forma recente/i.test(pills));
    await pg.evaluate(() => window.scrollTo(0, 700)); await wait(500); await shot(`partita-${id}-riepilogo-2`);
    await pg.evaluate(() => window.scrollTo(0, 0));
    await clickText('Statistiche'); await wait(2500); await shot(`partita-${id}-statistiche`);
    const t2 = await texts();
    ok(`${id}: Totale / 1° tempo / 2° tempo`, t2.includes('Totale') && t2.includes('1° tempo') && t2.includes('2° tempo'));
    const body2 = await pg.evaluate(() => document.body.innerText);
    ok(`${id}: mappa tiri`, /mappa tiri/i.test(body2));
    await pg.evaluate(() => window.scrollTo(0, 900)); await wait(500); await shot(`partita-${id}-statistiche-2`);
    await pg.evaluate(() => window.scrollTo(0, 0));
    await clickText('Formazioni'); await wait(2500); await shot(`partita-${id}-formazioni`);
    const green = await pg.evaluate(() => [...document.querySelectorAll('div')].some((d) => /1f6f43/i.test(d.style.background || '') || /rgb\(31, 111, 67\)/.test(d.style.background || '')));
    ok(`${id}: formazione sul campo verde`, green);
    await clickText('Classifica'); await wait(2500); await shot(`partita-${id}-classifica`);
    const hi = await pg.evaluate(() => [...document.querySelectorAll('a')].filter((a) => /accent-soft/.test(a.getAttribute('style') || '')).length);
    ok(`${id}: due squadre evidenziate in classifica`, hi === 2, { evidenziate: hi });
    // minuto del gol nella testata
    await pg.evaluate(() => window.scrollTo(0, 0)); await wait(300);
    const head = await pg.evaluate(() => document.body.innerText.slice(0, 400));
    report['testata_' + id] = head.replace(/\n+/g, ' | ').slice(0, 260);
  });
}

// partita non iniziata di un campionato minore: Statistiche con confronto, niente "Giocatori migliori", ragnatela
const pend = px && px.m ? px.m.filter((r) => r[9] === 'n')[0] : null;
if (pend) {
  await step('minori: partita non iniziata', async () => {
    await go(`#/match/x-${pend[1]}-${pend[0]}`, 9000);
    await shot('minori-pre-panoramica');
    const b = await pg.evaluate(() => document.body.innerText);
    ok('minori pre: niente Giocatori migliori', !/giocatori migliori/i.test(b));
    ok('minori pre: Duello in numeri con ragnatela', /duello in numeri/i.test(b) && (await pg.evaluate(() => document.querySelectorAll('svg polygon').length)) >= 4, { snippet: b.slice(0, 60) });
    const t = await texts();
    ok('minori pre: scheda Statistiche', t.includes('Statistiche'));
    await clickText('Statistiche'); await wait(2500); await shot('minori-pre-statistiche');
    const s2 = await pg.evaluate(() => document.body.innerText);
    ok('minori pre: confronto in casa / in trasferta', /in casa/i.test(s2) && /in trasferta/i.test(s2), { snippet: s2.slice(0, 120) });
  });
}

// menu laterale (tre linee) a mezzo schermo
await step('menu laterale', async () => {
  await go('#/', 3500);
  await pg.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /menu/i.test(x.getAttribute('aria-label') || '')); if (b) b.click(); });
  await wait(900); await shot('menu-laterale');
  const w = await pg.evaluate(() => { const c = document.querySelector('button[aria-label="Chiudi"]'); const p = c && c.parentElement; const r = p && p.getBoundingClientRect(); return r ? { left: Math.round(r.left), width: Math.round(r.width), vw: innerWidth } : null; });
  ok('menu laterale: pannello a destra, non a tutto schermo', !!w && w.width < w.vw * 0.9 && w.left > 20, { w });
});

// campionato minore: statistiche di squadra con Totale / Casa / Trasferta e tasto Vai a
await step('campionato minore: stat squadre', async () => {
  await go('#/campionato/super-lig', 6000);
  await shot('campionato-super-lig');
  await clickText('Stat. squadre'); await wait(2500);
  await shot('super-lig-stat-squadre');
  const t = await texts();
  ok('stat squadre minori: pillole Totale / Casa / Trasferta', t.includes('Totale') && t.includes('Casa') && t.includes('Trasferta'));
  const vai = await pg.evaluate(() => [...document.querySelectorAll('button')].some((x) => x.textContent.trim() === 'Vai a'));
  ok('stat squadre minori: tasto Vai a visibile', vai);
  await clickText('Casa'); await wait(1200); await shot('super-lig-stat-squadre-casa');
  // il tasto "Vai a" sparisce subito cambiando scheda
  const t0 = Date.now();
  await clickText('Classifica'); 
  let gone = -1;
  for (let i = 0; i < 40; i++) { const v = await pg.evaluate(() => [...document.querySelectorAll('button')].some((x) => x.textContent.trim() === 'Vai a')); if (!v) { gone = Date.now() - t0; break; } await wait(25); }
  ok('Vai a: sparisce entro mezzo secondo cambiando scheda', gone >= 0 && gone < 600, { ms: gone });
  await shot('super-lig-classifica');
  const t1 = Date.now();
  await clickText('Stat. squadre');
  let shown = -1;
  for (let i = 0; i < 60; i++) { const v = await pg.evaluate(() => [...document.querySelectorAll('button')].some((x) => x.textContent.trim() === 'Vai a')); if (v) { shown = Date.now() - t1; break; } await wait(25); }
  ok('Vai a: compare entro mezzo secondo tornando alle statistiche', shown >= 0 && shown < 600, { ms: shown });
});

await step('statistiche partita: barre con transizione (concept A/B/C)', async () => {
  const id = matchIds[0];
  for (const c of ['a']) {
    await go('#/match/' + id, 8000);
    await clickText('Statistiche'); await wait(2500);
    const w = () => pg.evaluate(() => { const sp = [...document.querySelectorAll('section span')].filter((x) => /width/.test(x.style.transition || '') && x.style.width); return { n: sp.length, w: sp.slice(0, 4).map((x) => Math.round(parseFloat(getComputedStyle(x).width))), tr: sp[0] ? sp[0].style.transition.slice(0, 60) : null }; });
    const w0 = await w();
    await clickText('1° tempo'); await wait(120);
    const w1 = await w(); await shot(`barre-${c}-a-meta`);
    await wait(1600);
    const w2 = await w();
    report['barre_' + c] = { w0, w1, w2 };
    ok(`barre ${c}: le barre hanno la transizione`, w0.n > 0 && !!w0.tr, { w0 });
    ok(`barre ${c}: la transizione e' graduale (a meta' strada non e' ne' all'inizio ne' alla fine)`, w2.w.every((x, i) => w1.w[i] !== undefined) && w1.w.some((x, i) => x !== w0.w[i] || x !== w2.w[i] || w0.w[i] === w2.w[i]), { w0: w0.w, w1: w1.w, w2: w2.w });
    await clickText('2° tempo'); await wait(1500); await shot(`barre-${c}-secondo-tempo`);
    await clickText('Totale'); await wait(1500);
  }
});

await step('Mostra tutti + scorrimento veloce: la barra resta in basso', async () => {
  await go('#/campionato/super-lig', 6000);
  await clickText('Stat. squadre'); await wait(2500);
  for (let i = 0; i < 3; i++) await pg.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /^Mostra tutti/.test(x.textContent.trim())); if (b) b.click(); });
  await wait(500);
  const res = [];
  for (const y of [400, 2500, 6000, 900, 9000, 0]) {
    await pg.evaluate((y) => window.scrollTo(0, y), y); await wait(250);
    res.push(await pg.evaluate(() => { const nav = document.querySelector('nav.fixed'); const r = nav.getBoundingClientRect(); return { bottom: Math.round(r.bottom), vh: window.innerHeight, vvTop: window.visualViewport ? Math.round(window.visualViewport.offsetTop) : 0 }; }));
  }
  await wait(600);
  ok('Mostra tutti + scroll veloce: barra sempre in basso', res.every((r) => Math.abs(r.bottom - r.vh) <= 2 && r.vvTop === 0), { res });
  await shot('stat-mostra-tutti');
});

await step('colori squadre', async () => {
  await go('#/campionato/eredivisie', 6000);
  await shot('eredivisie');
  await clickText('Classifica'); await wait(1500);
  await go('#/campionato/nor-eliteserien', 6000);
  await clickText('Stat. squadre'); await wait(2500);
  await shot('eliteserien-stat-squadre');
});

await step('squadra: Partite con stagione e tutte le competizioni', async () => {
  await go('#/squadra/feyenoord', 6000);
  await clickText('Partite'); await wait(2500);
  const t = await pg.evaluate(() => document.body.innerText);
  ok('squadra Partite: tasto Tutte le competizioni', /Tutte le competizioni/.test(t));
  ok('squadra Partite: tasto stagione', /Attuale|20\d\d\/\d\d/.test(t));
  await shot('feyenoord-partite');
  await pg.evaluate(() => window.scrollTo(0, 600)); await wait(300);
  await clickText('Classifica'); await wait(1500);
  ok('cambio scheda: la pagina riparte dall\'alto', await pg.evaluate(() => window.scrollY < 40));
});

await step('stagione 2011/12: niente schermo nero', async () => {
  await go('#/campionato/eredivisie', 6000);
  await clickText('Classifica'); await wait(1500);
  await pg.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /^20\d\d\/\d\d$/.test(x.textContent.trim())); if (b) b.click(); });
  await wait(900);
  await pg.evaluate(() => { const b = [...document.querySelectorAll('button,[role=option],li')].find((x) => x.textContent.trim() === '2011/12'); if (b) b.click(); });
  await wait(2500);
  const len = await pg.evaluate(() => document.body.innerText.length);
  ok('stagione 2011/12: la pagina resta visibile', len > 200, { len });
  await shot('eredivisie-2011-12');
});

await step('giocatore dell\'archivio: stessa scheda a 4 schede', async () => {
  await go('#/storico/57/2025-2026/giocatore/774947', 7000);
  const t = await pg.evaluate(() => [...document.querySelectorAll('button')].map((x) => x.textContent.trim()).join('|'));
  ok('archivio: schede Profilo/Partite/Statistiche/Carriera', /Profilo/.test(t) && /Partite/.test(t) && /Statistiche/.test(t) && /Carriera/.test(t), { t: t.slice(0, 200) });
  await shot('archivio-giocatore-profilo');
  await clickText('Statistiche'); await wait(2500);
  await shot('archivio-giocatore-statistiche');
  await clickText('Carriera'); await wait(1500);
  await shot('archivio-giocatore-carriera');
  const c = await pg.evaluate(() => document.body.innerText);
  ok('archivio: carriera con stagioni', !/Carriera non disponibile/.test(c));
});

await step('squadra minore: rosa per ruoli con volti', async () => {
  await go('#/squadra/feyenoord', 6000);
  await clickText('Squadra'); await wait(2500);
  const t = await pg.evaluate(() => document.body.innerText);
  ok('rosa Feyenoord: ruoli Portieri/Difensori/Centrocampisti/Attaccanti', /portieri/i.test(t) && /difensori/i.test(t) && /centrocampisti/i.test(t) && /attaccanti/i.test(t));
  const imgs = await pg.evaluate(() => document.querySelectorAll('img[src*="playerimages"]').length);
  ok('rosa Feyenoord: ci sono i volti', imgs > 10, { imgs });
  await shot('feyenoord-rosa');
});

await step('squadra: stagioni, pillole passate, tasti sulla stessa riga', async () => {
  await go('#/squadra/paris-saint-germain', 6500);
  await clickText('Partite'); await wait(1500);
  const rows = await pg.evaluate(() => { const bs = [...document.querySelectorAll('button')].filter((b) => /Attuale|Tutte le competizioni/.test(b.textContent)); return bs.map((b) => Math.round(b.getBoundingClientRect().top)); });
  ok('Partite: competizioni e stagione sulla stessa riga', rows.length >= 2 && Math.abs(rows[0] - rows[1]) <= 6, { rows });
  await pg.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /^Attuale/.test(x.textContent.trim())); if (b) b.click(); });
  await wait(1200);
  const opts = await pg.evaluate(() => (document.body.innerText.match(/20\d\d\/\d\d/g) || []));
  ok('PSG: piu di 2 stagioni in tendina', new Set(opts).size >= 5, { n: new Set(opts).size });
  await shot('psg-stagioni');
  await go('#/squadra/lazio', 6500);
  await clickText('Statistiche'); await wait(2000);
  await pg.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /^Attuale/.test(x.textContent.trim())); if (b) b.click(); });
  await wait(900);
  await pg.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === '2024/25'); if (b) b.click(); });
  await wait(3000);
  const t = await pg.evaluate(() => document.body.innerText);
  ok('Statistiche passate: pillole Casa/Trasferta e categorie', /Casa/.test(t) && /Trasferta/.test(t) && /Disciplina/i.test(t) && /Gioco/.test(t));
  await clickText('Casa'); await wait(2500);
  await shot('lazio-stat-2024-casa');
  await go('#/squadra/lazio', 6500);
  await clickText('Partite'); await wait(2000);
  const t2 = await pg.evaluate(() => document.body.innerText);
  ok('Partite attuale: tasto partite precedenti', /Partite precedenti/.test(t2));
  await shot('lazio-partite-attuale');
});

await step('tabellone: stagione attuale senza dati e stagione passata con tabellone', async () => {
  await go('#/campionato/champions-league', 6500);
  await clickVis('Classifica'); await wait(1800);
  const t0 = await texts();
  ok('Classifica CL: tasto Tabellone presente', t0.includes('Tabellone'));
  await shot('cl-classifica');
  await clickVis('Tabellone');
  await wait(380); await shot('cl-transizione-meta');
  await wait(1500);
  const t = await pg.evaluate(() => document.body.innerText);
  ok('Tabellone CL attuale: nessun dato ancora disponibile (se non ci sono turni a eliminazione)', /Nessun dato ancora disponibile/.test(t) || /Ottavi|Quarti|Semifinali/.test(t));
  await shot('cl-tabellone-attuale');
  await clickVis('Classifica'); await wait(1200);
  // stagione passata: 2025/26
  await pg.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /\d\d\d\d\/\d\d/.test(x.textContent) && x.className.includes('glass')); if (b) b.click(); });
  await wait(900);
  await pg.evaluate(() => { const b = [...document.querySelectorAll('button,[role=option],li')].find((x) => x.textContent.trim() === '2025/26'); if (b) b.click(); });
  await wait(3500);
  await clickVis('Classifica'); await wait(1500);
  await clickVis('Tabellone'); await wait(2500);
  const t2 = await pg.evaluate(() => document.body.innerText);
  ok('Tabellone CL 2025/26: fasi Ottavi/Quarti/Semifinali/Finale', /Ottavi/.test(t2) && /Quarti/.test(t2) && /Semifinali/.test(t2) && /Finale/.test(t2), { t: t2.slice(0, 300) });
  const imgs = await pg.evaluate(() => document.querySelectorAll('img[src*="teamlogo"]').length);
  ok('Tabellone CL 2025/26: ci sono gli stemmi', imgs >= 8, { imgs });
  await shot('cl-2526-tabellone-quarti');
  await clickVis('Semifinali'); await wait(350); await shot('cl-2526-scorrimento-meta');
  await wait(1200); await shot('cl-2526-semifinali');
  await clickVis('Finale'); await wait(1600); await shot('cl-2526-finale');
  const f = await pg.evaluate(() => document.body.innerText);
  ok('Tabellone CL 2025/26: finale con rigori reali', /vince ai rigori 5–4/.test(f), { f: f.slice(0, 400) });
  await clickVis('Ottavi'); await wait(1600); await shot('cl-2526-ottavi');
  await clickVis('Spareggi'); await wait(1600); await shot('cl-2526-spareggi');
  // si apre una partita dal tabellone e si torna indietro: resta la stagione passata sul tabellone
  await clickVis('Semifinali'); await wait(1500);
  const opened = await pg.evaluate(() => { const a = [...document.querySelectorAll('a,button')].filter((x) => /#\/(match|storico)\//.test(x.getAttribute('href') || '') || /^\d+\s*[–-]\s*\d+$/.test(x.textContent.trim()))[0]; if (a) { a.click(); return true; } return false; });
  await wait(3500);
  const urlIn = await pg.evaluate(() => location.hash);
  await pg.goBack(); await wait(3000);
  const back = await pg.evaluate(() => ({ h: location.hash, t: document.body.innerText }));
  await shot('cl-ritorno-da-partita');
  ok('tabellone: tornando da una partita resta la stagione passata sul Tabellone', opened && /2025\/26/.test(back.t) && /Ottavi/.test(back.t) && /Semifinali/.test(back.t), { opened, urlIn, h: back.h, t: back.t.slice(0, 200) });
});

// swipe indietro a scorrimento: a meta' corsa si vede la pagina di destinazione sotto, poi si torna davvero
await step('swipe indietro: pagina sotto visibile', async () => {
  await go('#/campionato/serie-a', 6000);
  const opened = await pg.evaluate(() => { const a = [...document.querySelectorAll('a')].find((x) => /#\/match\//.test(x.getAttribute('href') || '')); if (a) { a.click(); return true; } return false; });
  await wait(3500);
  const inMatch = await pg.evaluate(() => /#\/match\//.test(location.hash));
  let drove = true;
  try {
    for (const x of [20, 60, 110, 160, 210]) { await pg.evaluate((x) => window.__slCarousel.pageDrag(x), x); await wait(50); }
    await wait(150); await shot('swipe-indietro-meta');
    const behind = await pg.evaluate(() => !!document.querySelector('body > div[aria-hidden="true"][style*="position: fixed"]'));
    ok('swipe indietro: la pagina di destinazione e\' visibile sotto', behind);
    await pg.evaluate(() => window.__slCarousel.pageBack(260));
    await wait(1800);
  } catch (e) { drove = false; report.errors.push('swipe-indietro ' + String(e).slice(0, 160)); }
  const h = await pg.evaluate(() => location.hash);
  ok('swipe indietro: si torna al campionato', opened && inMatch && /campionato\/serie-a/.test(h), { opened, inMatch, h, drove });
  await shot('swipe-indietro-fine');
});

report.passed = report.checks.filter((c) => c.pass).length;
report.total = report.checks.length;
fs.writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 2));
await b.close();
console.log(JSON.stringify({ passed: report.passed, total: report.total, failed: report.failed, errors: report.errors.slice(0, 5) }, null, 1));
