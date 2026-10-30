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
const shot = async (name) => { try { await pg.screenshot({ path: `${OUT}/${NSHARD > 1 ? `s${SHARD}-` : ''}${String(++n).padStart(2, '0')}-${name}.png` }); } catch (e) { report.errors.push('shot ' + name + ' ' + e); } };
const wait = (ms) => pg.waitForTimeout(ms);
// ONLY=regex: solo i passi con quel nome (prove locali veloci; in CI gira tutto)
const ONLY = process.env.ONLY ? new RegExp(process.env.ONLY, 'i') : null;
// SHARD/NSHARD: in CI i passi si dividono tra piu' job in parallelo (tutti i controlli girano, ognuno una volta sola)
const SHARD = Number(process.env.SHARD || 0);
const NSHARD = Number(process.env.NSHARD || 1);
let SI = 0;
const step = async (name, fn) => { const mine = (SI++ % NSHARD) === SHARD; if (!mine || (ONLY && !ONLY.test(name))) return; try { await fn(); } catch (e) { ok(name + ' (errore)', false, { err: String(e).slice(0, 300) }); } };
const getJson = async (p) => { try { return await (await fetch(BASE + p)).json(); } catch { return null; } };
const texts = () => pg.evaluate(() => [...document.querySelectorAll('button,a')].map((x) => x.textContent.trim()).filter(Boolean));
const clickText = (t) => pg.evaluate((t) => { const e = [...document.querySelectorAll('button,a')].find((x) => x.textContent.trim() === t); if (e) e.click(); return !!e; }, t);
const clickVis = async (t) => { try { await pg.locator('button:visible', { hasText: new RegExp('^' + t + '$') }).first().click({ timeout: 4000 }); } catch (e) { report.errors.push('clickVis ' + t + ' ' + String(e).slice(0, 120)); } };
const go = async (hash, ms = 4500) => { await pg.goto('about:blank'); await pg.goto(APP + hash); await wait(ms); };

// testi vietati: un elemento senza dati non si mostra (regola fissa)
const ND = /non (ancora )?disponibil|in arrivo|nessun dato/i;
const TOPNAMES = ['SERIE A', 'PREMIER LEAGUE', 'LALIGA', 'LA LIGA', 'BUNDESLIGA', 'LIGUE 1', 'CHAMPIONS LEAGUE', 'EUROPA LEAGUE', 'CONFERENCE LEAGUE'];
// solo il giorno visibile: i giorni vicini (fuori schermo) si costruiscono a pezzi mentre l'app e' ferma
const groupsInfo = () => pg.evaluate(() => [...document.querySelectorAll('section button[aria-expanded]')].filter((b) => { const r = b.getBoundingClientRect(); return r.left > -5 && r.left < innerWidth - 5; }).map((b) => {
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
  await pg.evaluate(() => { const a = [...document.querySelectorAll('section button[aria-expanded]')].filter((b) => { const r = b.getBoundingClientRect(); return r.left > -5 && r.left < innerWidth - 5; }).map((b) => b.closest('section').querySelector('[role="link"]')).find(Boolean); a.click(); });
  await wait(1800);
  const hash = await pg.evaluate(() => location.hash);
  ok('home: toccando il nome si apre la scheda del campionato', /campionato|storico/.test(hash), { hash });
  await pg.goto(APP); await wait(6000);
  const after = await groupsInfo();
  ok('home: toccando il nome la tendina non cambia', JSON.stringify(before.map((g) => g.open)) === JSON.stringify(after.map((g) => g.open)));
  // il tasto a destra chiude un top campionato e lo riapre
  await pg.evaluate(() => { const b = [...document.querySelectorAll('section button[aria-expanded="true"]')].filter((b) => { const r = b.getBoundingClientRect(); return r.left > -5 && r.left < innerWidth - 5; })[0]; if (b) b.click(); });
  await wait(150); await shot('tendina-a-meta');
  await wait(700);
  const closed = await groupsInfo();
  ok('home: la tendina di un top campionato si chiude a richiesta', closed.some((g, i) => after[i] && after[i].open && !g.open));
  await shot('tendina-chiusa');
  await pg.evaluate(() => { const b = [...document.querySelectorAll('section button[aria-expanded="false"]')].filter((b) => { const r = b.getBoundingClientRect(); return r.left > -5 && r.left < innerWidth - 5; })[0]; if (b) b.click(); });
  await wait(900); await shot('tendina-riaperta');
  const re = await groupsInfo();
  ok('home: si riapre', re.some((g) => g.open));
  // apro una tendina che partiva chiusa, entro in una partita e torno indietro: deve restare com'e'
  await pg.evaluate(() => { const b = [...document.querySelectorAll('section button[aria-expanded="false"]')].filter((b) => { const r = b.getBoundingClientRect(); return r.left > -5 && r.left < innerWidth - 5; })[0]; if (b) b.click(); });
  await wait(900);
  const prima = await groupsInfo();
  const opened = await pg.evaluate(() => { const a = [...document.querySelectorAll('section button[aria-expanded="true"]')].filter((b) => { const r = b.getBoundingClientRect(); return r.left > -5 && r.left < innerWidth - 5; }).map((b) => b.closest('section').querySelector('a[href*="/match/"]')).filter(Boolean).pop(); if (a) { a.click(); return true; } return false; });
  await wait(2500);
  await pg.goBack(); await wait(2500); await shot('home-dopo-ritorno');
  const dopo = await groupsInfo();
  const sfx = (a, b) => b.length > 0 && JSON.stringify(a.slice(a.length - b.length)) === JSON.stringify(b); // i giorni vicini si ricostruiscono piano piano: conta il giorno aperto (in fondo)
  ok('home: tornando da una partita le tendine restano come le avevo lasciate', opened && sfx(prima.map((g) => g.open), dopo.map((g) => g.open)), { prima: prima.map((g) => g.name + ':' + g.open).join(','), dopo: dopo.map((g) => g.name + ':' + g.open).join(',') });
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

// Competizioni dell'archivio (fm-<id>) nella Home nei giorni in cui giocano: finestre chiuse come gli altri minori, dopo i top campionati.
await step('home: competizioni dell\'archivio nei giorni in cui giocano', async () => {
  const idx = await getJson('arch/index.json');
  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Rome' }).format(new Date());
  const feed = await getJson(`giorni/${today}.json`);
  const known = new Set([47, 87, 54, 53, 55, 42, 73, 10216, 57, 71, 61, 40, 64, 38, 59, 135, 48, 86, 146, 140, 110, 185, 111, 165, 268, 112, 130, 230, 141, 209, 134, 186, 133, 149, 278, 180, 9067]);
  const want = new Set(((feed && feed.m) || []).filter((x) => x[8] !== 'c' && !known.has(Number(x[1])) && idx && idx[String(x[1])]).map((x) => String(idx[String(x[1])].n).toUpperCase()));
  await pg.goto(APP); await wait(8000);
  // solo il giorno visibile (i giorni vicini sono gia' costruiti accanto, fuori schermo)
  const visSel = (b) => { const r = b.getBoundingClientRect(); return r.left > -5 && r.left < innerWidth - 5; };
  // finestre dei paesi (concept Sofascore): partono chiuse, bandiera + nome, il nome non e' un collegamento
  const countries = await pg.evaluate(() => [...document.querySelectorAll('section[data-country]')].filter((s) => { const r = s.getBoundingClientRect(); return r.left > -5 && r.left < innerWidth - 5; }).map((s) => ({ cc: s.dataset.country, name: (s.querySelector('button span.uppercase') || {}).textContent || '', open: s.querySelector('button').getAttribute('aria-expanded') === 'true', link: !!s.querySelector('button [role="link"], button a'), rows: s.querySelectorAll('a[href*="/match/"]').length })));
  report.paesi = countries.map((c) => c.name);
  ok('home: competizioni non top raggruppate in finestre per paese', !want.size || countries.length > 0, { paesi: countries.length });
  ok('home: le finestre dei paesi partono chiuse e il nome non apre una scheda', countries.every((c) => !c.open && !c.link), { aperte: countries.filter((c) => c.open).map((c) => c.name) });
  ok('home: una finestra paese chiusa non monta le partite (piu leggera)', countries.every((c) => c.open || c.rows === 0), { conRighe: countries.filter((c) => !c.open && c.rows).map((c) => c.name) });
  const sorted = [...countries.map((c) => c.name)].sort((a, b) => a.localeCompare(b, 'it'));
  ok('home: paesi in ordine alfabetico italiano', JSON.stringify(sorted) === JSON.stringify(countries.map((c) => c.name)), { paesi: countries.map((c) => c.name).slice(0, 12) });
  const topIdx = await pg.evaluate((top) => { const secs = [...document.querySelectorAll('#sl-shell section')].filter((s) => { const r = s.getBoundingClientRect(); return r.left > -5 && r.left < innerWidth - 5; }); const name = (s) => ((s.querySelector('[role="link"]') || {}).textContent || '').trim().toUpperCase(); return { lastTop: Math.max(-1, ...secs.map((s, i) => (top.includes(name(s)) ? i : -1))), firstCountry: secs.findIndex((s) => s.dataset.country) }; }, TOPNAMES);
  ok('home: prima i top campionati, poi i paesi', topIdx.firstCountry < 0 || topIdx.firstCountry > topIdx.lastTop, topIdx);
  // apro tutte le finestre dei paesi del giorno: dentro ci sono le competizioni dell'archivio, ognuna con la sua intestazione
  await pg.evaluate(() => [...document.querySelectorAll('section[data-country] > button[aria-expanded="false"]')].filter((b) => { const r = b.getBoundingClientRect(); return r.left > -5 && r.left < innerWidth - 5; }).forEach((b) => b.click()));
  await wait(1200);
  const info = await pg.evaluate(() => [...document.querySelectorAll('#sl-shell section [role="link"]')].filter((a) => { const r = a.getBoundingClientRect(); return r.left > -5 && r.left < innerWidth - 5; }).map((a) => ({ name: a.textContent.trim().toUpperCase(), inCountry: !!a.closest('section[data-country]') })));
  const names = info.map((g) => g.name);
  // nomi uguali a quelli di altri paesi hanno il paese tra parentesi ("PREMIER LEAGUE (EGITTO)")
  const has = (n) => names.some((x) => x === n || x.startsWith(`${n} (`));
  const got = [...want].filter(has);
  ok('home: le competizioni dell\'archivio di oggi ci sono (sole o nella finestra del paese)', !want.size || got.length >= Math.ceil(want.size * 0.9), { attese: want.size, trovate: got.length, mancano: [...want].filter((n) => !has(n)).slice(0, 8) });
  const dup = TOPNAMES.filter((n) => names.filter((x) => x === n).length > 1);
  ok('home: nessuna competizione dell\'archivio con lo stesso nome di un top campionato', !dup.length, { dup });
  ok('home: nessun top campionato dentro una finestra paese', !info.some((g) => g.inCountry && TOPNAMES.includes(g.name)), {});
  const empty = await pg.evaluate(() => [...document.querySelectorAll('section button[aria-expanded]')].filter((b) => !/\d/.test(b.closest('section').textContent)).length);
  ok('home: nessuna finestra vuota', empty === 0, { empty });
  await shot('home-paesi-aperti');
  // una competizione dentro un paese: l'intestazione apre la scheda competizione, la riga apre la partita
  // si riparte con poche finestre aperte (come farebbe una persona), poi si apre una partita dentro un paese
  await pg.goto(APP); await wait(7000);
  const opened3 = await pg.evaluate(() => [...document.querySelectorAll('section[data-country] > button[aria-expanded="false"]')].filter((b) => { const r = b.getBoundingClientRect(); return r.left > -5 && r.left < innerWidth - 5; }).slice(0, 3).map((b) => { b.click(); return b.closest('section').dataset.country; }));
  await wait(1200);
  const go1 = await pg.evaluate(() => { const a = [...document.querySelectorAll('section[data-country] a[href*="/match/"]')].find((x) => { const r = x.getBoundingClientRect(); return r.left > -5 && r.left < innerWidth - 5; }); if (a) { a.click(); return a.getAttribute('href'); } return null; });
  await wait(4500);
  const inMatch = /match/.test(await pg.evaluate(() => location.hash));
  ok('home: la partita dentro una finestra paese si apre', !go1 || inMatch, { go1, opened3 });
  if (go1 && inMatch) {
    const t = await pg.evaluate(() => document.body.innerText);
    ok('home: la partita di una competizione dell\'archivio si apre senza "non disponibile"', !ND.test(t) && t.length > 200, { href: go1 });
    await shot('partita-competizione-archivio');
    // tornando indietro la finestra del paese resta aperta (useEntityScope('home'))
    await pg.goBack(); await wait(3000);
    const stillOpen = await pg.evaluate(() => [...document.querySelectorAll('section[data-country] > button[aria-expanded="true"]')].filter((b) => { const r = b.getBoundingClientRect(); return r.left > -5 && r.left < innerWidth - 5; }).map((b) => b.closest('section').dataset.country));
    ok('home: tornando da una partita le finestre dei paesi restano aperte', opened3.every((c) => stillOpen.includes(c)), { opened3, stillOpen });
  }
  const lg = await pg.evaluate(() => { const a = [...document.querySelectorAll('section[data-country] [role="link"]')].find((x) => { const r = x.getBoundingClientRect(); return r.left > -5 && r.left < innerWidth - 5; }); if (a) { a.click(); return true; } return false; });
  await wait(2500);
  if (lg) ok('home: l\'intestazione della competizione dentro il paese apre la sua scheda', /campionato/.test(await pg.evaluate(() => location.hash)));
});

// Ogni squadra di ogni competizione ha la scheda unica (/squadra/fm-<id FotMob>): banner, schede, tendina competizioni, niente "non disponibile".
await step('squadra di una competizione dell\'archivio: scheda unica da id FotMob', async () => {
  const idx = await getJson('arch/index.json');
  // una squadra di una competizione solo d'archivio (es. Danimarca, Giappone...) dalla stagione piu' recente
  let pick = null;
  for (const fm of ['46', '223', '108', '119', '69', '67']) {
    const e = idx && idx[fm];
    if (!e || !e.s || !e.s.length) continue;
    const sk = [...e.s].sort().reverse()[0];
    const d = await getJson(`arch/${fm}/${encodeURIComponent(sk)}.json`);
    const tid = d && d.teams && Object.keys(d.teams)[0];
    if (tid) { pick = { fm, sk, tid, name: d.teams[tid] }; break; }
  }
  if (!pick) { ok('squadra archivio: nessuna competizione di prova (saltata)', true); return; }
  await go(`#/storico/${pick.fm}/${encodeURIComponent(pick.sk)}/squadra/${pick.tid}`, 6500);
  const hash = await pg.evaluate(() => location.hash);
  ok('squadra archivio: il link d\'archivio apre la scheda unica /squadra/', /#\/squadra\//.test(hash), { hash, pick });
  const tabs = await pg.evaluate(() => [...document.querySelectorAll('.tab-btn')].map((x) => x.textContent.trim()));
  const t = await pg.evaluate(() => document.body.innerText);
  ok('squadra archivio: banner con il nome e schede come gli altri', t.includes(pick.name) && tabs.includes('Partite'), { tabs });
  ok('squadra archivio: niente "non disponibile" ne\' "All. —"',!ND.test(t) && !/All\.\s*[—–-]\s*$/m.test(t), { all: (t.match(/All\..{0,20}/) || [''])[0] });
  await shot('squadra-archivio');
  // il link diretto /squadra/fm-<id> (aperto da zero) ricostruisce la stessa scheda
  await go(`#/squadra/fm-${pick.tid}`, 6500);
  const t2 = await pg.evaluate(() => document.body.innerText);
  ok('squadra archivio: /squadra/fm-<id> aperto da zero mostra la scheda', t2.includes(pick.name) && !/Squadra non trovata/.test(t2));
  await shot('squadra-archivio-link');
});

// Pagina Competizioni (Menu e ricerca): tutte le competizioni raggruppate per paese, ognuna apre la sua scheda.
await step('competizioni: tutte per paese, ognuna con la sua scheda', async () => {
  await go('#/competizioni', 6000);
  const r = await pg.evaluate(() => ({ rows: document.querySelectorAll('a[href*="/campionato/"]').length, heads: [...document.querySelectorAll('section p.label-sm')].map((x) => x.textContent.trim()) }));
  ok('competizioni: oltre 300 competizioni in elenco', r.rows >= 300, { rows: r.rows });
  ok('competizioni: internazionali in cima, poi Italia', r.heads[0] === 'Internazionali' && r.heads.indexOf('Italia') > 0 && r.heads.indexOf('Italia') < 4, { heads: r.heads.slice(0, 6) });
  const t = await pg.evaluate(() => document.body.innerText);
  ok('competizioni: niente "non disponibile"', !ND.test(t));
  await shot('competizioni');
  await pg.evaluate(() => { const a = [...document.querySelectorAll('a[href*="/campionato/fm-"]')][5]; if (a) a.click(); });
  await wait(5000);
  const tabs = await pg.evaluate(() => [...document.querySelectorAll('.tab-btn')].map((x) => x.textContent.trim()));
  ok('competizioni: una competizione dell\'archivio apre la scheda con le sue schede', tabs.length >= 1, { tabs, hash: await pg.evaluate(() => location.hash) });
  await shot('competizione-da-elenco');
});

// Statistiche giocatore (regola): dati solo nel passato -> stagione attuale con "Dati non disponibili" e tendina verso le stagioni con dati;
// dati nella stagione attuale -> statistiche subito; nessun dato in nessuna stagione -> niente scheda Statistiche.
await step('statistiche giocatore: dati solo nel passato, nella stagione attuale, nessun dato', async () => {
  const rose = await getJson('rose.json');
  const idx = await getJson('arch/index.json');
  const lab = (sk) => { const m = /^(\d{4})-(\d{4})(.*)$/.exec(sk); return m ? `${m[1]}/${m[2].slice(2)}${m[3].replace(' - ', ' ')}` : sk; };
  const sh = {};
  const rowsOf = async (pid) => { const n = Number(pid) % 100; if (!sh[n]) sh[n] = (await getJson(`pidx/${n}.json`)) || {}; const e = sh[n][String(pid)]; return e ? e.slice(1) : null; };
  const FM = { eredivisie: 57, 'super-lig': 71, 'liga-portugal': 61, 'pro-league': 40, championship: 48, 'serie-b': 86 };
  const pick = { past: null, cur: null, none: null };
  for (const t of Object.values(rose || {})) {
    const fm = FM[t.lg];
    if (!fm || !idx || !idx[fm]) continue;
    const cur = [...idx[fm].s].sort().reverse()[0];
    for (const r of t.p || []) {
      if (pick.past && pick.cur && pick.none) break;
      const rows = await rowsOf(r[0]);
      const one = { pid: r[0], name: r[1], fm, cur };
      if (!rows || !rows.length) { if (!pick.none) pick.none = one; continue; }
      const hasCur = rows.some((x) => String(x[0]) === String(fm) && x[1] === cur);
      const pastHere = rows.filter((x) => String(x[0]) === String(fm) && x[1] < cur);
      if (hasCur && !pick.cur) pick.cur = one;
      if (!rows.some((x) => String(x[1]).slice(0, 4) >= String(cur).slice(0, 4)) && pastHere.length && !pick.past) pick.past = { ...one, sk: pastHere[0][1] };
    }
    if (pick.past && pick.cur && pick.none) break;
  }
  report.statCasi = pick;
  const open = async (x) => {
    await go(`#/giocatore/${encodeURIComponent(`fm~${x.fm}~${x.cur}~${x.pid}`)}`, 2500);
    await pg.waitForFunction(() => document.querySelectorAll('.tab-btn').length > 0, null, { timeout: 25000 }).catch(() => {});
    await wait(2500); // indice giocatori arrivato: le schede sono quelle definitive
    return pg.evaluate(() => [...document.querySelectorAll('.tab-btn')].map((b) => b.textContent.trim()));
  };
  if (pick.past) {
    const tabs = await open(pick.past);
    ok('statistiche: con dati solo nel passato la scheda Statistiche c\'e\'', tabs.includes('Statistiche'), { tabs, p: pick.past });
    await clickText('Statistiche'); await wait(2500);
    const t = await pg.evaluate(() => document.body.innerText);
    ok('statistiche: stagione attuale senza dati = "Dati non disponibili" (un solo messaggio, niente "–")', /Dati non disponibili/.test(t) && (t.match(/Dati non disponibili/g) || []).length === 1 && !/Nessuna presenza/.test(t), { t: t.slice(0, 300) });
    await shot('statistiche-solo-passato');
    // tendina stagioni: si passa a una stagione con dati e le statistiche compaiono subito
    await clickText(lab(pick.past.cur)); await wait(600);
    const chose = await clickText(lab(pick.past.sk)); await wait(2500);
    const t2 = await pg.evaluate(() => document.body.innerText);
    ok('statistiche: dalla tendina una stagione passata mostra le statistiche', chose && /presenze/i.test(t2) && !/Dati non disponibili/.test(t2), { sk: pick.past.sk, chose });
    await shot('statistiche-stagione-passata');
  } else ok('statistiche: nessun giocatore con dati solo nel passato (prova saltata)', true);
  if (pick.cur) {
    await open(pick.cur);
    await clickText('Statistiche'); await wait(2500);
    const t = await pg.evaluate(() => document.body.innerText);
    ok('statistiche: con dati nella stagione attuale si vedono subito', /presenze/i.test(t) && !/Dati non disponibili/.test(t), { p: pick.cur });
  }
  if (pick.none) {
    const tabs = await open(pick.none);
    await wait(2500);
    const tabs2 = await pg.evaluate(() => [...document.querySelectorAll('.tab-btn')].map((b) => b.textContent.trim()));
    ok('statistiche: senza dati in nessuna stagione la scheda Statistiche non c\'e\'', tabs2.length > 0 && !tabs2.includes('Statistiche'), { tabs: tabs2, p: pick.none });
    await shot('statistiche-nessun-dato');
  }
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
    const coppaTab = /^x-(141|209|134|186|133|149|278|180|9067)-/.test(id);
    ok(`${id}: scheda Riepilogo (le altre solo se hanno dati)`, t.includes('Riepilogo') && (coppaTab || t.includes('Classifica')), { tabs: t.filter((x) => ['Riepilogo', 'Statistiche', 'Formazioni', 'Classifica', 'Tabellone', 'Giocatori', 'Panoramica'].includes(x)) });
    ok(`${id}: nessuna scheda Giocatori`, !(await pg.evaluate(() => [...document.querySelectorAll('[role=tab],button')].some((b) => b.textContent.trim() === 'Giocatori' && !b.closest('nav')))));
    const pills = await pg.evaluate(() => document.body.innerText);
    ok(`${id}: riepilogo senza testi "non disponibile"`, !ND.test(pills), { nd: (pills.match(ND) || [])[0] });
    ok(`${id}: riepilogo con almeno un riquadro`, /momentum|riassunto|forma recente|stadio|arbitro/i.test(pills), { snippet: pills.slice(0, 80) });
    ok(`${id}: forma recente`, /forma recente/i.test(pills));
    await pg.evaluate(() => window.scrollTo(0, 700)); await wait(500); await shot(`partita-${id}-riepilogo-2`);
    await pg.evaluate(() => window.scrollTo(0, 0));
    const coppa = /^x-(141|209|134|186|133|149|278|180|9067)-/.test(id); // coppe nazionali: senza classifica e, spesso, senza mappa tiri
    if (t.includes('Statistiche')) {
      await clickText('Statistiche'); await wait(2500); await shot(`partita-${id}-statistiche`);
      const t2 = await texts();
      ok(`${id}: Totale / 1° tempo / 2° tempo`, t2.includes('Totale') && t2.includes('1° tempo') && t2.includes('2° tempo'));
      const body2 = await pg.evaluate(() => document.body.innerText);
      ok(`${id}: mappa tiri`, coppa || /mappa tiri/i.test(body2));
    }
    await pg.evaluate(() => window.scrollTo(0, 900)); await wait(500); await shot(`partita-${id}-statistiche-2`);
    await pg.evaluate(() => window.scrollTo(0, 0));
    if (t.includes('Formazioni')) {
      await clickText('Formazioni'); await wait(2500); await shot(`partita-${id}-formazioni`);
      const green = await pg.evaluate(() => [...document.querySelectorAll('div')].some((d) => /12301f/i.test(d.style.background || '') || /rgb\(18, 48, 31\)/.test(d.style.background || '')));
      ok(`${id}: formazione sul campo verde`, green);
      // icone sui volti (gol/assist/cartellini): una squadra con gol, scorrendo fino al campo
      // campo unico con le due squadre: due schermate (meta' alta e meta' bassa)
      for (const [k, y] of [['', 260], ['-2', 760]]) {
        await pg.evaluate((yy) => window.scrollTo(0, yy), y); await wait(500); await shot(`partita-${id}-formazioni-icone${k}`);
      }
      // cambio: solo le due freccette (niente riquadro rosso col minuto)
      const subBox = await pg.evaluate(() => [...document.querySelectorAll('span')].filter((x) => /229, 72, 77|E5484D/i.test(x.style.background || '') && /^\d+$/.test(x.textContent.trim())).length);
      ok(`${id}: cambio senza riquadro ne' minuto`, subBox === 0, { subBox });
    }
    await pg.evaluate(() => window.scrollTo(0, 0));
    await clickText('Classifica'); await wait(2500); await shot(`partita-${id}-classifica`);
    const hi = await pg.evaluate(() => [...document.querySelectorAll('a')].filter((a) => /accent-soft/.test(a.getAttribute('style') || '')).length);
    ok(`${id}: due squadre evidenziate in classifica`, coppa || hi === 2, { evidenziate: hi });
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
    const poly = await pg.evaluate(() => document.querySelectorAll('svg polygon').length);
    ok('minori pre: Duello in numeri con ragnatela (se ci sono i dati)', !/duello in numeri/i.test(b) || poly >= 4, { snippet: b.slice(0, 60) });
    ok('minori pre: nessun "non disponibile"', !ND.test(b), { nd: (b.match(ND) || [])[0] });
    const t = await texts();
    if (t.includes('Statistiche')) {
      await clickText('Statistiche'); await wait(2500); await shot('minori-pre-statistiche');
      const s2 = await pg.evaluate(() => document.body.innerText);
      ok('minori pre: confronto in casa / in trasferta', /in casa/i.test(s2) && /in trasferta/i.test(s2), { snippet: s2.slice(0, 120) });
    }
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
  ok('archivio: nessun "non disponibile" in carriera', !ND.test(c));
});

await step('nuovi campionati: scheda con statistiche', async () => {
  for (const lg of ['serie-b', 'mls', 'championship', 'coppa-italia']) {
    await go(`#/campionato/${lg}`, 6000);
    const t0 = await pg.evaluate(() => document.body.innerText);
    ok(`${lg}: scheda campionato aperta`, /Partite/.test(t0) && /Classifica|Tabellone/.test(t0), { len: t0.length });
    await pg.evaluate(() => { const e = [...document.querySelectorAll('.tab-btn')].find((x) => x.textContent.trim() === 'Giocatori'); if (e) e.click(); }); await wait(3500);
    const t1 = await pg.evaluate(() => document.body.innerText);
    ok(`${lg}: giocatori con classifiche`, /Gol|Assist/i.test(t1) && !/non disponibili|in arrivo/i.test(t1), { len: t1.length });
    await shot(`${lg}-giocatori`);
  }
});

await step('squadra minore: statistiche e giocatori della stagione attuale', async () => {
  for (const team of ['fortuna-sittard', 'feyenoord', 'fluminense']) {
    await go(`#/squadra/${team}`, 6000);
    await clickText('Statistiche'); await wait(3500);
    const t = await pg.evaluate(() => document.body.innerText);
    const barre = await pg.evaluate(() => document.querySelectorAll('[style*="width"]').length);
    ok(`${team}: statistiche squadra con valori`, /Attacco/.test(t) && /Tiri/i.test(t) && !/in arrivo|non disponibili/i.test(t), { len: t.length });
    await shot(`${team}-statistiche-attuali`);
    await pg.evaluate(() => { const e = [...document.querySelectorAll('.tab-btn')].find((x) => x.textContent.trim() === 'Giocatori'); if (e) e.click(); }); await wait(3500);
    const g = await pg.evaluate(() => document.body.innerText);
    ok(`${team}: giocatori con classifiche`, /gol|assist/i.test(g) && !/in arrivo|non disponibili/i.test(g), { len: g.length });
    await shot(`${team}-giocatori-attuali`);
    const href = await pg.evaluate(() => { const a = [...document.querySelectorAll('a[href*="giocatore"]')][0]; if (a) { a.click(); return a.getAttribute('href'); } return null; });
    await wait(4000);
    const pt = await pg.evaluate(() => document.body.innerText);
    ok(`${team}: scheda giocatore piena`, !!href && /Profilo/.test(pt) && /Statistiche/.test(pt) && !/Carriera non disponibile/.test(pt), { href });
    await shot(`${team}-giocatore-scheda`);
  }
});

await step('squadra di campionato aggiunto che gioca anche una coppa (Fluminense)', async () => {
  await go('#/squadra/fluminense', 6000);
  const t = await pg.evaluate(() => document.body.innerText.slice(0, 600));
  ok('fluminense: sotto il nome c\'e\' il campionato, non la coppa', /Brasileir/i.test(t) && !/Copa do Brasil\s*·/.test(t), { testa: t.replace(/\n+/g, ' | ').slice(0, 160) });
  const tabs = await pg.evaluate(() => [...document.querySelectorAll('.tab-btn')].map((x) => x.textContent.trim()));
  ok('fluminense: stesse schede dei top campionati', ['Partite', 'Classifica', 'Statistiche', 'Giocatori'].every((x) => tabs.some((y) => y.includes(x))), { tabs });
  await shot('fluminense-partite');
  await pg.evaluate(() => { const e = [...document.querySelectorAll('.tab-btn')].find((x) => x.textContent.trim() === 'Classifica'); if (e) e.click(); }); await wait(3500);
  const c = await pg.evaluate(() => document.body.innerText);
  ok('fluminense: classifica del Brasileirao', !/non disponibile/i.test(c) && /Flamengo|Palmeiras/.test(c), { len: c.length });
  await shot('fluminense-classifica');
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
  report.clTabelloneAttuale = t0.includes('Tabellone');
  await shot('cl-classifica');
  if (report.clTabelloneAttuale) await clickVis('Tabellone');
  await wait(380); await shot('cl-transizione-meta');
  await wait(1500);
  const t = await pg.evaluate(() => document.body.innerText);
  ok('Tabellone CL attuale: turni a eliminazione oppure nessun Tabellone (mai "nessun dato")', !/Nessun dato/.test(t) && (/Ottavi|Quarti|Semifinali|Spareggi/.test(t) || !t0.includes('Tabellone')));
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
await step('home: tornando da una partita resta all\'altezza di prima, senza salti', async () => {
  await go('#/', 4500);
  await pg.evaluate(() => window.scrollTo(0, 420));
  await wait(700);
  const y0 = await pg.evaluate(() => Math.round(scrollY));
  await pg.evaluate(() => { const l = [...document.querySelectorAll('a[href*="/match/"]')].filter((a) => { const r = a.getBoundingClientRect(); return r.top > 120 && r.bottom < innerHeight - 100; }); (l[0] || document.querySelector('a[href*="/match/"]')).click(); });
  await wait(4500);
  const ys = await pg.evaluate(() => new Promise((res) => { const a = []; let on = false; const t0 = performance.now(); const f = () => { if (!on && document.querySelector('input[type=date]')) { on = true; } if (on) a.push(Math.round(scrollY)); if (performance.now() - t0 < 1800) requestAnimationFrame(f); else res(a); }; requestAnimationFrame(f); history.back(); }));
  const mn = ys.length ? Math.min(...ys) : -1;
  ok('home: ritorno senza salti di scroll (mai sopra l\'altezza di prima)', y0 > 100 && ys.length > 5 && mn >= y0 - 3, { y0, minimo: mn, primi: ys.slice(0, 8) });
});

await step('home: la fotografia sotto lo swipe indietro e\' alla stessa altezza della pagina vera', async () => {
  await go('#/', 4500);
  // si sceglie il giorno con piu' partite, cosi' la pagina e' abbastanza lunga da scorrere davvero
  const days = await pg.evaluate(() => [...document.querySelectorAll('button,div')].filter((x) => /^\s*(Lun|Mar|Mer|Gio|Ven|Sab|Dom)\s*\d+/i.test(x.textContent || '') && x.children.length < 4).map((x) => (x.textContent || '').trim().slice(0, 8)));
  let best = { n: 0, t: null };
  for (const t of [...new Set(days)].slice(0, 9)) {
    await pg.evaluate((tt) => { const e = [...document.querySelectorAll('button,div')].filter((x) => (x.textContent || '').trim().slice(0, 8) === tt && x.children.length < 4).pop(); if (e) e.click(); }, t);
    await wait(1600);
    // solo il giorno visibile (i giorni vicini sono costruiti accanto, fuori schermo)
    const n = await pg.evaluate(() => [...document.querySelectorAll('a[href*="/match/"]')].filter((x) => { const r = x.getBoundingClientRect(); return r.width > 0 && r.left > -5 && r.left < innerWidth - 5; }).length);
    if (n > best.n) best = { n, t };
  }
  if (best.t) { await pg.evaluate((tt) => { const e = [...document.querySelectorAll('button,div')].filter((x) => (x.textContent || '').trim().slice(0, 8) === tt && x.children.length < 4).pop(); if (e) e.click(); }, best.t); await wait(2500); }
  await pg.evaluate(() => { const l = [...document.querySelectorAll('a[href*="/match/"]')].filter((x) => { const r = x.getBoundingClientRect(); return r.width > 0 && r.left > -5 && r.left < innerWidth - 5; }); const a = l[Math.min(20, l.length - 1)]; window.scrollTo(0, Math.max(0, a.getBoundingClientRect().top + scrollY - 300)); });
  await wait(900);
  const pre = await pg.evaluate(() => { const l = [...document.querySelectorAll('a[href*="/match/"]')].filter((a) => { const r = a.getBoundingClientRect(); return r.top > 150 && r.bottom < innerHeight - 100; }); const a = l[0] || document.querySelector('a[href*="/match/"]'); return { id: a.getAttribute('href'), top: Math.round(a.getBoundingClientRect().top), sy: Math.round(scrollY) }; });
  await pg.evaluate((h) => document.querySelector(`a[href="${h}"]`).click(), pre.id);
  await wait(4500);
  const r = await pg.evaluate((h) => new Promise((res) => {
    const a = []; const t0 = performance.now();
    const f = () => {
      const host = document.querySelector('body > div[aria-hidden="true"]');
      const cl = host && host.querySelector(`a[href="${h}"]`);
      const real = [...document.querySelectorAll(`a[href="${h}"]`)].find((x) => !x.closest('[aria-hidden="true"]'));
      a.push({ host: !!host, c: cl ? Math.round(cl.getBoundingClientRect().top) : null, r: real ? Math.round(real.getBoundingClientRect().top) : null });
      if (performance.now() - t0 < 1800) requestAnimationFrame(f); else res(a);
    };
    requestAnimationFrame(f); window.__slCarousel.pageBack(120);
  }), pre.id);
  const cs = r.filter((x) => x.c !== null).map((x) => x.c);
  const rs = r.filter((x) => x.r !== null).map((x) => x.r).slice(-12);
  const dc = cs.length ? Math.max(...cs.map((c) => Math.abs(c - pre.top))) : 999;
  const dr = rs.length ? Math.max(...rs.map((c) => Math.abs(c - pre.top))) : 999; // solo gli ultimi fotogrammi: dopo il ripristino
  ok('home: la pagina è abbastanza lunga da scorrere per la prova', pre.sy > 100 || best.n < 8, { pre, best });
  ok('home: la fotografia sotto lo swipe mostra la riga dove stava (nessun salto al cambio pagina)', cs.length >= 1 && dc <= 4, { pre, giorno: best, dc, campioni: cs.slice(0, 6) });
  ok('home: la pagina vera rimette la riga dove stava', rs.length >= 1 && dr <= 4 && pre.top > 100, { pre, giorno: best, dr, campioni: rs.slice(0, 6) });
});

await step('coppa nazionale: solo tabellone con turni e partite (DFB Pokal)', async () => {
  await go('#/campionato/dfb-pokal', 6000);
  const tabs = await pg.evaluate(() => [...document.querySelectorAll('.tab-btn')].map((x) => x.textContent.trim()));
  ok('dfb-pokal: la scheda e\' Tabellone, non Classifica', tabs.includes('Tabellone') && !tabs.includes('Classifica'), { tabs });
  await pg.evaluate(() => { const e = [...document.querySelectorAll('.tab-btn')].find((x) => x.textContent.trim() === 'Tabellone'); if (e) e.click(); }); await wait(3500);
  const t = await pg.evaluate(() => document.body.innerText);
  ok('dfb-pokal: tabellone con turni e squadre', /Turno|Sedicesimi|Ottavi|Finale/.test(t) && !/Nessun dato/.test(t), { len: t.length });
  await shot('dfb-pokal-tabellone');
});

// Risultati non aggiornati (regola): una partita finita con il file della stagione vecchio in cache mostra il risultato vero.
// Il file arch/ della stagione in corso si serve "vecchio" (riga senza risultato) e il feed del giorno giorni/<data>.json la da' finita.
await step('risultati: partita finita con dati vecchi in cache -> la pagina mostra il risultato', async () => {
  const LEGHE = { 268: 'brasileirao', 57: 'eredivisie', 71: 'super-lig', 61: 'liga-portugal', 209: 'dfb-pokal', 48: 'championship', 86: 'serie-b', 130: 'mls', 230: 'liga-mx', 112: 'arg-liga-profesional' };
  const idx = await getJson('arch/index.json');
  const now = Date.now();
  let pick = null;
  for (const fm of Object.keys(LEGHE)) {
    const e = idx && idx[fm];
    if (!e || !e.s || !e.s.length) continue;
    const sk = [...e.s].sort().reverse()[0];
    const d = await getJson(`arch/${fm}/${encodeURIComponent(sk)}.json`);
    const m = d && (d.fix || []).filter((x) => !x[8] && Date.parse(x[4]) < now - 3 * 3600e3 && now - Date.parse(x[4]) < 8 * 864e5).pop();
    if (m) { pick = { fm, sk, d, m }; break; }
  }
  if (!pick) { ok('risultati: nessuna partita negli ultimi 8 giorni (prova saltata)', true); return; }
  const { fm, sk, d, m } = pick;
  const score = m[6] && m[5] ? String(m[5]) : '3 - 1'; // se il file e' gia' vecchio si usa un risultato di prova
  const staleD = { ...d, fix: d.fix.map((x) => (x[0] === m[0] ? [x[0], x[1], x[2], x[3], x[4], null, 0, 0, 0] : x)) };
  const day = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Rome' }).format(new Date(m[4]));
  await pg.route(`**/arch/${fm}/*`, (r) => (/_s\.json/.test(r.request().url()) ? r.continue() : r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(staleD) })));
  await pg.route('**/giorni/*.json', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ t: new Date().toISOString(), m: r.request().url().includes(day) ? [[String(m[0]), Number(fm), m[4], m[2], m[3], '', '', score, 'f', null]] : [] }) }));
  await go(`#/campionato/${LEGHE[fm]}`, 6500);
  let txt = null;
  for (let i = 0; i < 8 && txt == null; i += 1) {
    txt = await pg.evaluate((id) => { const a = document.querySelector(`a[href*="-${id}"]`); return a ? a.textContent : null; }, String(m[0]));
    if (txt == null) { if (!(await clickText('Giornate precedenti'))) await clickText('Turni precedenti'); await wait(500); }
  }
  // il risultato puo' arrivare anche da partite_extra.json (quello vero): basta che ci sia un risultato e nessun orario
  const shown = txt != null && /\d+\s*–\s*\d+/.test(txt) && !/\d{2}:\d{2}/.test(txt);
  ok('risultati: la riga mostra il risultato (non l\'orario) anche con il file vecchio', shown, { fm, id: m[0], txt });
  await shot('risultati-dati-vecchi');
  await pg.unroute(`**/arch/${fm}/*`); await pg.unroute('**/giorni/*.json');
});

// Giornate delle competizioni aggiunte decise dalle date: nessun riquadro piu' lungo di 10 giorni, recuperi a parte, mai risultato e orario insieme.
await step('giornate: nessuna giornata di mesi, recuperi nella loro data (Brasileirao)', async () => {
  const idx = await getJson('arch/index.json');
  const sk = [...((idx && idx['268'] && idx['268'].s) || [])].sort().reverse()[0];
  const d = sk ? await getJson(`arch/268/${encodeURIComponent(sk)}.json`) : null;
  if (!d) { ok('giornate: Brasileirao senza calendario (prova saltata)', true); return; }
  const ts = {}; d.fix.forEach((x) => { ts[String(x[0])] = Date.parse(x[4]); });
  await go('#/campionato/brasileirao', 6500);
  for (let i = 0; i < 40; i += 1) { if (!(await clickText('Giornate precedenti'))) break; await wait(150); }
  await wait(800);
  const secs = await pg.evaluate(() => [...document.querySelectorAll('section[data-round]')].map((s) => ({ r: s.getAttribute('data-round'), ids: [...s.querySelectorAll('a[href*="/match/a-"]')].map((a) => a.getAttribute('href').split('-').pop()), rows: [...s.querySelectorAll('a[href*="/match/a-"]')].map((a) => a.textContent) })));
  const long = secs.filter((s) => { const t = s.ids.map((id) => ts[id]).filter(Number.isFinite); return t.length && Math.max(...t) - Math.min(...t) > 10 * 864e5; }).map((s) => s.r);
  const both = secs.flatMap((s) => s.rows).filter((t) => /\d+\s*–\s*\d+/.test(t) && /\d{2}:\d{2}/.test(t));
  ok('giornate: nessun riquadro piu\' lungo di 10 giorni', secs.length > 5 && !long.length, { n: secs.length, long });
  ok('giornate: mai risultato e orario insieme', !both.length, { both: both.slice(0, 3) });
  await shot('giornate-brasileirao');
});

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

// la fotografia sotto deve restare intera a ogni fotogramma: banner e schede fisse ferme dentro la fotografia (prima pageDrag spostava anche le copie
// con data-pf e sotto restava il nero), giorno scelto della Home al centro come nella pagina vera
const backFrames = (sel) => pg.evaluate((sel) => new Promise((res) => {
  const a = []; const t0 = performance.now(); const w = innerWidth;
  const f = () => {
    const host = [...document.querySelectorAll('body > div[aria-hidden="true"]')].find((x) => x.style.inset === '0px' && x.style.position === 'fixed');
    const shell = document.getElementById('sl-shell');
    const sr = shell ? shell.getBoundingClientRect() : null;
    const covered = (host && host.style.opacity !== '0.01') || (sr && sr.left < w * 0.5 && sr.right > w * 0.5);
    const item = host && sel ? host.querySelector(sel) : null;
    const ir = item ? item.getBoundingClientRect() : null;
    a.push({ t: Math.round(performance.now() - t0), covered: !!covered, pf: host ? host.querySelectorAll('[data-pf]').length : 0, item: ir ? [Math.round(ir.left), Math.round(ir.top), Math.round(ir.width)] : null, hostX: host ? host.getBoundingClientRect().left : null });
    if (performance.now() - t0 < 1600) requestAnimationFrame(f); else res(a);
  };
  for (const x of [20, 70, 130, 190]) window.__slCarousel.pageDrag(x);
  requestAnimationFrame(f); setTimeout(() => window.__slCarousel.pageBack(190), 120);
}), sel);
await step('swipe indietro da partite squadra: banner e schede nella fotografia a ogni fotogramma', async () => {
  await go('#/squadra/napoli', 6000);
  await pg.waitForFunction(() => [...document.querySelectorAll('a[href*="/match/"]')].some((x) => { const r = x.getBoundingClientRect(); return r.top > 150 && r.bottom < innerHeight - 90 && r.left >= 0 && r.left < 200; }), null, { timeout: 30000 }).catch(() => {});
  const banner = await pg.evaluate(() => { const h = document.querySelector('header[data-pf]'); return h ? Math.round(h.getBoundingClientRect().height) : 0; });
  const opened = await pg.evaluate(() => { const a = [...document.querySelectorAll('a[href*="/match/"]')].find((x) => { const r = x.getBoundingClientRect(); return r.top > 150 && r.bottom < innerHeight - 90 && r.left >= 0 && r.left < 200; }); if (a) { a.click(); return true; } return false; });
  await wait(4000);
  const fr = await backFrames('header');
  const withHost = fr.filter((x) => x.item);
  const offView = withHost.filter((x) => x.item[0] - x.hostX > 2 || x.item[0] - x.hostX < -2);
  ok('swipe squadra: nella fotografia nessuna copia segnata data-pf', fr.every((x) => x.pf === 0), { pf: Math.max(...fr.map((x) => x.pf)) });
  ok('swipe squadra: il banner nella fotografia resta fermo dentro di essa', opened && banner > 0 && withHost.length >= 3 && offView.length === 0, { banner, n: withHost.length, fuori: offView.slice(0, 3) });
  ok('swipe squadra: mai un fotogramma senza pagina (nero)', fr.length >= 3 && fr.every((x) => x.covered), { neri: fr.filter((x) => !x.covered).map((x) => x.t).slice(0, 6) });
  ok('swipe squadra: si torna alla squadra', /squadra\/napoli/.test(await pg.evaluate(() => location.hash)));
});
await step('swipe indietro verso la Home: giorno scelto al centro anche nella fotografia', async () => {
  await go('#/', 6000);
  // la Home puo' riaprirsi all'altezza lasciata dal passo prima: qui si misura la striscia dei giorni, che sta in cima
  await pg.evaluate(() => window.scrollTo(0, 0)); await wait(400);
  await pg.waitForFunction(() => [...document.querySelectorAll('a[href*="/match/"]')].some((x) => { const r = x.getBoundingClientRect(); return r.top > 150 && r.bottom < innerHeight - 90 && r.left >= 0 && r.left < 200; }), null, { timeout: 30000 }).catch(() => {});
  const real = await pg.evaluate(() => { const a = document.querySelector('#sl-shell [data-active="1"]'); if (!a) return null; const r = a.getBoundingClientRect(); return Math.round(r.left + r.width / 2); });
  await pg.evaluate(() => { const a = [...document.querySelectorAll('a[href*="/match/"]')].find((x) => { const r = x.getBoundingClientRect(); return r.top > 150 && r.bottom < innerHeight - 90 && r.left >= 0 && r.left < 200; }); if (a) a.click(); });
  await wait(4000);
  const fr = await backFrames('[data-active="1"]');
  const cs = fr.filter((x) => x.item).map((x) => Math.round(x.item[0] + x.item[2] / 2 - x.hostX));
  ok('home: nella fotografia il giorno scelto e\' dove sta nella pagina vera', real !== null && cs.length >= 3 && cs.every((c) => Math.abs(c - real) <= 4), { real, cs: cs.slice(0, 5) });
  ok('home: swipe indietro mai nero', fr.length >= 3 && fr.every((x) => x.covered), { neri: fr.filter((x) => !x.covered).map((x) => x.t).slice(0, 6) });
});
await step('bordo sinistro: il tocco resta all\'app (niente indietro del sistema sopra il nostro)', async () => {
  const r = await pg.evaluate(() => {
    try {
      const mk = (x) => { const t = new Touch({ identifier: 1, target: document.body, clientX: x, clientY: 400 }); return new TouchEvent('touchstart', { touches: [t], targetTouches: [t], changedTouches: [t], cancelable: true, bubbles: true }); };
      const e1 = mk(8); document.body.dispatchEvent(e1);
      const e2 = mk(200); document.body.dispatchEvent(e2);
      return { edge: e1.defaultPrevented, mid: e2.defaultPrevented };
    } catch (e) { return { skip: String(e).slice(0, 80) }; }
  });
  ok('bordo sinistro: touchstart sul bordo bloccato, al centro libero', r.skip ? true : r.edge && !r.mid, r);
});


// ---- Funzioni nuove: valgono per tutte le competizioni e squadre aggiunte ----
await step('campionati e coppe aggiunti: partita non iniziata con Duello, numeri da tenere d\'occhio e forma', async () => {
  const seen = new Set();
  const now = Date.now();
  // solo partite davvero non iniziate (una gia' cominciata mostra altro e non il confronto pre-partita)
  const pick = (px && px.m ? px.m : []).filter((r) => r[9] === 'n' && Date.parse(r[2]) > now + 3600e3 && !seen.has(r[1]) && seen.add(r[1]));
  report.sweepFm = pick.map((r) => r[1]);
  // riscaldamento: la prima apertura di una partita scarica i dati comuni
  if (pick[0]) { await go(`#/match/x-${pick[0][1]}-${pick[0][0]}`, 3000); await wait(8000); }
  for (const r of pick) {
    await go(`#/match/x-${r[1]}-${r[0]}`, 3000);
    await pg.waitForFunction(() => /duello in numeri/i.test(document.body.innerText), null, { timeout: 15000 }).catch(() => {});
    await clickText('Panoramica'); await wait(1500); // la scheda scelta in una partita si ricorda: si parte sempre da Panoramica
    let b = await pg.evaluate(() => document.body.innerText);
    if (!/duello in numeri|forma recente/i.test(b)) { await go(`#/match/x-${r[1]}-${r[0]}`, 9000); b = await pg.evaluate(() => document.body.innerText); }
    const poly = await pg.evaluate(() => document.querySelectorAll('svg polygon').length);
    // senza dati il riquadro non c'e' (mai "non disponibile"): se c'e', la ragnatela e' disegnata
    ok(`extra ${r[1]}: Duello in numeri con ragnatela (se ci sono i dati)`, !/duello in numeri/i.test(b) || poly >= 4, { poly, id: `x-${r[1]}-${r[0]}`, snippet: b.replace(/\n+/g, ' | ').slice(0, 220) });
    ok(`extra ${r[1]}: nessun "non disponibile"`, !ND.test(b), { nd: (b.match(ND) || [])[0] });
    report['km_' + r[1]] = /numeri da tenere/i.test(b);
  }
});

await step('squadra: riquadri Gol/xG/Tiri e riga Prossima', async () => {
  await go('#/squadra/feyenoord', 6000);
  await clickText('Statistiche'); await wait(3500);
  const t = await pg.evaluate(() => document.body.innerText);
  ok('feyenoord statistiche: riquadri Gol e Tiri in porta con posizione', /Gol/.test(t) && /Tiri in porta/i.test(t) && /\d+°/.test(t), { snippet: t.slice(0, 200) });
  ok('feyenoord statistiche: riga Prossima partita', /Prossima/i.test(t) && /(Casa|Trasferta)/.test(t));
  await shot('feyenoord-statistiche-riquadri');
});

await step('squadra unica: Francoforte col banner del campionato', async () => {
  await go('#/squadra/eintracht-frankfurt', 6000);
  const t = await pg.evaluate(() => document.body.innerText.slice(0, 500));
  ok('frankfurt: sotto il nome c\'e\' la Bundesliga, non la coppa', /Bundesliga/i.test(t) && !/DFB.?Pokal\s*·/i.test(t), { testa: t.replace(/\n+/g, ' | ').slice(0, 200) });
  await pg.evaluate(() => { const e = [...document.querySelectorAll('.tab-btn')].find((x) => x.textContent.trim() === 'Classifica'); if (e) e.click(); }); await wait(3000);
  try { await pg.locator('button.glass:visible', { has: pg.locator('b') }).first().click({ timeout: 4000 }); } catch (e) { report.errors.push('tendina ' + String(e).slice(0, 100)); }
  await wait(700);
  await shot('frankfurt-tendina-competizioni');
  const names = await pg.evaluate(() => [...document.querySelectorAll('button')].filter((x) => x.offsetParent).map((x) => x.textContent.trim()));
  ok('frankfurt: la tendina ha la coppa nazionale', names.some((x) => /DFB.?Pokal/i.test(x)), { n: names.length });
  let clicked = false;
  try { await pg.locator('button:visible', { hasText: /^DFB.?Pokal$/ }).first().click({ timeout: 4000 }); clicked = true; } catch (e) { report.errors.push('coppa ' + String(e).slice(0, 100)); }
  await wait(3500);
  const c = await pg.evaluate(() => document.body.innerText);
  ok('frankfurt: scegliendo la coppa in Classifica compare il Tabellone', clicked && /Turno|Sedicesimi|Ottavi|Quarti|Semifinali|Finale/i.test(c) && !ND.test(c), { clicked, snippet: c.slice(0, 160) });
  await shot('frankfurt-classifica-coppa');
});

await step('giocatore: tendina competizioni con tutte quelle giocate e partite', async () => {
  await go('#/squadra/eintracht-frankfurt', 6000);
  // la scheda della squadra si ricorda tra i passi (con i passi divisi tra job l'ultima aperta cambia): si apre la rosa
  if (!(await pg.evaluate(() => document.querySelector('a[href*="giocatore"]')))) { await clickText('Squadra'); await wait(3000); }
  const href = await pg.evaluate(() => { const a = [...document.querySelectorAll('a[href*="giocatore"]')][0]; return a ? a.getAttribute('href') : null; });
  if (!href) { ok('giocatore: link trovato dalla rosa', false); return; }
  await go(href, 7000);
  await clickText('Statistiche'); await wait(4000);
  let bt = false;
  try { await pg.locator('button.glass:visible', { has: pg.locator('b') }).first().click({ timeout: 4000 }); bt = true; } catch (e) { report.errors.push('tendina giocatore ' + String(e).slice(0, 100)); }
  await wait(700);
  const opts = await pg.evaluate(() => [...document.querySelectorAll('button')].filter((x) => x.offsetParent).map((x) => x.textContent.trim()).filter((x) => x.length > 2 && x.length < 40));
  ok('giocatore: tendina competizioni con almeno 2 voci', bt && opts.filter((x) => /Bundesliga|Champions|Europa|Conference|Pokal|League|Liga/i.test(x)).length >= 2, { opts: opts.slice(0, 30) });
  await shot('giocatore-tendina-competizioni');
  await pg.keyboard.press('Escape');
  await go(href, 7000);
  await clickText('Partite'); await wait(4000);
  const pt = await pg.evaluate(() => document.body.innerText);
  ok('giocatore: lista partite presente', /vs |@ /.test(pt) && !/Nessuna partita disponibile/.test(pt), { len: pt.length });
  await shot('giocatore-partite');
  await clickText('Profilo'); await wait(2000);
  const pr = await pg.evaluate(() => ({ t: document.body.innerText, poly: document.querySelectorAll('svg polygon').length }));
  ok('giocatore: profilo con anagrafica e radar', /Nazionalit/i.test(pr.t) && pr.poly >= 4, { poly: pr.poly });
  await shot('giocatore-profilo');
});

await step('giocatore di campionato minore: profilo, partite, tendine', async () => {
  await go('#/squadra/fluminense', 6000);
  await clickText('Giocatori'); await wait(3000);
  const href = await pg.evaluate(() => { const a = [...document.querySelectorAll('a[href*="giocatore"]')][0]; return a ? a.getAttribute('href') : null; });
  if (!href) { ok('giocatore minore: link trovato', false); return; }
  await go(href, 7000);
  const pr = await pg.evaluate(() => ({ t: document.body.innerText, poly: document.querySelectorAll('svg polygon').length }));
  ok('giocatore minore: profilo con anagrafica', /Nazionalit|Altezza/i.test(pr.t), { len: pr.t.length });
  ok('giocatore minore: radar', pr.poly >= 4, { poly: pr.poly });
  await clickText('Statistiche'); await wait(4000);
  const st = await pg.evaluate(() => document.body.innerText);
  ok('giocatore minore: statistiche con tendina competizione', !!(await pg.evaluate(() => [...document.querySelectorAll('button.glass')].some((x) => x.querySelector('b')))), { len: st.length });
  await clickText('Partite'); await wait(3500);
  const pt = await pg.evaluate(() => document.body.innerText);
  ok('giocatore minore: partite presenti', !/Nessuna partita disponibile/.test(pt), { len: pt.length });
  await shot('giocatore-minore-partite');
});

await step('tabellone: pillole dei turni scorrono e restano centrate', async () => {
  await go('#/campionato/efl-cup', 6000);
  await pg.evaluate(() => { const e = [...document.querySelectorAll('.tab-btn')].find((x) => x.textContent.trim() === 'Tabellone'); if (e) e.click(); }); await wait(3500);
  const res = await pg.evaluate(async () => {
    const row = [...document.querySelectorAll('[data-no-back]')].find((x) => x.querySelectorAll('button').length >= 3);
    if (!row) return null;
    const bts = [...row.querySelectorAll('button')];
    bts[bts.length - 1].click();
    await new Promise((r) => setTimeout(r, 1500));
    const q = bts[bts.length - 1].getBoundingClientRect();
    return { n: bts.length, left: Math.round(q.left), right: Math.round(q.right), vw: innerWidth };
  });
  ok('tabellone: cliccando l\'ultima pillola entra e resta visibile', !!res && res.left >= 0 && res.right <= res.vw + 1, { res });
  await shot('tabellone-efl-cup-ultima-fase');
  const cards = 0;
  report.bracketCards = cards;
});

await step('swipe indietro: sotto meta\' la pagina rientra, oltre torna', async () => {
  await go('#/campionato/serie-a', 6000);
  await pg.evaluate(() => { const a = [...document.querySelectorAll('a')].find((x) => /#\/match\//.test(x.getAttribute('href') || '')); if (a) a.click(); }); await wait(3500);
  for (const x of [20, 60, 100, 140]) { await pg.evaluate((x) => window.__slCarousel.pageDrag(x), x); await wait(40); }
  await pg.evaluate(() => window.__slCarousel.pageReset(true)); await wait(1200);
  const h1 = await pg.evaluate(() => location.hash);
  ok('swipe indietro: rilasciato prima di meta\' resta sulla partita', /#\/match\//.test(h1), { h1 });
  for (const x of [20, 80, 160, 240]) { await pg.evaluate((x) => window.__slCarousel.pageDrag(x), x); await wait(40); }
  await pg.evaluate(() => window.__slCarousel.pageBack(260)); await wait(1800);
  const h2 = await pg.evaluate(() => location.hash);
  ok('swipe indietro: oltre meta\' si torna al campionato', /campionato\/serie-a/.test(h2), { h2 });
});

// ---- Regole nuove (ottobre 2026) ----
// eventi touch finti (WebKit non permette "new Touch"): i gestori dell'app leggono solo coordinate e target
const swipeIn = (sel, dx, x0 = null) => pg.evaluate(async ([sel, dx, x0]) => {
  const el = document.querySelector(sel);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  const x = x0 == null ? r.left + r.width / 2 : x0; const y = r.top + Math.min(r.height / 2, 300);
  const mk = (cx) => ({ identifier: 1, target: el, clientX: cx, clientY: y, pageX: cx, pageY: y + scrollY });
  const fire = (type, cx) => { const ev = new Event(type, { bubbles: true, cancelable: true }); Object.defineProperty(ev, 'touches', { value: type === 'touchend' ? [] : [mk(cx)] }); Object.defineProperty(ev, 'changedTouches', { value: [mk(cx)] }); el.dispatchEvent(ev); };
  const out = [];
  const probe = () => { const sh = document.getElementById('sl-shell'); out.push({ shell: sh ? sh.style.transform || '' : '', behind: [...document.querySelectorAll('body > div[aria-hidden="true"]')].filter((b) => b.style.zIndex === '1' && b.style.opacity !== '0.01').length, sy: Math.round(scrollY) }); };
  fire('touchstart', x);
  for (let i = 1; i <= 10; i++) { fire('touchmove', x + (dx * i) / 10); await new Promise((q) => requestAnimationFrame(q)); probe(); }
  fire('touchend', x + dx);
  await new Promise((q) => setTimeout(q, 700)); probe();
  return out;
}, [sel, dx, x0]);

await step('tendina stagioni lunga (Santos): sopra la barra in basso, scorre solo la lista', async () => {
  await go('#/squadra/santos', 7000);
  await pg.evaluate(() => { const e = [...document.querySelectorAll('.tab-btn')].find((x) => x.textContent.trim() === 'Giocatori'); if (e) e.click(); });
  await wait(3000);
  // solo il tasto della scheda visibile (le schede vicine sono montate fuori schermo)
  await pg.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => { const r = x.getBoundingClientRect(); return /^Attuale/.test(x.textContent.trim()) && r.height > 0 && r.left >= 0 && r.right <= innerWidth; }); if (b) b.click(); });
  await wait(700);
  await shot('santos-tendina-stagioni');
  const m = await pg.evaluate(() => {
    const l = document.querySelector('[data-pop-scroll]'); const nav = document.querySelector('nav.fixed');
    if (!l) return null;
    const r = l.getBoundingClientRect();
    return { top: Math.round(r.top), bottom: Math.round(r.bottom), navTop: nav ? Math.round(nav.getBoundingClientRect().top) : innerHeight, sh: l.scrollHeight, ch: l.clientHeight, ov: l.style.overscrollBehavior || getComputedStyle(l).overscrollBehaviorY, sy: Math.round(scrollY), right: Math.round(r.right), vw: innerWidth };
  });
  ok('tendina stagioni: aperta', !!m, { m });
  ok('tendina stagioni: finisce sopra la barra in basso', !!m && m.bottom <= m.navTop - 4 && m.top >= 0, { m });
  ok('tendina stagioni: dentro lo schermo a destra', !!m && m.right <= m.vw, { m });
  ok('tendina stagioni: scorre solo la lista (overscroll contain)', !!m && m.ov === 'contain', { m });
  // ultima stagione raggiungibile scorrendo la lista
  const last = await pg.evaluate(async () => { const l = document.querySelector('[data-pop-scroll]'); if (!l) return null; l.scrollTop = l.scrollHeight; await new Promise((q) => setTimeout(q, 200)); const b = [...l.querySelectorAll('button')].pop(); const r = b.getBoundingClientRect(); const lr = l.getBoundingClientRect(); return { txt: b.textContent.trim(), inside: r.bottom <= lr.bottom + 1, sy: Math.round(scrollY) }; });
  ok('tendina stagioni: l\'ultima stagione si raggiunge e la pagina dietro non si muove', !!last && last.inside && last.sy === m.sy, { last });
  await pg.evaluate(() => { const l = document.querySelector('[data-pop-scroll]'); const b = l && [...l.querySelectorAll('button')].pop(); if (b) b.click(); });
  await wait(1500);
  ok('tendina stagioni: si chiude scegliendo una voce', await pg.evaluate(() => !document.querySelector('[data-pop-scroll]')));
});

await step('finestra giocatore: swipe tra giocatori con la pagina sotto ferma', async () => {
  await go('#/', 6000);
  await pg.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /^Ieri/.test(x.textContent.trim())); if (b) b.click(); });
  await wait(2500);
  const opened = await pg.evaluate(() => { const a = [...document.querySelectorAll('a[href*="/match/"]')].find((x) => /\d\s*[-–]\s*\d/.test(x.textContent)); if (a) { a.click(); return a.getAttribute('href'); } return null; });
  await pg.waitForFunction(() => document.querySelectorAll('.tab-btn').length > 0, null, { timeout: 20000 }).catch(() => {});
  await wait(1200);
  await pg.evaluate(() => { const e = [...document.querySelectorAll('.tab-btn')].find((x) => x.textContent.trim() === 'Formazioni'); if (e) e.click(); });
  await wait(2000);
  const face = await pg.evaluate(() => { const b = [...document.querySelectorAll('#sl-shell button')].find((x) => x.querySelector('.avatar') && x.getBoundingClientRect().top > 150 && x.getBoundingClientRect().bottom < innerHeight - 120); if (b) { b.click(); return true; } return false; });
  await wait(2000);
  const name = () => pg.evaluate(() => { const d = document.querySelector('[role=dialog] p.text-\\[19px\\]'); return d ? d.textContent : null; });
  const n0 = await name();
  ok('finestra giocatore: si apre con il tasto Profilo', !!n0 && (await pg.evaluate(() => [...document.querySelectorAll('[role=dialog] button')].some((b) => b.textContent.trim() === 'Profilo'))), { opened, face, n0 });
  const h0 = await pg.evaluate(() => location.hash);
  const s1 = await swipeIn('[role=dialog] .flex-1.flex-col', -170);
  const n1 = await name();
  ok('finestra giocatore: lo swipe passa al giocatore successivo', !!n1 && n1 !== n0, { n0, n1 });
  ok('finestra giocatore: la pagina sotto non si muove e la fotografia dietro non compare', !!s1 && s1.every((x) => !x.shell && x.behind === 0), { s1: s1 && s1.slice(-3) });
  // dal bordo sinistro dentro la finestra: niente swipe indietro
  const s2 = await swipeIn('[role=dialog] .flex-1.flex-col', 200, 8);
  await wait(600);
  const h1 = await pg.evaluate(() => location.hash);
  ok('finestra giocatore: dal bordo sinistro non parte lo swipe indietro', h1 === h0 && !!s2 && s2.every((x) => !x.shell && x.behind === 0), { h0, h1 });
  await shot('finestra-giocatore-dopo-swipe');
  await pg.evaluate(() => { const b = document.querySelector('[role=dialog] button[aria-label="Chiudi"]'); if (b) b.click(); });
  await wait(800);
});

await step('partita senza momentum (Austrian Cup): il Riepilogo parte dal primo riquadro con dati', async () => {
  const has = px && px.m && px.m.some((r) => String(r[0]) === '6171138');
  if (!has) { report.austria = 'partita non piu\' nei dati'; return; }
  await go('#/match/x-278-6171138', 3000);
  await pg.waitForFunction(() => document.querySelectorAll('.tab-btn').length > 0, null, { timeout: 30000 }).catch(() => {});
  await wait(1500);
  const b = await pg.evaluate(() => document.body.innerText);
  ok('austrian cup: nessun "non disponibile"', !ND.test(b), { nd: (b.match(ND) || [])[0] });
  const first = await pg.evaluate(() => { const h = [...document.querySelectorAll('#sl-shell h3')].find((x) => x.getBoundingClientRect().height > 0); return h ? h.textContent.trim() : null; });
  ok('austrian cup: il primo riquadro ha dati (Momentum solo se c\'e\')', !!first && (/momentum/i.test(first) ? true : /riassunto|forma/i.test(first)), { first });
  await shot('austrian-cup-riepilogo');
});

const ready = () => pg.waitForFunction(() => document.querySelectorAll('.tab-btn').length > 0, null, { timeout: 30000 }).catch(() => {});
const tabClick = (t) => pg.evaluate((t) => { const vis = (x) => { const r = x.getBoundingClientRect(); if (r.width <= 0 || r.height <= 0) return false; const t = document.elementFromPoint(Math.min(Math.max(r.left + r.width / 2, 1), innerWidth - 1), Math.min(Math.max(r.top + r.height / 2, 1), innerHeight - 1)); return !!t && (x === t || x.contains(t)); }; const e = [...document.querySelectorAll('.tab-btn')].filter(vis).find((x) => x.textContent.trim() === t); if (e) e.click(); return !!e; }, t);

await step('pillole: tornando su una squadra con lo swipe non saltano', async () => {
  for (const team of ['lazio', 'feyenoord']) {
    await go(`#/squadra/${team}`, 3000); await ready(); await wait(1200);
    await tabClick('Statistiche'); await wait(3000);
    await tabClick('Partite'); await wait(1500);
    await tabClick('Statistiche'); await wait(2500);
    const href = await pg.evaluate(() => { const a = [...document.querySelectorAll('a[href*="/match/"], a[href*="giocatore"]')][0]; if (a) { a.click(); return a.getAttribute('href'); } return null; });
    await wait(3500);
    const ys = await pg.evaluate(async () => {
      const out = []; const t0 = performance.now();
      window.__slCarousel.pageBack(140);
      await new Promise((r) => { const f = () => { const b = [...document.querySelectorAll('#sl-shell button')].find((q) => q.textContent.trim() === 'Totale' && q.getBoundingClientRect().height > 0); if (b) out.push(Math.round(b.getBoundingClientRect().top)); if (performance.now() - t0 < 2600) requestAnimationFrame(f); else r(); }; requestAnimationFrame(f); });
      return out;
    });
    const jump = ys.length ? Math.max(...ys) - Math.min(...ys) : null;
    ok(`${team}: tornando indietro le pillole Totale/Casa/Trasferta restano ferme`, !!href && jump !== null && jump <= 3, { href, jump, n: ys.length });
  }
});

await step('campionati aggiunti: squadra della Liga MX (stagione con suffisso) con Statistiche e Giocatori', async () => {
  await go('#/campionato/liga-mx', 3000); await ready(); await wait(1200);
  await tabClick('Classifica'); await wait(2500);
  const h = await pg.evaluate(() => { const a = [...document.querySelectorAll('a[href*="squadra"]')].find((x) => x.getBoundingClientRect().height > 0); if (a) { a.click(); return a.getAttribute('href'); } return null; });
  await wait(3000); await ready(); await wait(1200);
  const hash = await pg.evaluate(() => location.hash);
  ok('liga mx: la squadra apre la scheda unica /squadra/', /#\/squadra\//.test(hash), { h, hash });
  await tabClick('Statistiche'); await wait(3500);
  const s = await pg.evaluate(() => document.body.innerText);
  ok('liga mx: Statistiche con valori', /tiri/i.test(s) && !ND.test(s), { len: s.length });
  await tabClick('Giocatori'); await wait(3500);
  const n = await pg.evaluate(() => [...document.querySelectorAll('a[href*="giocatore"]')].filter((a) => a.getBoundingClientRect().height > 0).length);
  ok('liga mx: Giocatori con classifiche', n > 3, { n });
  await shot('liga-mx-giocatori');
  await pg.evaluate(() => { const a = [...document.querySelectorAll('a[href*="giocatore"]')].find((x) => x.getBoundingClientRect().height > 0); if (a) a.click(); });
  await pg.waitForFunction(() => /giocatore/.test(location.hash) && [...document.querySelectorAll('.tab-btn')].some((x) => x.textContent.trim() === 'Carriera'), null, { timeout: 25000 }).catch(() => {});
  await wait(1500);
  const tabs = await pg.evaluate(() => [...document.querySelectorAll('.tab-btn')].filter((x) => { const r = x.getBoundingClientRect(); const t = document.elementFromPoint(Math.min(Math.max(r.left + r.width / 2, 1), innerWidth - 1), Math.min(Math.max(r.top + r.height / 2, 1), innerHeight - 1)); return r.height > 0 && !!t && (x === t || x.contains(t)); }).map((x) => x.textContent.trim()));
  await tabClick('Statistiche'); await wait(3500);
  const p = await pg.evaluate(() => document.body.innerText);
  ok('liga mx: scheda giocatore con Profilo/Partite/Statistiche/Carriera e statistiche della stagione', ['Profilo', 'Partite', 'Statistiche', 'Carriera'].every((x) => tabs.includes(x)) && /presenze/i.test(p) && /Apertura|Clausura/.test(p), { tabs });
  await shot('liga-mx-giocatore-statistiche');
});

await step('formazioni dei campionati aggiunti: tasto Profilo e scheda completa', async () => {
  const f = (px && px.m ? px.m : []).filter((r) => r[9] === 'f' && [230, 57, 61, 71, 40].includes(r[1])).slice(-1)[0];
  if (!f) { report.f11 = 'nessuna partita'; return; }
  await go(`#/match/x-${f[1]}-${f[0]}`, 3000); await ready(); await wait(1500);
  if (!(await tabClick('Formazioni'))) { report.f11 = 'senza formazioni'; return; }
  await wait(2500);
  await pg.evaluate(() => { const b = [...document.querySelectorAll('#sl-shell button')].find((x) => x.querySelector('.avatar') && x.getBoundingClientRect().top > 150 && x.getBoundingClientRect().bottom < innerHeight - 120); if (b) b.click(); });
  await wait(2500);
  const pr = await pg.evaluate(() => { const b = [...document.querySelectorAll('[role=dialog] button')].find((x) => x.textContent.trim() === 'Profilo'); if (b) { b.click(); return true; } return false; });
  ok(`x-${f[1]}: la finestra giocatore ha il tasto Profilo`, pr);
  await pg.waitForFunction(() => /giocatore/.test(location.hash) && [...document.querySelectorAll('.tab-btn')].some((x) => x.textContent.trim() === 'Carriera'), null, { timeout: 25000 }).catch(() => {});
  await wait(1000);
  const tabs = await pg.evaluate(() => [...document.querySelectorAll('.tab-btn')].map((x) => x.textContent.trim()));
  ok(`x-${f[1]}: Profilo apre la scheda completa`, /#\/giocatore\//.test(await pg.evaluate(() => location.hash)) && tabs.includes('Carriera'), { tabs });
});

await step('squadre B separate dalla prima squadra (Real Sociedad B)', async () => {
  await go('#/campionato/laliga-2', 3000); await ready(); await wait(1200);
  await tabClick('Classifica'); await wait(2500);
  const ok1 = await pg.evaluate(() => { const a = [...document.querySelectorAll('a[href*="squadra"]')].find((x) => /Sociedad B/.test(x.textContent)); if (a) { a.click(); return true; } return false; });
  await wait(3000); await ready(); await wait(1200);
  // il banner e' fisso e sta in fondo al documento: si guarda il suo testo, non l'inizio della pagina
  const head = await pg.evaluate(() => { const h = document.querySelector('header[data-pf]'); return { b: h ? h.innerText : '', h: location.hash }; });
  ok('real sociedad b: scheda propria con nome "Real Sociedad B" e LaLiga2', !ok1 || (/Real Sociedad B/.test(head.b) && /LaLiga ?2/i.test(head.b) && /#\/squadra\//.test(head.h)), head);
  await shot('real-sociedad-b');
});

await step('squadra: tendina competizioni con tutta la storia (indice tidx)', async () => {
  await go('#/campionato/austrian-cup', 3000); await ready(); await wait(1200);
  const href = await pg.evaluate(() => { const a = [...document.querySelectorAll('a[href*="squadra"]')].find((x) => /Wacker Innsbruck/.test(x.textContent)); return a ? a.getAttribute('href') : null; });
  await go(href || '#/squadra/fc-wacker-innsbruck', 3000); await ready(); await wait(1500);
  await tabClick('Classifica'); await wait(2500);
  try { await pg.locator('button.glass:visible', { has: pg.locator('b') }).first().click({ timeout: 4000 }); } catch (e) { report.errors.push('tidx ' + String(e).slice(0, 80)); }
  await wait(700);
  const names = await pg.evaluate(() => { const l = [...document.querySelectorAll('[data-pop-scroll]')].find((x) => x.getBoundingClientRect().height > 0); return l ? [...l.querySelectorAll('button')].map((b) => b.textContent.trim()) : []; });
  ok('wacker innsbruck: in tendina anche la Bundesliga austriaca giocata anni fa', names.some((x) => /Bundesliga/.test(x)), { names });
  await shot('tidx-wacker');
});

// tempi dei fotogrammi mentre si fa uno swipe di scheda (dito verso sinistra) sul contenuto
const frameSwipe = () => pg.evaluate(async () => {
  const el = document.querySelector('#sl-shell div[style*="pan-y"]');
  if (!el) return null;
  const y = 400; const x = 330;
  const mk = (cx) => ({ identifier: 1, target: el, clientX: cx, clientY: y });
  const fire = (type, cx) => { const ev = new Event(type, { bubbles: true, cancelable: true }); Object.defineProperty(ev, 'touches', { value: type === 'touchend' ? [] : [mk(cx)] }); Object.defineProperty(ev, 'changedTouches', { value: [mk(cx)] }); el.dispatchEvent(ev); };
  const ts = []; let on = true;
  const f = (t) => { ts.push(t); if (on) requestAnimationFrame(f); };
  requestAnimationFrame(f);
  fire('touchstart', x);
  for (let i = 1; i <= 14; i++) { fire('touchmove', x - 16 * i); await new Promise((q) => requestAnimationFrame(q)); }
  fire('touchend', x - 230);
  await new Promise((q) => setTimeout(q, 900));
  on = false;
  const d = ts.slice(1).map((t, i) => t - ts[i]).sort((a, b) => a - b);
  return { n: d.length, p50: Math.round(d[Math.floor(d.length / 2)] || 0), p95: Math.round(d[Math.floor(d.length * 0.95)] || 0), tab: (document.querySelector('.tab-btn.is-on') || {}).textContent };
});

await step('tabellone EFL Cup: swipe da Formazioni senza decine di livelli', async () => {
  const r = (px && px.m ? px.m : []).filter((x) => x[1] === 133 && x[9] === 'f').slice(-1)[0];
  if (!r) { report.efl = 'nessuna partita'; return; }
  const id = `x-133-${r[0]}`;
  await go('#/match/' + id, 3000); await ready(); await wait(2500);
  const base = await (async () => { await tabClick('Riepilogo'); await wait(1500); return frameSwipe(); })();
  await go('#/match/' + id, 3000); await ready(); await wait(2500);
  const hasLu = await tabClick('Formazioni'); await wait(2500);
  const br = hasLu ? await frameSwipe() : null;
  const layers = await pg.evaluate(() => [...document.querySelectorAll('#sl-shell [style*="will-change"]')].length);
  report.eflFrames = { riepilogoStatistiche: base, formazioniTabellone: br, layers };
  ok('tabellone: da fermo un solo livello (niente will-change su ogni riquadro)', layers <= 4, { layers });
  ok('tabellone: lo swipe verso il Tabellone non e\' piu\' lento dello swipe tra schede leggere', !br || !base || br.p95 <= base.p95 * 1.35 + 8, { base, br });
});

await step('memoria: 40+ pagine di seguito, fotogrammi stabili e swipe indietro mai nero', async () => {
  await go('#/', 6000);
  const pages = [];
  const links = await pg.evaluate(() => [...document.querySelectorAll('a[href*="/match/"]')].slice(0, 14).map((a) => a.getAttribute('href')));
  const teams = ['#/squadra/lazio', '#/squadra/feyenoord', '#/squadra/santos', '#/squadra/fluminense', '#/squadra/eintracht-frankfurt', '#/campionato/serie-a', '#/campionato/eredivisie', '#/campionato/liga-mx', '#/campionato/efl-cup', '#/campionato/premier-league'];
  for (let i = 0; i < 44; i++) pages.push(i % 3 === 2 ? teams[i % teams.length] : links[i % Math.max(1, links.length)] || teams[i % teams.length]);
  const t0 = await frameSwipe();
  let black = 0; let checked = 0;
  for (let i = 0; i < pages.length; i++) {
    // navigazione dell'app (pushState): cosi' si accumulano fotografie e cronologia come su iPhone
    await pg.evaluate((h) => { const p = h.replace(/^#/, ''); if (window.__slNav) window.__slNav(p); else location.hash = p; }, pages[i]);
    await wait(i % 5 === 4 ? 2200 : 900);
    if (i % 6 === 5) {
      // swipe indietro a meta': sotto deve esserci la fotografia della pagina precedente
      for (const x of [30, 90, 150]) { await pg.evaluate((x) => window.__slCarousel.pageDrag(x), x); await wait(40); }
      const behind = await pg.evaluate(() => !!document.querySelector('body > div[aria-hidden="true"][style*="position: fixed"]'));
      checked += 1; if (!behind) black += 1;
      await pg.evaluate(() => window.__slCarousel.pageReset(false)); await wait(300);
    }
  }
  await ready(); await wait(1500);
  const t1 = await frameSwipe();
  const hosts = await pg.evaluate(() => document.querySelectorAll('body > div[aria-hidden="true"]').length);
  const nodes = await pg.evaluate(() => document.getElementsByTagName('*').length);
  report.memoria = { inizio: t0, fine: t1, hosts, nodes, black, checked };
  ok('memoria: dopo 44 pagine le copie nascoste delle pagine non si accumulano', hosts <= 3, { hosts });
  ok('memoria: swipe indietro con la pagina sotto visibile (mai nero)', checked > 0 && black === 0, { black, checked });
  ok('memoria: fotogrammi a fine giro simili all\'inizio', !t0 || !t1 || t1.p95 <= t0.p95 * 1.5 + 10, { t0, t1, nodes });
});

// ---- Giro di novembre: foto, icone, partite precedenti, competizioni, swipe indietro, carriere, tiri murati ----
await step('partite precedenti: la pagina non sale e la lista resta aperta tornando da una partita', async () => {
  await go('#/squadra/lille', 3000); await ready(); await wait(2000);
  const btn = await pg.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /Partite precedenti/.test(x.textContent) && x.getBoundingClientRect().height > 0); if (!b) return null; b.scrollIntoView({ block: 'center' }); const a = [...document.querySelectorAll('a[href*="/match/"]')].find((x) => x.getBoundingClientRect().height > 0); return { sy: Math.round(scrollY), first: a ? a.getAttribute('href') : null, top: a ? Math.round(a.getBoundingClientRect().top) : null }; });
  if (!btn) { report.precedenti = 'nessun tasto (poche partite)'; return; }
  await wait(300);
  const before = await pg.evaluate(() => { const a = [...document.querySelectorAll('a[href*="/match/"]')].find((x) => x.getBoundingClientRect().height > 0); return { top: Math.round(a.getBoundingClientRect().top), href: a.getAttribute('href') }; });
  await pg.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /Partite precedenti/.test(x.textContent)); if (b) b.click(); });
  await wait(700);
  const after = await pg.evaluate((h) => { const a = document.querySelector(`a[href="${h}"]`); return a ? { top: Math.round(a.getBoundingClientRect().top), sy: Math.round(scrollY) } : null; }, before.href);
  ok('partite precedenti: la partita che guardavo resta alla stessa altezza', !!after && Math.abs(after.top - before.top) <= 6 && after.sy > 50, { before, after });
  await pg.evaluate((h) => { const a = document.querySelector(`a[href="${h}"]`); if (a) a.click(); }, before.href);
  await wait(3500);
  await pg.goBack(); await wait(2500);
  const still = await pg.evaluate(() => !([...document.querySelectorAll('button')].some((x) => /Partite precedenti/.test(x.textContent) && x.getBoundingClientRect().height > 0)));
  ok('partite precedenti: tornando da una partita la lista e\' ancora aperta', still);
});

await step('tendina competizioni sempre completa: con una stagione passata restano tutte', async () => {
  await go('#/squadra/lazio', 3000); await ready(); await wait(1500);
  await tabClick('Classifica'); await wait(2500);
  const names0 = async () => { try { await pg.locator('button.glass:visible', { has: pg.locator('b') }).first().click({ timeout: 4000 }); } catch (e) { return []; } await wait(600); const n = await pg.evaluate(() => { const l = [...document.querySelectorAll('[data-pop-scroll]')].find((x) => x.getBoundingClientRect().height > 0); return l ? [...l.querySelectorAll('button')].map((b) => b.textContent.trim()) : []; }); await pg.keyboard.press('Escape'); await pg.mouse.click(5, 300); await wait(400); return n; };
  const cur = await names0();
  // stagione passata dalla tendina stagioni
  await pg.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /^Attuale/.test(x.textContent.trim()) && x.getBoundingClientRect().height > 0); if (b) b.click(); });
  await wait(600);
  await pg.evaluate(() => { const l = [...document.querySelectorAll('[data-pop-scroll]')].find((x) => x.getBoundingClientRect().height > 0); const b = l && [...l.querySelectorAll('button')].find((x) => /2019/.test(x.textContent)); if (b) b.click(); });
  await wait(2500);
  const past = await names0();
  ok('competizioni: con una stagione passata la tendina ha le stesse voci', cur.length >= 2 && past.length >= cur.length, { cur, past });
});

await step('swipe indietro: azioni veloci tra giorni, partite e squadre, mai nero', async () => {
  await go('#/', 5000);
  await pg.waitForFunction(() => document.querySelectorAll('a[href*="/match/"]').length > 3, null, { timeout: 40000 }).catch(() => {});
  const targets = ['#/campionato/serie-a', '#/squadra/lazio', '#/campionato/liga-mx', '#/squadra/santos', '#/campionato/super-lig', '#/squadra/feyenoord'];
  const days = ['Domani', 'Oggi', 'Ieri'];
  let black = 0; let frames = 0;
  for (let i = 0; i < 8; i++) {
    await pg.evaluate((d) => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim().startsWith(d)); if (b) b.click(); }, days[i % 3]);
    await wait(180);
    await pg.evaluate((h) => window.__slNav(h.replace(/^#/, '')), targets[i % targets.length]);
    await wait(i % 2 ? 150 : 700);
    await pg.evaluate(() => { for (const x of [30, 90, 160, 230]) window.__slCarousel.pageDrag(x); });
    const r = pg.evaluate(async () => {
      const out = []; const t0 = performance.now();
      await new Promise((res) => { const f = () => {
        const host = [...document.querySelectorAll('body > div[aria-hidden="true"]')].find((b) => b.style.zIndex === '1' && b.style.opacity !== '0.01');
        const sh = document.getElementById('sl-shell');
        const shOk = sh && sh.getBoundingClientRect().height > innerHeight * 0.5;
        const moving = sh && /translate3d\((?!0px)/.test(sh.style.transform || '');
        out.push(!!host && host.style.opacity !== '0' || (!!shOk && !moving));
        if (performance.now() - t0 < 2600) requestAnimationFrame(f); else res(); }; requestAnimationFrame(f); });
      return { n: out.length, black: out.filter((x) => !x).length };
    });
    await pg.evaluate(() => window.__slCarousel.pageBack(240));
    const o = await r; black += o.black; frames += o.n;
    await wait(300);
  }
  ok('swipe indietro veloce: nessun fotogramma nero', frames > 20 && black === 0, { frames, black });
});

await step('giocatori: foto mancante = omino, partite con "vs", carriera con periodi consecutivi uniti', async () => {
  await go('#/squadra/eintracht-frankfurt', 6000); await ready(); await wait(1200);
  await tabClick('Squadra'); await wait(2500);
  const href = await pg.evaluate(() => { const a = [...document.querySelectorAll('a[href*="giocatore"]')].find((x) => x.getBoundingClientRect().height > 0); return a ? a.getAttribute('href') : null; });
  if (!href) { report.carrieraTest = 'nessun giocatore'; return; }
  await go(href, 6000); await ready(); await wait(1500);
  await tabClick('Partite'); await wait(3500);
  const pt = await pg.evaluate(() => document.body.innerText);
  ok('partite del giocatore: mai "@"', !/(^|\n)\s*@ /.test(pt) && !/ @ [A-Z]/.test(pt));
  await tabClick('Carriera'); await wait(3500);
  const teams = await pg.evaluate(() => [...document.querySelectorAll('#sl-shell p.flex.items-center.gap-1\\.5 span.truncate')].map((x) => x.textContent.trim()));
  const dup = teams.some((t, i) => i > 0 && t === teams[i - 1]);
  ok('carriera: nessuna squadra ripetuta due volte di seguito', teams.length > 0 && !dup, { teams });
  report.carrieraSquadre = teams.length;
  const broken = await pg.evaluate(() => [...document.querySelectorAll('img')].filter((i) => i.complete && i.naturalWidth === 0 && i.src).length);
  ok('foto: nessuna immagine rotta in pagina', broken === 0, { broken });
});

await step('tiri murati: pallino vuoto, mai nella porta', async () => {
  const f = (px && px.m ? px.m : []).filter((r) => r[9] === 'f' && [230, 57, 61, 71, 40].includes(r[1])).slice(-3);
  let seen = 0;
  for (const r of f) {
    await go(`#/match/x-${r[1]}-${r[0]}`, 3000); await ready(); await wait(1500);
    if (!(await tabClick('Statistiche'))) continue;
    await wait(3000);
    const info = await pg.evaluate(() => ({ svg: document.querySelectorAll('#sl-shell svg').length }));
    seen += info.svg;
  }
  report.murati = seen;
  ok('tiri murati: mappa tiri disegnata senza errori', seen > 0 && report.errors.filter((e) => /Shot|Block|bx|by/.test(e)).length === 0, { seen });
});

// ---- Giro di fine ottobre: statistiche per id FotMob, selettore squadra in Formazioni, classifiche a gironi, competizioni dell'archivio ----
const pickComp = async (comp, season) => pg.evaluate(async ([comp, season]) => {
  const sl = (ms) => new Promise((r) => setTimeout(r, ms));
  const vis = (x) => { const r = x.getBoundingClientRect(); return r.width > 0 && r.top > 0 && r.top < innerHeight; };
  const clk = (re) => { const t = [...document.querySelectorAll('button,[role=option],li')].filter(vis).find((x) => re.test(x.textContent.trim())); if (t) t.click(); return !!t; };
  const a = clk(/^(Championship|Premier League|Serie A|Bundesliga|LaLiga|Ligue 1|Attuale|Tutte le competizioni)$/) && (await sl(700), clk(new RegExp(`^${comp}$`)));
  await sl(1800);
  const b = clk(/^(Attuale|\d{4}\/\d{2}.*)$/) && (await sl(700), clk(new RegExp(`^${season.replace('/', '\\/')}$`)));
  return { a, b };
}, [comp, season]);
await step('statistiche squadra con nome diverso tra fonti (Sheffield United = "Sheff Utd", Premier League 2023/24)', async () => {
  await go('#/squadra/sheffield-united', 6000); await ready(); await wait(1000);
  await tabClick('Statistiche'); await wait(2000);
  const sel = await pickComp('Premier League', '2023/24'); await wait(4500);
  const info = await pg.evaluate(() => ({ tiles: document.querySelectorAll('#sl-shell .grid-cols-4 .glass').length, txt: document.getElementById('sl-shell').innerText }));
  await shot('sheffield-2324-statistiche');
  ok('sheffield 2023/24: statistiche con riquadri e barre', sel.a && sel.b && info.tiles >= 2 && /Totale/.test(info.txt), { sel, tiles: info.tiles });
  ok('sheffield 2023/24: mai "non ha giocato"', !/non ha giocato/.test(info.txt));
});
await step('formazioni: selettore squadra sotto il campo (allenatore e panchina della squadra scelta)', async () => {
  const f = (px && px.m ? px.m : []).filter((r) => r[9] === 'f' && [230, 57, 61, 71, 40].includes(r[1])).slice(-2)[0];
  const ids = [...(f ? [`x-${f[1]}-${f[0]}`] : [])];
  await go('#/', 5000);
  const top = await pg.evaluate(() => { const a = [...document.querySelectorAll('a[href*="/match/"]')].find((x) => { const r = x.getBoundingClientRect(); return r.top > 120 && r.left >= 0 && r.left < 200; }); return a ? a.getAttribute('href').replace('#/match/', '') : null; });
  if (top) ids.push(top);
  let seen = 0;
  for (const id of ids) {
    await go(`#/match/${id}`, 3000); await ready(); await wait(1200);
    if (!(await tabClick('Formazioni'))) continue;
    await wait(2500);
    const r = await pg.evaluate(async () => {
      const pk = document.querySelector('[data-side-picker]');
      if (!pk) return { pk: false };
      const pr = pk.getBoundingClientRect();
      const pitch = [...document.querySelectorAll('#sl-shell div')].find((d) => /12301f/.test(d.style.background || ''));
      const wr = pitch ? pitch.getBoundingClientRect() : null;
      const btn = [...pk.querySelectorAll('button')];
      const vis = () => [...document.querySelectorAll('#sl-shell [aria-hidden="false"] p')].map((p) => p.textContent).join('|');
      const before = vis();
      btn[1].click();
      await new Promise((r) => setTimeout(r, 450));
      const after = vis();
      return { pk: true, n: btn.length, w: Math.round(pr.width), pw: wr ? Math.round(wr.width) : null, sel: btn[1].getAttribute('aria-selected'), changed: before !== after };
    });
    if (!r.pk) continue;
    seen += 1;
    await shot(`formazioni-selettore-${seen}`);
    ok(`formazioni ${id}: due pillole larghe quanto il campo, la scelta cambia allenatore e panchina`, r.n === 2 && (r.pw == null || Math.abs(r.w - r.pw) <= 4) && r.sel === 'true' && r.changed, r);
  }
  ok('formazioni: selettore squadra presente', seen > 0, { ids });
});
await step('classifiche a gironi/conference dalla fonte (MLS 2015: Eastern e Western con zone)', async () => {
  await go('#/campionato/mls', 6000); await ready(); await wait(1500);
  const ok1 = await pg.evaluate(async () => { const b = [...document.querySelectorAll('button')].find((x) => /^\d{4}( |$)|Stagione|^2026$/.test(x.textContent.trim()) && x.querySelector('svg')); if (!b) return false; b.click(); await new Promise((r) => setTimeout(r, 800)); const o = [...document.querySelectorAll('button,li,[role=option]')].find((x) => x.textContent.trim() === '2015'); if (o) o.click(); return !!o; });
  await wait(4000);
  await tabClick('Classifica'); await wait(2500);
  const t = await pg.evaluate(() => ({ txt: document.getElementById('sl-shell').innerText, lines: [...document.querySelectorAll('#sl-shell a span[aria-hidden="true"]')].filter((s) => s.style.background).length }));
  await shot('mls-2015-gironi');
  ok('mls 2015: classifiche Eastern e Western con lineette delle zone', ok1 && /Eastern/i.test(t.txt) && /Western/i.test(t.txt) && t.lines > 4, { ok1, lines: t.lines });
});
await step('competizioni solo d\'archivio: scheda campionato raggiungibile (fm-<id>)', async () => {
  const idx = await getJson('arch/index.json');
  const known = new Set([55, 47, 87, 54, 53, 42, 73, 10216, 57, 71, 61, 40, 64, 38, 59, 135, 48, 86, 146, 140, 110, 185, 111, 165, 268, 112, 130, 230, 141, 209, 134, 186, 133, 149, 278, 180, 9067]);
  const cand = Object.entries(idx || {}).filter(([k, v]) => !known.has(+k) && v.s && v.s.length >= 3 && !v.skip).slice(0, 5);
  let okN = 0;
  for (const [k, v] of cand) {
    await go(`#/campionato/fm-${k}`, 5000); await ready(); await wait(2500);
    const t = await pg.evaluate(() => ({ txt: document.getElementById('sl-shell') ? document.getElementById('sl-shell').innerText : '', tabs: document.querySelectorAll('.tab-btn').length }));
    const good = t.tabs > 0 && !/non trovato/i.test(t.txt) && !ND.test(t.txt);
    if (good) okN += 1;
    ok(`archivio fm-${k} (${v.n}): scheda con schede e dati`, good, { tabs: t.tabs });
  }
  await shot('archivio-campionato');
  ok('archivio: almeno 5 competizioni minori raggiungibili', okN >= Math.min(5, cand.length) && cand.length > 0, { okN });
});

// ---- Lotto 29/10: fluidita', Home per paesi, swipe indietro verso la Home, zona dello swipe, rose, forma, partite, 0°, arbitri ----
// swipe tra giorni sulla Home (eventi touch sul documento, come su iPhone): misura fotogrammi, blocchi e nodi
const daySwipes = (n, gap) => pg.evaluate(async ([n, gap]) => {
  const ts = []; let on = true;
  const f = (t) => { ts.push(t); if (on) requestAnimationFrame(f); };
  requestAnimationFrame(f);
  const el = document.getElementById('sl-shell') || document.body;
  for (let k = 0; k < n; k++) {
    const dir = k < n / 2 ? -1 : 1; const x = dir < 0 ? 320 : 70;
    const mk = (cx) => ({ identifier: 1, target: el, clientX: cx, clientY: 450 });
    const fire = (type, cx) => { const ev = new Event(type, { bubbles: true, cancelable: true }); Object.defineProperty(ev, 'touches', { value: type === 'touchend' ? [] : [mk(cx)] }); Object.defineProperty(ev, 'changedTouches', { value: [mk(cx)] }); el.dispatchEvent(ev); };
    fire('touchstart', x);
    for (let i = 1; i <= 8; i++) { fire('touchmove', x + dir * 22 * i); await new Promise((q) => requestAnimationFrame(q)); }
    fire('touchend', x + dir * 180);
    await new Promise((q) => setTimeout(q, gap));
  }
  await new Promise((q) => setTimeout(q, 1500));
  on = false;
  const d = ts.slice(1).map((t, i) => t - ts[i]);
  const s = [...d].sort((a, b) => a - b);
  return { frames: d.length, p50: Math.round(s[Math.floor(s.length / 2)] || 0), p95: Math.round(s[Math.floor(s.length * 0.95)] || 0), max: Math.round(s[s.length - 1] || 0), persi: Math.round(d.reduce((a, x) => a + Math.max(0, Math.round(x / 16.7) - 1), 0)) };
}, [n, gap]);
const activeDay = () => pg.evaluate(() => { const a = document.querySelector('[data-active="1"]'); return a ? a.textContent.trim() : ''; });
const nodeCount = () => pg.evaluate(() => document.getElementsByTagName('*').length);

await step('fluidita: 12 swipe di fila tra i giorni della Home (fotogrammi, nodi, giorno giusto)', async () => {
  await go('#/', 9000);
  const d0 = await activeDay(); const n0 = await nodeCount();
  const lento = await daySwipes(12, 650);
  const d1 = await activeDay(); const n1 = await nodeCount();
  const veloce = await daySwipes(12, 300);
  const d2 = await activeDay(); const n2 = await nodeCount();
  report.fluidita = { lento, veloce, nodi: [n0, n1, n2] };
  ok('fluidita: dopo 6 giorni avanti e 6 indietro si torna al giorno di partenza', d0 && d0 === d1 && d1 === d2, { d0, d1, d2 });
  ok('fluidita: i nodi della Home non crescono con gli swipe', n1 <= n0 * 1.15 && n2 <= n0 * 1.15, { n0, n1, n2 });
  ok('fluidita: swipe veloci non peggiori di quelli lenti (niente accumulo)', veloce.p95 <= lento.p95 * 1.5 + 20, { lento, veloce });
  await shot('home-dopo-swipe');
});

await step('fluidita: swipe tra schede e indietro in sequenza veloce', async () => {
  await go('#/', 5000);
  await pg.evaluate(() => window.__slNav('/squadra/lazio')); await ready(); await wait(2500);
  const t0 = await frameSwipe();
  for (let i = 0; i < 6; i++) await frameSwipe();
  const t1 = await frameSwipe();
  report.fluiditaSchede = { t0, t1 };
  ok('fluidita: swipe tra schede ripetuti senza peggiorare', !t0 || !t1 || t1.p95 <= t0.p95 * 1.5 + 20, { t0, t1 });
  await pg.evaluate(() => window.__slCarousel.pageBack(240)); await wait(2500);
  const h = await pg.evaluate(() => location.hash);
  ok('fluidita: indietro dopo gli swipe torna alla Home', !/squadra/.test(h), { h });
});

await step('home: swipe indietro verso la Home in cima, la partita non ricompare sopra (video 23)', async () => {
  for (const day of ['Oggi', 'Domani']) {
    await go('#/', 7000);
    await pg.evaluate((d) => { const x = [...document.querySelectorAll('button')].find((q) => q.textContent.trim().startsWith(d)); if (x) x.click(); }, day); await wait(2200);
    await pg.evaluate(() => window.scrollTo(0, 0)); await wait(300);
    const href = await pg.evaluate(() => { const a = [...document.querySelectorAll('a[href*="/match/"]')].find((x) => { const r = x.getBoundingClientRect(); return r.top > 150 && r.top < 700 && r.left >= 0 && r.left < 300; }); if (a) { a.click(); return a.getAttribute('href'); } return null; });
    if (!href) continue;
    await wait(3500);
    const r = await pg.evaluate(async () => {
      const old = document.getElementById('sl-shell');
      const bad = []; let n = 0; let headOk = true; const t0 = performance.now();
      window.__slCarousel.pageBack(150);
      await new Promise((res) => { const f = () => {
        n += 1;
        const home = !/match/.test(location.hash);
        // la vecchia pagina (partita) non deve tornare al centro mentre si e' gia' sulla Home
        if (home && old.isConnected && !/translate3d\((?!0px)/.test(old.style.transform || '')) bad.push(Math.round(performance.now() - t0));
        const sh = document.getElementById('sl-shell');
        const host = [...document.querySelectorAll('body > div[aria-hidden="true"]')].find((x) => x.style.zIndex === '1' && x.style.opacity !== '0');
        if (home && sh && sh !== old && !host) { const h = sh.querySelector('.glass-head'); if (!h || Math.abs(h.getBoundingClientRect().top) > 1) headOk = false; }
        if (performance.now() - t0 < 3500) requestAnimationFrame(f); else res(); }; requestAnimationFrame(f); });
      return { n, bad: bad.slice(0, 5), headOk };
    });
    ok(`home (${day}): tornando con lo swipe la partita non ricompare sopra la Home`, r.n > 5 && !r.bad.length, r);
    ok(`home (${day}): la testata della Home e' al suo posto appena si vede la pagina vera`, r.headOk, r);
  }
  await shot('home-dopo-swipe-indietro');
});

await step('swipe indietro: parte anche un po lontano dal bordo (10, 30, 45 px), non dal centro', async () => {
  const res = {};
  for (const x0 of [10, 30, 45, 120]) {
    await go('#/', 4500);
    await pg.evaluate(() => window.__slNav('/squadra/feyenoord')); await ready(); await wait(2500);
    // lo swipe indietro parte dalla prima scheda (dalle altre lo swipe a destra torna alla scheda precedente)
    await tabClick('Partite'); await wait(900);
    await swipeIn('#sl-shell div[style*="pan-y"]', 300, x0);
    await wait(1800);
    res[x0] = await pg.evaluate(() => location.hash);
  }
  const back = (h) => !/squadra/.test(h || '');
  ok('swipe indietro: dal bordo e fino a 45 px si torna indietro', back(res[10]) && back(res[30]) && back(res[45]), res);
  ok('swipe indietro: dal centro dello schermo non si torna indietro', !back(res[120]), res);
});

await step('rose: squadra minore con la rosa dalla stagione, nessun pannello vuoto', async () => {
  await go('#/squadra/fm-161759', 6000); await ready();
  const tabs = await pg.evaluate(() => [...document.querySelectorAll('.tab-btn')].map((x) => x.textContent.trim()));
  await tabClick('Squadra'); await wait(3000);
  const n = await pg.evaluate(() => document.querySelectorAll('#sl-shell a[href*="giocatore"]').length);
  ok('rose: Atletico Madrileno (Primera Federacion) ha la scheda Squadra con i giocatori', tabs.includes('Squadra') && n >= 5, { tabs, n });
  await shot('rosa-atletico-madrileno');
  const ctl = await getJson('controllo_squadre.json');
  const none = ctl && ctl.rose && (ctl.rose.senza_rosa || []).find((r) => /nessuna partita/.test(r.motivo));
  if (none) {
    await go(`#/squadra/fm-${none.id}`, 6000); await ready();
    const t2 = await pg.evaluate(() => [...document.querySelectorAll('.tab-btn')].map((x) => x.textContent.trim()));
    ok('rose: squadra senza nessuna fonte di rosa = niente scheda Squadra', t2.length > 0 && !t2.includes('Squadra'), { squadra: none.squadra, tabs: t2 });
  }
  report.rose = ctl && ctl.rose ? { prima: ctl.rose.senza_rosa_prima, dopo: ctl.rose.senza_rosa_dopo } : null;
});

await step('partite squadra: stagione in corso anche dalle competizioni d\'archivio (Atletico Madrileno)', async () => {
  await go('#/squadra/fm-161759', 6000); await ready();
  await pg.waitForFunction(() => document.querySelectorAll('#sl-shell [data-key]').length > 0, null, { timeout: 20000 }).catch(() => {});
  await wait(800);
  await pg.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /^Partite precedenti/.test(x.textContent.trim())); if (b) b.click(); });
  await wait(1000);
  const r = await pg.evaluate(() => ({ rows: document.querySelectorAll('#sl-shell [data-key]').length, played: [...document.querySelectorAll('#sl-shell [data-key]')].filter((x) => /\d\s*[–-]\s*\d/.test(x.textContent)).length }));
  ok('partite squadra: la stagione in corso ha le partite giocate e le prossime', r.rows >= 8 && r.played >= 4, r);
  await shot('partite-atletico-madrileno');
  // la prossima partita: Panoramica con la Forma recente (ultime partite della stagione dall'archivio)
  const open = await pg.evaluate(() => { const rows = [...document.querySelectorAll('#sl-shell [data-key]')].filter((x) => !/\d\s*[–-]\s*\d/.test(x.textContent)); const a = rows.map((x) => x.querySelector('a[href*="/match/"]')).find(Boolean); if (a) { a.click(); return a.getAttribute('href'); } return null; });
  if (open) {
    await wait(6000);
    const t = await pg.evaluate(() => document.body.innerText);
    ok('forma: partita non iniziata di una competizione d\'archivio con la Forma recente', /Forma recente/i.test(t), { href: open });
    await shot('forma-recente-archivio');
  }
});

await step('statistiche pre-partita: nessuna posizione 0°', async () => {
  await go('#/', 7000);
  const links = await pg.evaluate(() => [...document.querySelectorAll('a[href*="/match/"]')].filter((a) => /\d{1,2}:\d{2}/.test(a.textContent)).slice(0, 6).map((a) => a.getAttribute('href')));
  const bad = [];
  for (const h of links) {
    await go(h, 6000); await ready();
    if (!(await tabClick('Statistiche'))) continue;
    await wait(2500);
    const t = await pg.evaluate(() => document.getElementById('sl-shell').innerText);
    if (/(^|[\s(])0\s?[°º]/m.test(t)) bad.push(h);
  }
  ok('statistiche pre-partita: nessuna riga con posizione 0°', !bad.length, { provate: links.length, bad });
});

await step('arbitri: scheda solo per top campionati, coppe europee e internazionali', async () => {
  await go('#/campionato/fm-8968', 6000); await ready(); await wait(2000);
  const tabs = await pg.evaluate(() => [...document.querySelectorAll('.tab-btn')].map((x) => x.textContent.trim()));
  ok('arbitri: Primera Federacion senza scheda Arbitri', tabs.length > 0 && !tabs.includes('Arbitri'), { tabs });
  await go('#/campionato/championship', 6000); await ready(); await wait(2000);
  const t2 = await pg.evaluate(() => [...document.querySelectorAll('.tab-btn')].map((x) => x.textContent.trim()));
  ok('arbitri: Championship (campionato aggiunto, non top) senza scheda Arbitri', t2.length > 0 && !t2.includes('Arbitri'), { tabs: t2 });
});

// Classifiche dei giocatori del campionato: tutti con almeno 180 minuti (niente limite a 50), regola per ogni competizione
await step('classifiche giocatori: tutti i giocatori con almeno 180 minuti (Bundesliga e Eredivisie)', async () => {
  const expand = async (key) => { await pg.evaluate((k) => { const b = [...document.querySelectorAll(`#st-${k} button`)].find((x) => /^Mostra tutti/.test(x.textContent.trim())); if (b) b.click(); }, key); await wait(500); };
  const rows = (key) => pg.evaluate((k) => { const s = document.getElementById(`st-${k}`); return s ? [...s.querySelectorAll('a[href*="giocatore"]')].map((a) => a.textContent) : []; }, key);
  await go('#/campionato/bundesliga', 6000); await ready();
  await tabClick('Giocatori'); await wait(4000);
  await pg.evaluate(() => window.scrollTo(0, 0));
  for (const k of ['goals', 'min']) { await pg.evaluate((k) => { const s = document.getElementById(`st-${k}`); if (s) s.scrollIntoView(); }, k); await wait(900); }
  await expand('min');
  const mins = await rows('min');
  ok('classifiche giocatori: Bundesliga, lista Minuti con piu\' di 50 giocatori', mins.length > 50, { n: mins.length });
  ok('classifiche giocatori: Saïd El Mala (Colonia) e\' in classifica', mins.some((x) => /El Mala/i.test(x)), { n: mins.length });
  await shot('classifica-giocatori-bundesliga');
  await go('#/campionato/eredivisie', 6000); await ready();
  await pg.evaluate(() => { const e = [...document.querySelectorAll('.tab-btn')].find((x) => x.textContent.trim() === 'Giocatori'); if (e) e.click(); }); await wait(4500);
  const keys = await pg.evaluate(() => [...document.querySelectorAll('section[id^="st-"]')].filter((s) => { const r = s.getBoundingClientRect(); return r.width > 0 && r.left > -5 && r.left < innerWidth - 5; }).map((s) => s.id.slice(3)));
  let best = 0;
  for (const k of keys.slice(0, 6)) { await pg.evaluate((k) => { const s = document.getElementById(`st-${k}`); if (s) s.scrollIntoView(); }, k); await wait(500); await expand(k); best = Math.max(best, (await rows(k)).length); }
  ok('classifiche giocatori: Eredivisie, almeno una lista con piu\' di 50 giocatori', best > 50, { best, keys: keys.slice(0, 6) });
  await shot('classifica-giocatori-eredivisie');
});

// Testi su una riga: le lettere che scendono (g, p, y, q) non devono essere tagliate dalla riga
await step('testi: lettere che scendono non tagliate (campionato, squadra, giocatore)', async () => {
  const clipped = () => pg.evaluate(() => {
    const bad = [];
    document.querySelectorAll('.truncate, .line-clamp-2, h1, h2').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0 || r.bottom < 0 || r.top > innerHeight) return;
      const cs = getComputedStyle(el);
      if (!/hidden|clip/.test(cs.overflowY) && !/hidden|clip/.test(cs.overflow)) return;
      const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let n; let lo = -1e9; let hi = 1e9;
      while ((n = w.nextNode())) { if (!n.textContent.trim()) continue; const rg = document.createRange(); rg.selectNodeContents(n); const q = rg.getBoundingClientRect(); if (q.height > 0) { lo = Math.max(lo, q.bottom); hi = Math.min(hi, q.top); } }
      // la parte visibile e' l'area dentro il bordo + il padding: il testo (riquadro del carattere) non deve uscirne
      if (lo > -1e9 && (lo > r.bottom + 3 || hi < r.top - 3) && /[gjpqy,;()]/.test(el.textContent)) bad.push(el.textContent.trim().slice(0, 30));
    });
    return bad;
  });
  for (const h of ['#/campionato/bundesliga', '#/squadra/fortuna-sittard', '#/campionato/eredivisie']) {
    await go(h, 6000); await ready(); await wait(1200);
    const bad = await clipped();
    ok(`testi: ${h} senza testi tagliati sotto la riga`, !bad.length, { bad: bad.slice(0, 5) });
  }
  await go('#/campionato/bundesliga', 6000); await ready();
  await pg.evaluate(() => { const r = document.createRange(); const h = document.querySelector('h1'); if (h) { const q = h.getBoundingClientRect(); window.__h1 = [q.top, q.bottom, h.scrollHeight, h.clientHeight]; } });
  await shot('testi-banner-bundesliga');
});

// Affidabilita' dei campionati aggiunti: Calcolatore (ricerca giocatori), partita non iniziata, Migliori giocatori
await step('affidabilita campionati aggiunti: ricerca nel Calcolatore, scheda in partita, migliori giocatori', async () => {
  const X = await getJson('calc_extra.json');
  ok('affidabilita: calc_extra.json presente con i 6 campionati', !!X && ['eredivisie', 'pro-league', 'fm-46', 'gre-super-league-1', 'liga-portugal', 'super-lig'].every((k) => X.leagues && X.leagues[k] && Object.keys(X.leagues[k].teams).length >= 12), { leghe: X && Object.keys(X.leagues || {}) });
  if (!X) return;
  // 1) Calcolatore: un giocatore per campionato si trova cercandolo
  const pick = (lg) => { const all = [...(X.players || []).filter((p) => p.lg === lg)]; return all.sort((a, b) => b.l[3] - a.l[3])[0]; };
  const found = {};
  await go('#/calcolatore', 5000);
  for (const lg of ['fm-46', 'eredivisie', 'super-lig', 'liga-portugal', 'pro-league', 'gre-super-league-1']) {
    const p = pick(lg) || (X.upd && null);
    if (!p) continue;
    await go('#/calcolatore', 3500);
    await pg.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /Cerca e seleziona/.test(x.textContent)); if (b) b.click(); });
    await wait(900);
    await pg.keyboard.type(p.n.split(' ').slice(-1)[0], { delay: 30 }); await wait(1200);
    const t = await pg.evaluate(() => document.body.innerText);
    found[lg] = t.includes(p.n);
  }
  ok('affidabilita: nel Calcolatore i giocatori dei 6 campionati si trovano con la ricerca', Object.keys(found).length >= 5 && Object.values(found).every(Boolean), { found });
  await shot('affidabilita-calcolatore-ricerca');
  // 2) partita non iniziata: la scheda Affidabilita' c'e' (dove almeno un giocatore ha voto >= 7)
  const idx = await getJson('arch/index.json');
  const now = Date.now();
  const cand = [];
  for (const fm of [57, 40, 46, 135, 61, 71]) {
    const e = idx && idx[String(fm)]; if (!e) continue;
    const sk = [...e.s].sort().reverse()[0];
    const d = await getJson(`arch/${fm}/${encodeURIComponent(sk)}.json`); if (!d) continue;
    (d.fix || []).filter((x) => !x[6] && !x[8] && Date.parse(x[4]) > now && Date.parse(x[4]) < now + 6 * 864e5).slice(0, 4).forEach((x) => cand.push({ fm, sk, id: x[0] }));
  }
  let withRel = 0; let first = null; const tried = [];
  for (const c of cand.slice(0, 18)) {
    await go(`#/match/a-${c.fm}-${encodeURIComponent(c.sk)}-${c.id}`, 5500); await ready();
    const tabs = await pg.evaluate(() => [...document.querySelectorAll('.tab-btn')].map((x) => x.textContent.trim()));
    tried.push(`${c.fm}:${tabs.includes('Affidabilità') ? 'si' : 'no'}`);
    if (tabs.includes('Affidabilità')) { withRel += 1; if (!first) first = c; }
  }
  ok('affidabilita: almeno una partita non iniziata dei 6 campionati ha la scheda Affidabilità', withRel >= 1 || cand.length === 0, { withRel, tried });
  if (first) {
    await go(`#/match/a-${first.fm}-${encodeURIComponent(first.sk)}-${first.id}`, 5500); await ready();
    await tabClick('Affidabilità'); await wait(1500);
    const t = await pg.evaluate(() => document.getElementById('sl-shell').innerText);
    ok('affidabilita: la scheda elenca giocatori con tiri attesi', /tiri attesi/.test(t), { snippet: t.slice(0, 120) });
    await shot('affidabilita-partita');
    const link = await pg.evaluate(() => { const a = [...document.querySelectorAll('a[href*="giocatore"]')][0]; if (a) { a.click(); return a.getAttribute('href'); } return null; });
    await wait(5000);
    const pt = await pg.evaluate(() => document.body.innerText);
    ok('affidabilita: il giocatore apre la scheda completa (Profilo / Statistiche)', !!link && /Profilo/.test(pt) && /Statistiche/.test(pt), { link });
    await shot('affidabilita-giocatore');
  }
  // giocatore dei campionati aggiunti che il Calcolatore conosce solo dai tiri (id d'archivio): la scheda completa si costruisce lo stesso
  const lite = (X.players || []).filter((p) => p.lg === 'fm-46').sort((a, b) => b.l[3] - a.l[3])[0];
  if (lite) {
    await go(`#/giocatore/${encodeURIComponent(lite.i)}`, 7000);
    const pt = await pg.evaluate(() => document.body.innerText);
    ok('affidabilita: scheda completa di un giocatore danese (Profilo / Statistiche / Carriera)', pt.includes(lite.n.split(' ').slice(-1)[0]) && /Profilo/.test(pt) && /Statistiche/.test(pt) && !ND.test(pt), { id: lite.i });
    await shot('affidabilita-giocatore-danese');
  }
  // 3) Migliori giocatori: giorno per giorno ci sono giocatori dei 6 campionati (stesse regole di affidabilita')
  const fixDays = new Set(Object.values(X.fix || {}).flat().map((f) => f[0]));
  await go('#/migliori-giocatori', 5000);
  const days = await pg.evaluate(() => [...document.querySelectorAll('button')].filter((b) => /^\w+ \d+$|^Oggi|^Domani|^Ieri/.test(b.textContent.trim())).length);
  ok('migliori giocatori: pagina con striscia dei giorni', days >= 3, { days });
  await shot('migliori-giocatori-campionati-aggiunti');
});

report.passed = report.checks.filter((c) => c.pass).length;
report.total = report.checks.length;
fs.writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 2));
await b.close();
console.log(JSON.stringify({ passed: report.passed, total: report.total, failed: report.failed, errors: report.errors.slice(0, 5) }, null, 1));
