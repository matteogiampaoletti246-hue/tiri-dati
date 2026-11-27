// ScalperLab - formazioni da diretta.it (Flashscore). Prima fonte della catena formazioni (vedi docs/regole/partite-formazioni.md).
// Dati pubblici letti al volo e mai salvati nel repository. Elenco partite del giorno: feed `x/feed/f_1_<giorno>_<fuso>_it_1` (testo con separatori ¬ e ÷);
// formazioni: GraphQL persistito `dlie2` (ufficiali) e `dplie` (probabili), verificato il 15/11/2026 su Belgio-Italia e su partite dei giorni dopo.
// Regole di aggiornamento (richieste dall'utente):
//   - oltre 1h26 dal fischio: una lettura ogni 2 ore (formazioni probabili);
//   - da 1h26 al fischio: una lettura ogni 2 secondi finche' le formazioni non sono ufficiali;
//   - ufficiali: salvate in KV e mai piu' riscritte; una sola lettura al fischio d'inizio, poi il live funziona come prima.
export const DL_WINDOW_MS = 86 * 60000;
const EARLY_MS = 2 * 3600000;
const BEAT_MS = 2000; // dentro la finestra: lettura nuova ogni 2 secondi (richiesta 16/11/2026: "appena viene mostrata deve comparire")
const FEED = "https://www.diretta.it/x/feed/";
const GQL = "https://400.ds.lsapp.eu/pq_graphql?projectId=400&_hash=";
const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile Safari/604.1";
const FEED_H = { "x-fsign": "SW9D1eZo", "User-Agent": UA, "Accept": "*/*", "Referer": "https://www.diretta.it/", "Origin": "https://www.diretta.it" };
const GQL_H = { "User-Agent": UA, "Accept": "application/json,*/*", "Referer": "https://www.diretta.it/", "Origin": "https://www.diretta.it" };

// ---- capienza fissa delle memorie in RAM (regola: ogni cache nuova ha un limite)
const MEM_CAP = 160;
function memSet(m, k, v) {
  if (m.has(k)) m.delete(k);
  m.set(k, v);
  while (m.size > MEM_CAP) m.delete(m.keys().next().value);
}
const MEM = new Map(); // id partita FotMob -> { t, d, rec }
const MAP = new Map(); // id partita FotMob -> { mid, t }

// ---- nomi: FotMob scrive in inglese, diretta.it in italiano
export const norm = (s) => String(s == null ? "" : s).replace(/ø/gi, "o").replace(/æ/gi, "ae").replace(/ß/g, "ss").replace(/[đð]/gi, "d").replace(/ł/gi, "l").replace(/ı/g, "i").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").trim();
const COUNTRY = {
  "italy": "italia", "germany": "germania", "spain": "spagna", "england": "inghilterra", "france": "francia", "netherlands": "olanda", "holland": "olanda", "belgium": "belgio",
  "switzerland": "svizzera", "scotland": "scozia", "wales": "galles", "ireland": "irlanda", "northern ireland": "irlanda del nord", "republic of ireland": "irlanda", "croatia": "croazia",
  "denmark": "danimarca", "sweden": "svezia", "norway": "norvegia", "poland": "polonia", "hungary": "ungheria", "greece": "grecia", "slovakia": "slovacchia", "ukraine": "ucraina",
  "iceland": "islanda", "finland": "finlandia", "latvia": "lettonia", "lithuania": "lituania", "luxembourg": "lussemburgo", "faroe islands": "faeroerne", "moldova": "moldavia",
  "kazakhstan": "kazakistan", "azerbaijan": "azerbaigian", "north macedonia": "macedonia del nord", "bosnia and herzegovina": "bosnia erzegovina", "bosnia herzegovina": "bosnia erzegovina",
  "cyprus": "cipro", "belarus": "bielorussia", "israel": "israele", "portugal": "portogallo", "czechia": "repubblica ceca", "czech republic": "repubblica ceca", "turkiye": "turchia", "turkey": "turchia",
  "russia": "russia", "georgia": "georgia", "romania": "romania", "austria": "austria", "brazil": "brasile", "chile": "cile", "peru": "peru", "mexico": "messico", "usa": "stati uniti",
  "united states": "stati uniti", "jamaica": "giamaica", "curacao": "curacao", "japan": "giappone", "south korea": "corea del sud", "korea republic": "corea del sud", "new zealand": "nuova zelanda",
  "china": "cina", "china pr": "cina", "saudi arabia": "arabia saudita", "united arab emirates": "emirati arabi uniti", "uae": "emirati arabi uniti", "egypt": "egitto", "morocco": "marocco",
  "cameroon": "camerun", "ivory coast": "costa d avorio", "cote d ivoire": "costa d avorio", "south africa": "sudafrica", "dr congo": "congo dr", "congo dr": "congo dr", "equatorial guinea": "guinea equatoriale",
  "central african republic": "central african rep", "cape verde": "capo verde", "cabo verde": "capo verde", "tunisia": "tunisia", "algeria": "algeria", "nigeria": "nigeria", "ghana": "ghana", "senegal": "senegal",
  "indonesia": "indonesia", "thailand": "thailandia", "vietnam": "vietnam", "india": "india", "iran": "iran", "iraq": "iraq", "jordan": "giordania", "syria": "siria", "lebanon": "libano",
  "haiti": "haiti", "guatemala": "guatemala", "honduras": "honduras", "el salvador": "el salvador", "trinidad and tobago": "trinidad e tobago", "dominican republic": "repubblica dominicana",
  "estonia": "estonia", "malta": "malta", "gibraltar": "gibilterra", "slovenia": "slovenia", "serbia": "serbia", "bulgaria": "bulgaria", "albania": "albania", "montenegro": "montenegro", "kosovo": "kosovo",
  "armenia": "armenia", "andorra": "andorra", "san marino": "san marino", "liechtenstein": "liechtenstein", "argentina": "argentina", "uruguay": "uruguay", "paraguay": "paraguay", "colombia": "colombia",
  "ecuador": "ecuador", "bolivia": "bolivia", "venezuela": "venezuela", "canada": "canada", "panama": "panama", "costa rica": "costa rica", "australia": "australia", "uzbekistan": "uzbekistan", "qatar": "qatar",
};
const CLUB = [[/\bmunich\b/g, "monaco"], [/\b(cologne|koln)\b/g, "colonia"], [/\bmarseille\b/g, "marsiglia"], [/\bseville\b/g, "siviglia"], [/\blisbon\b/g, "lisbona"], [/\bturin\b/g, "torino"],
  [/\bnuremberg\b/g, "norimberga"], [/\bstuttgart\b/g, "stoccarda"], [/\bbrunswick\b/g, "braunschweig"], [/\bmoenchengladbach\b/g, "monchengladbach"], [/\bglasgow\b/g, "glasgow"],
  [/\bunited\b/g, "utd"], [/\batletico\b/g, "atl"], [/\bathletic club\b/g, "athletic bilbao"], [/\bparis saint germain\b/g, "psg"], [/\bparis sg\b/g, "psg"]];
const NOISE = new Set(["fc", "cf", "afc", "sc", "ac", "sv", "fk", "sk", "bk", "if", "ik", "ssc", "us", "ss", "cd", "ud", "rc", "vfl", "vfb", "tsg", "bsc", "1", "de", "the"]);
export function canon(name) {
  let s = norm(name);
  s = s.replace(/\b(women|woman|w|ladies|femminile|fem)\b$/, "d");
  const whole = s.replace(/ (u ?\d\d)$/, "");
  const tail = s.slice(whole.length);
  if (COUNTRY[whole]) s = COUNTRY[whole] + tail;
  CLUB.forEach(([re, to]) => { s = s.replace(re, to); });
  s = s.split(" ").filter((t) => t && !NOISE.has(t)).join(" ");
  return s;
}
const bigrams = (s) => { const t = s.replace(/ /g, ""); const m = new Map(); for (let i = 0; i < t.length - 1; i++) { const g = t.slice(i, i + 2); m.set(g, (m.get(g) || 0) + 1); } return m; };
export function sim(a, b) {
  const x = canon(a), y = canon(b);
  if (!x || !y) return 0;
  if (x === y) return 1;
  const X = new Set(x.split(" ")), Y = new Set(y.split(" "));
  const sm = X.size <= Y.size ? X : Y, lg = X.size <= Y.size ? Y : X;
  if ([...sm].every((t) => lg.has(t)) && sm.size >= 1 && [...sm].join("").length >= 4) return 0.9; // "Milan" dentro "AC Milan", "Sporting" dentro "Sporting CP"
  const bx = bigrams(x), by = bigrams(y);
  let inter = 0, tx = 0, ty = 0;
  bx.forEach((n, g) => { tx += n; if (by.has(g)) inter += Math.min(n, by.get(g)); });
  by.forEach((n) => { ty += n; });
  return tx + ty ? (2 * inter) / (tx + ty) : 0;
}

// ---- tempo: giorno e fuso italiani del fischio (il feed della lista e' per giorno/fuso)
function romeParts(ms) {
  const f = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Rome", hour12: false, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }).formatToParts(new Date(ms));
  const g = (t) => +f.find((p) => p.type === t).value;
  return { y: g("year"), mo: g("month"), d: g("day"), h: g("hour") % 24, mi: g("minute"), s: g("second") };
}
export function dayKey(koMs, nowMs) {
  const k = romeParts(koMs), n = romeParts(nowMs);
  const off = Math.round((Date.UTC(k.y, k.mo - 1, k.d) - Date.UTC(n.y, n.mo - 1, n.d)) / 86400000);
  const tz = Math.round((Date.UTC(k.y, k.mo - 1, k.d, k.h, k.mi, k.s) - koMs) / 3600000);
  return { off, tz };
}

// ---- lista partite del giorno: solo i record con lo stesso orario del fischio (niente analisi dell'intero file)
export function findCands(txt, ts) {
  const out = [];
  for (const dt of [0, -300, 300, -900, 900, -1800, 1800, -3600, 3600]) {
    const needle = "¬AD÷" + (ts + dt) + "¬";
    let i = txt.indexOf(needle);
    while (i >= 0) {
      const s = txt.lastIndexOf("~AA÷", i);
      const e = txt.indexOf("~", i);
      if (s >= 0) {
        const seg = txt.slice(s, e < 0 ? undefined : e);
        const g = (k) => { const m = seg.match(new RegExp("¬" + k + "÷([^¬]*)")); return m ? m[1] : ""; };
        out.push({ mid: seg.slice(4, seg.indexOf("¬")), h: g("CX") || g("AE"), a: g("AF"), dt });
      }
      i = txt.indexOf(needle, i + 1);
    }
    if (out.length) break; // orario esatto prima, scarti solo se non c'e' nulla
  }
  return out;
}
// abbinamento per nomi: serve una coppia convincente e chiaramente migliore delle altre, altrimenti nessuna formazione da diretta (si resta sulla catena di prima)
export function pick(cands, hn, an) {
  const sc = cands.map((c) => { const a = sim(hn, c.h), b = sim(an, c.a); return { c, a, b, v: (a + b) / 2 }; }).sort((x, y) => y.v - x.v);
  const best = sc[0];
  if (!best || best.a < 0.4 || best.b < 0.4 || best.v < 0.55) return null;
  if (sc[1] && best.v - sc[1].v < 0.08) return null;
  return best.c.mid;
}

// ---- formazioni dal GraphQL
const swapName = (n) => {
  const m = String(n || "").trim().match(/^(.+?)\s+((?:[A-Z][a-z]?\.\s?)+)$/);
  return m ? (m[2].trim() + " " + m[1]).replace(/\s+/g, " ") : String(n || "").trim();
};
export function parseSide(ep, key) {
  const L = ep && ep[key];
  if (!L || !Array.isArray(L.players)) return null;
  if (!L.formation) {
    // 25/11/2026: diretta pubblica l'ufficiale prima SENZA modulo (solo elenco "Formazioni iniziali" + panchina): prima si scartava e restava la probabile
    // per 5-10 minuti. Ora l'elenco degli 11 vale subito (senza posti in campo: li completano FotMob/ESPN/PitchAPI se li hanno, se no elenco).
    const byId0 = {};
    L.players.forEach((p) => { byId0[p.id] = p; });
    const st = (L.groups || []).find((g) => g.groupType === "STARTERS");
    const ids = (st && st.playerIds) || [];
    if (ids.length !== 11 || ids.some((id) => !byId0[id])) return null;
    const mk0 = (p) => [swapName(p.listName || p.fieldName), p.number != null && p.number !== "" ? (+p.number || p.number) : null, null, null, (p.playerRoles || []).some((r) => /capitano|captain/i.test((r && r.title) || "")), null, null, null, null];
    const sub0 = (L.groups || []).find((g) => g.groupType === "SUBSTITUTES");
    const co0 = ((L.coaches || {}).players || [])[0];
    return { f: null, s: ids.map((id) => mk0(byId0[id])), b: sub0 ? (sub0.playerIds || []).map((id) => byId0[id]).filter(Boolean).map(mk0) : [], co: co0 ? { id: null, n: swapName(co0.name || co0.listName), cc: null } : null, list: 1 };
  }
  const rows = (((L.formation.lines || [])[0] || {}).rows || []).slice().sort((x, y) => x.sortKey - y.sortKey);
  const byId = {};
  L.players.forEach((p) => { byId[p.id] = p; });
  const n = rows.reduce((a, r) => a + (r.playerIds || []).length, 0);
  if (n !== 11 || rows.length < 3) return null;
  const R = rows.length;
  const mk = (p, xy) => {
    const num = p.number != null && p.number !== "" ? (+p.number || p.number) : null;
    const cap = (p.playerRoles || []).some((r) => /capitano|captain/i.test((r && r.title) || ""));
    return [swapName(p.listName || p.fieldName), num, xy ? xy[0] : null, xy ? xy[1] : null, cap, null, null, null, null];
  };
  const s = [];
  for (let ri = 0; ri < R; ri++) {
    const ids = rows[ri].playerIds || [];
    for (let ci = 0; ci < ids.length; ci++) {
      const p = byId[ids[ci]];
      if (!p) return null;
      // colonne da destra a sinistra (come LiveScore e come la pagina di diretta: terzino destro per primo)
      s.push(mk(p, [0.05 + (ri / (R - 1)) * 0.8, 1 - (ci + 1) / (ids.length + 1)]));
    }
  }
  const sub = (L.groups || []).find((g) => g.groupType === "SUBSTITUTES");
  const b = sub ? (sub.playerIds || []).map((id) => byId[id]).filter(Boolean).map((p) => mk(p, null)) : [];
  const co = ((L.coaches || {}).players || [])[0];
  return { f: String(L.formation.name || rows.slice(1).map((r) => r.playerIds.length).join("-")), s, b, co: co ? { id: null, n: swapName(co.name || co.listName), cc: null } : null };
}
export function parseTeams(j, key) {
  const eps = (((j || {}).data || {}).findEventById || {}).eventParticipants || [];
  const home = eps.find((e) => e.type && e.type.side === "HOME"), away = eps.find((e) => e.type && e.type.side === "AWAY");
  const h = parseSide(home, key), a = parseSide(away, key);
  return h && a ? { h, a } : null;
}

async function jget(url, headers, ms) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms || 3500);
  try {
    const r = await fetch(url, { headers, signal: ctl.signal });
    return r.ok ? r : null;
  } catch (e) { return null; } finally { clearTimeout(t); }
}
async function lineupsOf(mid) {
  const o = await jget(GQL + "dlie2&eventId=" + mid, GQL_H);
  if (o) {
    const p = parseTeams(await o.json().catch(() => null), "lineup");
    if (p) {
      // ufficiale in solo elenco: si tiene anche la probabile di diretta (modulo e posti) per mettere gli 11 ufficiali in campo (27/11/2026)
      if (p.h.list || p.a.list) {
        const q = await jget(GQL + "dplie&eventId=" + mid, GQL_H);
        const pp = q ? parseTeams(await q.json().catch(() => null), "predictedLineup") : null;
        if (pp) return { official: true, h: p.h, a: p.a, ph: pp.h, pa: pp.a };
      }
      return { official: true, h: p.h, a: p.a };
    }
  }
  const q = await jget(GQL + "dplie&eventId=" + mid, GQL_H);
  if (q) { const p = parseTeams(await q.json().catch(() => null), "predictedLineup"); if (p) return { official: false, h: p.h, a: p.a }; }
  return null;
}
async function midOf(fmId, koMs, hn, an) {
  const hit = MAP.get(fmId);
  if (hit && Date.now() - hit.t < (hit.mid ? 6 * 3600000 : 300000)) return hit.mid;
  let mid = null;
  try {
    const { off, tz } = dayKey(koMs, Date.now());
    if (Math.abs(off) <= 6) {
      const r = await fetch(FEED + "f_1_" + off + "_" + tz + "_it_1", { headers: FEED_H, cf: { cacheTtl: 600, cacheEverything: true } });
      if (r.ok) mid = pick(findCands(await r.text(), Math.floor(koMs / 1000)), hn, an);
    }
  } catch (e) { /* nessun abbinamento: si resta sulla catena di prima */ }
  memSet(MAP, fmId, { mid, t: Date.now() });
  return mid;
}

// Ritorna { official, h, a } nello stesso formato di /fx, oppure null. `env.ROSE` (KV) conserva le formazioni ufficiali: una volta ufficiali e dopo il fischio non si rilegge piu'.
export async function dlLineups(g2, stt, fmId, env) {
  try {
    if (g2.finished) return null;
    const koMs = Date.parse(g2.matchTimeUTCDate || (stt && stt.utcTime) || "");
    if (!koMs) return null;
    const now = Date.now(), started = !!g2.started, to = koMs - now;
    if (!started && to > 6 * 86400000) return null; // il feed elenco partite di diretta copre 6 giorni
    const kv = env && env.ROSE;
    const key = "idx:dl/" + fmId;
    let memo = MEM.get(fmId);
    let rec = memo && memo.rec;
    if (!rec && kv) { try { rec = await kv.get(key, "json"); } catch (e) { rec = null; } }
    const out = (r) => (r && r.h && r.a ? { official: !!r.c, h: r.h, a: r.a, ph: r.ph, pa: r.pa } : null);
    // ufficiale in solo elenco: si continua a rileggere finche' diretta non mette il modulo
    if (rec && (rec.k || (rec.c && !started && rec.h && rec.h.f))) { memSet(MEM, fmId, { t: (memo && memo.t) || now, d: memo && memo.d, rec }); return out(rec); }
    // oltre 1h26: ogni 2 ore; dentro la finestra: ogni 5 secondi; al fischio: una lettura nuova
    const ttl = started ? 0 : to > DL_WINDOW_MS ? EARLY_MS : BEAT_MS;
    // lettura fallita (null): si riprova dopo al massimo 2 minuti, non dopo 2 ore (22/11/2026)
    if (memo && memo.d !== undefined && now - memo.t < (memo.d ? ttl : Math.min(ttl, 120000))) return memo.d;
    const hn = g2.homeTeam && g2.homeTeam.name, an = g2.awayTeam && g2.awayTeam.name;
    const mid = (rec && rec.mid) || (await midOf(fmId, koMs, hn, an));
    let d = null;
    if (mid) d = await lineupsOf(mid);
    memSet(MEM, fmId, { t: now, d, rec });
    if (kv && mid) {
      if (started) {
        // al fischio: lettura finale; se diretta non risponde resta quanto gia' salvato (mai perdere le ufficiali)
        const fin = d || (rec && rec.h && rec.a ? { official: !!rec.c, h: rec.h, a: rec.a } : null);
        const r = { mid, k: 1, c: fin && fin.official ? 1 : 0, h: fin ? fin.h : null, a: fin ? fin.a : null, ph: fin ? fin.ph : null, pa: fin ? fin.pa : null, t: now };
        memSet(MEM, fmId, { t: now, d, rec: r });
        await kv.put(key, JSON.stringify(r), { expirationTtl: 14 * 86400 }).catch(() => {});
      } else if (d && d.official) {
        const r = { mid, c: 1, h: d.h, a: d.a, ph: d.ph, pa: d.pa, t: now };
        memSet(MEM, fmId, { t: now, d, rec: r });
        await kv.put(key, JSON.stringify(r), { expirationTtl: 14 * 86400 }).catch(() => {});
      }
    } else if (started) {
      memSet(MEM, fmId, { t: now, d, rec: { k: 1, c: d && d.official ? 1 : 0, h: d ? d.h : null, a: d ? d.a : null } });
    }
    return d;
  } catch (e) { return null; /* mai rompere /fx */ }
}

// Record grezzo della partita nel feed di diretta.it (partite live: stato e tempo). Lettura breve (5 s), mai salvata.
export async function dlSegment(g2, stt) {
  try {
    const koMs = Date.parse(g2.matchTimeUTCDate || (stt && stt.utcTime) || "");
    if (!koMs) return null;
    const { off, tz } = dayKey(koMs, Date.now());
    if (Math.abs(off) > 1) return null;
    const r = await fetch(FEED + "f_1_" + off + "_" + tz + "_it_1", { headers: FEED_H, cf: { cacheTtl: 5, cacheEverything: true } });
    if (!r.ok) return null;
    const txt = await r.text();
    const hn = g2.homeTeam && g2.homeTeam.name, an = g2.awayTeam && g2.awayTeam.name;
    const mid = pick(findCands(txt, Math.floor(koMs / 1000)), hn, an);
    if (!mid) return null;
    const i = txt.indexOf("~AA÷" + mid + "¬");
    if (i < 0) return null;
    const e = txt.indexOf("~", i + 1);
    return txt.slice(i, e < 0 ? undefined : e);
  } catch (e) { return null; }
}

// Cronometro di diretta.it (verificato il 16/11/2026 su Kazakhstan-Slovakia, quando FotMob era indietro di ~4 minuti): nel record `AB`=2 live, `AC` fase (12 primo tempo,
// 13 secondo tempo, 38 intervallo) e `AO` = secondo (unix) in cui e' iniziata la fase in corso. Minuto = inizio fase (0' o 45') + secondi passati da `AO`.
export async function dlClock(g2, stt) {
  const seg = await dlSegment(g2, stt);
  if (!seg) return null;
  const g = (k) => { const m = seg.match(new RegExp("¬" + k + "÷([^¬]*)")); return m ? m[1] : ""; };
  if (g("AB") !== "2") return null;
  const ac = g("AC"), ao = Number(g("AO"));
  if (ac === "38") return { ht: true, s: null };
  if ((ac !== "12" && ac !== "13") || !ao) return null;
  const s = Math.floor((ac === "13" ? 45 * 60 : 0) + (Date.now() / 1000 - ao));
  return s >= (ac === "13" ? 45 * 60 : 0) ? { ht: false, s } : null;
}

// Punteggio ed eventi (gol, assist, cartellini) di diretta.it: appena li scrivono sono qui (feed `df_sui_1_<id>` verificato il 16/11/2026 su Kazakhstan-Slovakia).
// Record: `~III÷` = un evento; `IA` lato (1 casa, 2 ospite), `IB` minuto ("17'", "45+2'"), poi gruppi `IE`/`IF` (nome "Cognome I.")/`IK` (testo: "Gol", "Assist", "Cartellino Giallo"...).
function parseMin(x) {
  const m = String(x || "").match(/(\d+)(?:\+(\d+))?/);
  return m ? { t: +m[1], a: m[2] ? +m[2] : 0 } : null;
}
export function parseIncidents(txt) {
  const out = [];
  String(txt || "").split("~III÷").slice(1).forEach((chunk) => {
    const body = chunk.split("~")[0];
    const parts = ("III÷" + body).split("¬");
    const f = {}; const groups = [];
    let cur = null;
    parts.forEach((kv) => {
      const k = kv.slice(0, kv.indexOf("÷")), v = kv.slice(kv.indexOf("÷") + 1);
      if (k === "IE") { cur = { IE: v }; groups.push(cur); } else if (cur && (k === "IF" || k === "IK" || k === "IL" || k === "INX" || k === "IOX" || k === "ICT")) cur[k] = v; else if (!cur) f[k] = v;
    });
    const mn = parseMin(f.IB);
    const side = f.IA === "1" ? 1 : f.IA === "2" ? 2 : 0;
    if (!mn || !side || !groups.length) return;
    const first = groups[0];
    const text = String(first.IK || "");
    const base = { t: mn.t, a: mn.a, h: side === 1, ts: mn.t * 100 + mn.a };
    // 22/11/2026 (Barcelona-Villarreal): "Rigore sbagliato" veniva letto come gol (bastava la parola "rigore"). Rigore sbagliato/parato = MissedPenalty
    // (si abbina a quello di FotMob, mai un gol); gol annullato (VAR) = nessun evento.
    if (/annullat|disallow|cancel/i.test(text)) return;
    if (/rigore|penalty/i.test(text) && /sbagliat|parat|fallit|miss|sav|errat/i.test(text)) { out.push({ ...base, ty: "MissedPenalty", n: swapName(first.IF), id: null }); return; }
    if (/autogol|own goal/i.test(text) || /^gol/i.test(text) || /^rigore/i.test(text) || /^goal/i.test(text)) {
      const as = groups.slice(1).find((g) => /assist/i.test(g.IK || ""));
      out.push({ ...base, ty: "Goal", n: swapName(first.IF), id: null, as: as ? swapName(as.IF) : null, aid: null, og: /autogol|own goal/i.test(text), pen: /rigore|penalty/i.test(text), sc: null });
    } else if (/cartellino/i.test(text)) {
      const yel = /giallo/i.test(text), red = /rosso/i.test(text), two = /second|doppia/i.test(text);
      out.push({ ...base, ty: "Card", n: swapName(first.IF), id: null, cd: yel && red ? "YellowRed" : red ? "Red" : two ? "YellowRed" : "Yellow" });
    } else if (/sostituzione/i.test(text)) {
      // due gruppi: "Sostituzione - Esce" e "Sostituzione - Entra" (come FotMob: n = entra, o = esce)
      const inn = groups.find((g) => /entra/i.test(g.IK || "")), outg = groups.find((g) => /esce/i.test(g.IK || ""));
      if (inn) out.push({ ...base, ty: "Substitution", n: swapName(inn.IF), id: null, o: outg ? swapName(outg.IF) : "", oid: null });
    }
  });
  return out;
}
export async function dlEvents(g2, stt) {
  const seg = await dlSegment(g2, stt);
  if (!seg) return null;
  const g = (k) => { const m = seg.match(new RegExp("¬" + k + "÷([^¬]*)")); return m ? m[1] : ""; };
  const mid = seg.slice(4, seg.indexOf("¬"));
  const live = g("AB") === "2";
  const h = parseInt(g("AG"), 10), a = parseInt(g("AH"), 10);
  const sc = Number.isFinite(h) && Number.isFinite(a) ? [h, a] : null;
  let ev = [];
  if (mid && (live || g("AB") === "3")) {
    try {
      const r = await fetch(FEED + "df_sui_1_" + mid, { headers: FEED_H, cf: { cacheTtl: 5, cacheEverything: true } });
      if (r.ok) ev = parseIncidents(await r.text());
    } catch (e) { /* solo punteggio */ }
  }
  return { live, sc, ev };
}

