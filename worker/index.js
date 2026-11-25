// ScalperLab - ponte Live (Cloudflare Worker). Legge ESPN e lo restituisce al sito con una cache di pochi secondi.
import { dlLineups, dlClock, dlEvents } from "./diretta.js";
const ORIGIN = "https://matteogiampaoletti246-hue.github.io";
const BASE = "https://site.api.espn.com/apis/site/v2/sports/soccer";
const DOM = ["ita.1", "eng.1", "esp.1", "ger.1", "fra.1"];
const CUPS = ["uefa.champions", "uefa.europa", "uefa.europa.conf", "uefa.nations", "fifa.friendly"];
const LEGHE = DOM.concat(CUPS);
const TTL = 8;
const FMH = { "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile Safari/604.1", "Accept": "application/json,*/*", "Accept-Language": "en-US,en;q=0.9" };


// ---- LiveScore come ripiego del live (dopo FotMob): punteggio, stato, minuto ed eventi. Dati pubblici letti al volo, mai salvati.
// Si prende il piu' veloce: punteggio = il piu' alto tra le due fonti; se FotMob non ha ancora aperto la partita ma LiveScore si', la partita e' live;
// se FotMob non ha eventi (o meno gol del punteggio) gli eventi vengono da LiveScore (gol, gialli, cambi: solo i codici verificati).
const LSB = "https://prod-cdn-public-api.livescore.com/v1/api/app/";
const LSH = { "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile Safari/604.1" };
async function lsGet(url, ttl) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 2000);
  try {
    const r = await fetch(url, { headers: LSH, signal: ctl.signal, cf: { cacheTtl: ttl, cacheEverything: true } });
    return r.ok ? await r.json() : null;
  } catch (e) { return null; } finally { clearTimeout(t); }
}
const lsFlat = (o, acc) => {
  if (Array.isArray(o)) o.forEach((v) => lsFlat(v, acc));
  else if (o && typeof o === "object") { if (o.IT != null) acc.push(o); Object.values(o).forEach((v) => (v && typeof v === "object") && lsFlat(v, acc)); }
  return acc;
};
async function lsMerge(out, startIso) {
  try {
    if (!out.hi || !out.ai) return;
    const d = startIso ? new Date(startIso) : new Date();
    if (isNaN(d.getTime())) return;
    if (out.fin && out.ev && out.ev.length) return; // finita e completa: FotMob basta
    if (!out.st && !out.fin && d.getTime() - Date.now() > 15 * 60000) return; // ancora lontana dal fischio: niente risultato o eventi da prendere (e il file del giorno pesa sul calcolo)
    const ymd = d.toISOString().slice(0, 10).replace(/-/g, "");
    const day = await lsGet(LSB + "date/soccer/" + ymd + "/1?countryCode=GB&locale=en&MD=1", 10);
    if (!day) return;
    let ev0 = null;
    for (const st of day.Stages || []) {
      for (const x of st.Events || []) {
        const a = ((x.T1 || [{}])[0].Img || "").match(/enet\/(\d+)\.png/), b = ((x.T2 || [{}])[0].Img || "").match(/enet\/(\d+)\.png/);
        if (a && b && +a[1] === +out.hi && +b[1] === +out.ai) { ev0 = x; break; }
      }
      if (ev0) break;
    }
    if (!ev0) return;
    const eps = String(ev0.Eps || "");
    const mm = eps.match(/^(\d+)(?:\+(\d+))?'?$/);
    const lsLive = !!mm || /^HT$/i.test(eps);
    const h = parseInt(ev0.Tr1, 10), a2 = parseInt(ev0.Tr2, 10);
    const hasSc = Number.isFinite(h) && Number.isFinite(a2);
    if (lsLive && !out.fin) {
      if (!out.st) { out.st = true; out.started = true; }
      if (/^HT$/i.test(eps)) { out.ht = true; out.clk = "HT"; }
      else if (mm && !out.clk) out.clk = (mm[2] ? mm[1] + "+" + mm[2] : mm[1]) + "'";
    }
    if (hasSc && (lsLive || out.st) && !out.fin) {
      const cur = out.sc && out.sc[0] != null ? [+out.sc[0] || 0, +out.sc[1] || 0] : [0, 0];
      out.sc = [Math.max(cur[0], h), Math.max(cur[1], a2)];
      out.ls = 1;
    }
    // eventi: solo se mancano o FotMob ha meno gol del punteggio
    const goals = (out.ev || []).filter((e) => e.ty === "Goal").length;
    const tot = hasSc ? h + a2 : 0;
    if (ev0.Eid && (!(out.ev || []).length || goals < tot) && (lsLive || out.fin || out.st)) {
      const inc = await lsGet(LSB + "incidents/soccer/" + ev0.Eid + "?locale=en", 8);
      const ln = await lsGet(LSB + "lineups/soccer/" + ev0.Eid + "?locale=en", 30);
      if (inc) {
        const rows = lsFlat(inc.Incs, []).concat(ln ? lsFlat(ln.Subs, []) : []);
        const nm = (x) => ((x.Fn || "") + " " + (x.Ln || "")).trim() || x.Pn || "";
        const lsEv = [];
        rows.forEach((x) => {
          const side = x.Nm, mn = x.Min;
          if ((side !== 1 && side !== 2) || typeof mn !== "number") return;
          const add = x.MinEx || 0, base = { t: mn, a: add, h: side === 1, ts: mn * 100 + add };
          if (x.IT === 36 || x.IT === 37 || x.IT === 39) lsEv.push({ ...base, ty: "Goal", n: nm(x), id: null, as: null, aid: null, og: x.IT === 39, pen: x.IT === 37, sc: null });
          else if (x.IT === 43) lsEv.push({ ...base, ty: "Card", n: nm(x), id: null, cd: "Yellow" });
          else if (x.IT === 5) lsEv.push({ ...base, ty: "Substitution", n: nm(x), id: null, o: "", oid: null });
        });
        if (lsEv.length) {
          const lsGoals = lsEv.filter((q) => q.ty === "Goal");
          if (!(out.ev || []).length) out.ev = lsEv.sort((x, y) => x.ts - y.ts);
          else if (goals < lsGoals.length) out.ev = (out.ev || []).filter((e) => e.ty !== "Goal").concat(lsGoals).sort((x, y) => x.ts - y.ts);
          out.lsEv = 1;
        }
      }
    }
  } catch (e) { /* mai rompere /fx: si resta su FotMob */ }
}


// Righe di un'altra fonte + dati FotMob della stessa partita (formazione "simple"): stesso numero di maglia = stesso giocatore
function fmFill(t, fm, strict) {
  if (!fm) return t;
  const byNum = {};
  [...(fm.s || []), ...(fm.b || [])].forEach((p) => { if (p[1] != null) byNum[String(p[1])] = p; });
  const fix = (p) => { const f = p[1] != null ? byNum[String(p[1])] : null; return f && (!strict || samePerson(p[0], f[0])) ? [f[0], p[1], p[2], p[3], f[4], f[5], f[6], f[7], f[8]] : p; };
  return { f: t.f, s: t.s.map(fix), b: (t.b || []).map(fix), co: fm.co || t.co };
}

// Formazione di diretta.it -> righe nel formato FotMob (15/11/2026). Il numero di maglia non basta (diretta e FotMob possono avere numeri diversi, specie nelle
// nazionali): ogni giocatore si abbina per NOME, in quest'ordine: 1) formazione FotMob della stessa partita (numero + nome, poi solo nome); 2) rosa della squadra
// (`rosa/` del sito); 3) rosa e ultima formazione dalla pagina squadra FotMob (solo per chi resta senza id). Abbinamento solo se il nome e' unico: mai indovinato.
// Nome mostrato = nome intero FotMob (come nel resto dell'app), id e foto di FotMob; posizione in campo, numero e capitano restano di diretta.
async function dlFill(t, fm, tid) {
  const ph = (id) => (id ? "https://images.fotmob.com/image_resources/playerimages/" + id + ".png" : null);
  const fmRows = fm ? [...(fm.s || []), ...(fm.b || [])] : [];
  const uniq = (rows, name, get) => {
    let hit = rows.filter((q) => samePerson(get(q), name));
    if (hit.length > 1) { // "V. Milinkovic-Savic": vale chi ha nome intero con la stessa iniziale (non "Milinkovic-Savic" da solo)
      const ini = nKey(name)[0] ? nKey(name)[0][0] : "";
      const better = hit.filter((q) => { const k = nKey(get(q)); return k.length >= 3 && k[0][0] === ini; });
      if (better.length === 1) hit = better;
    }
    return hit.length === 1 ? hit[0] : null;
  };
  const lev = (a, b) => { const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]); for (let j = 1; j <= b.length; j++) d[0][j] = j; for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[a.length][b.length]; };
  // stessa iniziale + cognome uguale o scritto quasi uguale ("Yarmolyuk" / "Yarmoliuk", "Brereton Diaz" / "Brereton"): solo se unico
  const loose = (rows, name, get) => {
    const k = nKey(name);
    if (k.length < 2 || k[0].length !== 1) return null;
    const rest = k.slice(1).filter((x) => x.length >= 5);
    const hit = rows.filter((q) => {
      const g = nKey(get(q));
      if (g.length < 2 || g[0][0] !== k[0]) return false;
      const sur = g[g.length - 1];
      return rest.some((a) => a === sur || (a.length >= 6 && sur.length >= 6 && lev(a, sur) <= 2));
    });
    return hit.length === 1 ? hit[0] : null;
  };
  const solo = (rows, name, get) => { // nome singolo di diretta ("Cunha"): solo se e' l'ultimo nome di un unico giocatore della rosa
    const k = nKey(name);
    if (k.length !== 1 || k[0].length < 4) return null;
    const hit = rows.filter((q) => { const g = nKey(get(q)); return g.length && g[g.length - 1] === k[0]; });
    return hit.length === 1 ? hit[0] : null;
  };
  // rosa e pagina squadra si leggono UNA volta per squadra: la promessa e' condivisa da tutti i giocatori (prima il primo giocatore
  // metteva una lista vuota e gli altri, letti in parallelo, la trovavano gia' "pronta": Neymar, Coutinho... restavano senza id, 18/11/2026)
  let rosP = null, sqP = null;
  const loadRosa = () => rosP || (rosP = (async () => {
    try {
      const r = await fetch(SITE + "rosa/" + (Number(tid) % 100) + ".json", { cf: { cacheTtl: 3600, cacheEverything: true } });
      if (r.ok) return ((((await r.json()) || {})[String(tid)] || {}).p || []).filter((q) => q[0] > 0);
    } catch (e) { /* senza rosa si passa alla fonte dopo */ }
    return [];
  })());
  const loadSquad = () => sqP || (sqP = (async () => {
    const sq = [];
    try {
      const T = await fmTeam(tid);
      if (T) {
        const add = (q) => { if (q && q.id && q.name && !sq.some((z) => z.id === q.id)) sq.push({ id: q.id, name: q.name, num: q.shirtNumber != null && q.shirtNumber !== "" ? +q.shirtNumber || null : null }); };
        T.mem.forEach(add);
        const ll = T.ll;
        if (ll) [...(ll.starters || []), ...(ll.subs || []), ...(ll.bench || [])].forEach(add);
      }
    } catch (e) { /* idem */ }
    return sq;
  })());
  // stesso numero di maglia nella rosa della squadra e almeno un nome in comune ("Tiago Coser" = "Tiago" n. 23, "Arthur Melo" = "Arthur" n. 6): solo se unico
  const byShirt = (rows, name, num, getName, getNum) => {
    if (num == null || num === "") return null;
    const k = nKey(name).filter((x) => x.length >= 3);
    const hit = rows.filter((q) => String(getNum(q)) === String(num) && (samePerson(getName(q), name) || nKey(getName(q)).some((x) => x.length >= 3 && k.includes(x))));
    return hit.length === 1 ? hit[0] : null;
  };
  const searchPlayers = async (name) => {
    const toks = String(name || "").split(/\s+/).filter((x) => x && !/^[A-Za-z]\.?$/.test(x));
    const terms = [...new Set([toks.join(" ").trim(), [...toks].sort((a, b) => b.length - a.length)[0] || ""])].filter((x) => x.length >= 3);
    const res = [];
    for (const term of terms) {
      try {
        const r = await fetch("https://www.fotmob.com/api/data/search/suggest?term=" + encodeURIComponent(term), { headers: FMH, cf: { cacheTtl: 3600, cacheEverything: true } });
        if (!r.ok) continue;
        const grp = ((await r.json()) || []).find((g) => g && g.title && g.title.key === "players");
        ((grp && grp.suggestions) || []).filter((q) => q.type === "player" && !q.isCoach && q.id && q.name).forEach((q) => { if (!res.some((z) => z.id === +q.id)) res.push({ id: +q.id, name: q.name }); });
      } catch (e) { /* prossimo termine */ }
      if (uniq(res, name, (q) => q.name) || loose(res, name, (q) => q.name)) break;
    }
    return res;
  };
  const one = async (p) => {
    const name = p[0], num = p[1];
    const byNum = num != null ? fmRows.find((q) => q[1] != null && String(q[1]) === String(num) && samePerson(q[0], name)) : null;
    const f = byNum || uniq(fmRows, name, (q) => q[0]);
    if (f && f[7]) return [f[0], num != null ? num : f[1], p[2], p[3], p[4] || f[4], f[5], f[6], f[7], f[8]];
    const R = await loadRosa();
    const r = uniq(R, name, (q) => q[1]) || solo(R, name, (q) => q[1]) || loose(R, name, (q) => q[1]) || byShirt(R, name, num, (q) => q[1], (q) => q[3]);
    if (r && r[0] > 0) return [r[1], num != null ? num : r[3], p[2], p[3], p[4], ph(r[0]), null, r[0], r[2] === "GK" ? 0 : null];
    const Z = await loadSquad();
    const z = uniq(Z, name, (q) => q.name) || solo(Z, name, (q) => q.name) || loose(Z, name, (q) => q.name) || byShirt(Z, name, num, (q) => q.name, (q) => q.num);
    if (z) return [z.name, num != null ? num : z.num, p[2], p[3], p[4], ph(z.id), null, z.id, null];
    // ultima via: ricerca giocatori di FotMob per cognome (chi non e' in rosa ne' nella pagina squadra); valido solo se il nome e' unico (stessa iniziale e cognome)
    const sr = await searchPlayers(name);
    const w = uniq(sr, name, (q) => q.name) || loose(sr, name, (q) => q.name);
    if (w) return [w.name, num != null ? num : null, p[2], p[3], p[4], ph(w.id), null, w.id, null];
    return p;
  };
  const s = await Promise.all(t.s.map(one));
  const b = await Promise.all((t.b || []).map(one));
  // portiere segnato (posizione 0) solo se e' uno solo tra i titolari con quel ruolo
  const gk = s.filter((q) => q[8] === 0);
  if (gk.length > 1) gk.forEach((q) => { q[8] = null; });
  return { f: t.f, s, b, co: (fm && fm.co) || t.co };
}

// Pagina squadra FotMob (file grande): letta al massimo una volta ogni 30 minuti per squadra e per copia del worker, se ne tengono solo
// ultima formazione e rosa (al massimo 300 squadre). Prima ogni richiesta /fx la rileggeva fino a 4 volte e il worker superava il tempo di calcolo (errore 1102).
const FMTEAM = new Map();
function fmTeam(tid) {
  const k = String(tid || "");
  if (!k) return Promise.resolve(null);
  const h = FMTEAM.get(k);
  if (h && Date.now() - h.t < 1800000) return h.p;
  const p = (async () => {
    try {
      const r = await fetch("https://www.fotmob.com/api/data/teams?id=" + k + "&ccode3=ITA", { headers: FMH, cf: { cacheTtl: 1800, cacheEverything: true } });
      if (!r.ok) return null;
      const j = await r.json();
      const ll = (j.overview || {}).lastLineupStats || null;
      const mem = [];
      const sqd = (j.squad && (j.squad.squad || j.squad)) || [];
      (Array.isArray(sqd) ? sqd : []).forEach((g) => (Array.isArray(g.members) ? g.members : []).forEach((q) => { if (q && q.id && q.name) mem.push({ id: q.id, name: q.name, shirtNumber: q.shirtNumber }); }));
      return { ll, mem };
    } catch (e) { return null; }
  })();
  FMTEAM.delete(k); FMTEAM.set(k, { t: Date.now(), p });
  while (FMTEAM.size > 300) FMTEAM.delete(FMTEAM.keys().next().value);
  return p;
}

// Collegamento a tappeto (18/11/2026): QUALSIASI formazione (FotMob, ESPN, LiveScore, PitchAPI, ultima formazione, diretta) con giocatori senza id FotMob
// passa dallo stesso abbinamento di diretta (`dlFill`: rosa del sito, pagina squadra FotMob, ricerca; solo nomi unici). Cambiano solo nome intero, foto e id
// dei giocatori senza id; posizione, numero, voto e capitano restano quelli della fonte. Risultati ricordati 10 minuti (al massimo 600 giocatori).
const LINKED = new Map();
const FXLIVE = new Map(); // /fx delle partite live: 1 secondo (tanti telefoni che chiedono ogni secondo = un solo calcolo), al massimo 100
const PHMEM = new Map(); // /pf: i 100 pezzi idx:ph/<n> (capienza fissa: al massimo 100, uno per resto), 1 ora
const FXMEM = new Map(); // /fx delle partite lontane dal fischio: 5 minuti, al massimo 300
// /fx delle partite non iniziate con le due formazioni (22/11/2026): ultima risposta completa, in memoria (al massimo 300) e in KV `idx:fxpre/<id>`
// (scadenza 8 giorni, mai nel repository). KV si scrive solo quando la formazione cambia o ogni 30 minuti (poche scritture al giorno).
const FXPRE = new Map();
const FXPRE_RUN = new Set();
const fxFull = (t) => !!(t && Array.isArray(t.s) && t.s.length >= 11);
async function fxPreGet(id, env) {
  const m = FXPRE.get(id);
  if (m) return m;
  const kv = env && env.ROSE;
  if (!kv) return null;
  try {
    const r = await kv.get("idx:fxpre/" + id, "json");
    if (!r || !r.body || !r.lu) return null;
    const e = { t: r.t || 0, ko: r.ko || 0, body: r.body, lu: r.lu, sig: r.sig || "", kvT: r.t || 0 };
    FXPRE.set(id, e); while (FXPRE.size > 300) FXPRE.delete(FXPRE.keys().next().value);
    return e;
  } catch (e) { return null; }
}
function fxPreSave(id, env, ctx, out, g2, stt, body) {
  try {
    if (out.st || out.fin || (g2 && g2.started) || !fxFull(out.h) || !fxFull(out.a)) return;
    const ko = Date.parse((g2 && g2.matchTimeUTCDate) || (stt && stt.utcTime) || "");
    if (!ko) return;
    const now = Date.now();
    const lu = { h: out.h, a: out.a, ty: out.ty || null, luSrc: out.luSrc || null };
    const sig = String(out.ty || "") + "|" + [out.h, out.a].map((t) => t.s.map((p) => p[0] + "#" + p[1] + "#" + p[2] + "#" + p[3]).join(",")).join("/");
    const old = FXPRE.get(id);
    const kvT = old ? old.kvT || 0 : 0;
    const write = !old || old.sig !== sig || now - kvT > 30 * 60000;
    FXPRE.delete(id); FXPRE.set(id, { t: now, ko, body, lu, sig, kvT: write ? now : kvT });
    while (FXPRE.size > 300) FXPRE.delete(FXPRE.keys().next().value);
    const kv = env && env.ROSE;
    if (write && kv) {
      const ttl = Math.max(3600, Math.min(8 * 86400, Math.round((ko - now) / 1000) + 6 * 3600));
      const p = kv.put("idx:fxpre/" + id, JSON.stringify({ t: now, ko, sig, lu, body }), { expirationTtl: ttl }).catch(() => {});
      if (ctx && ctx.waitUntil) ctx.waitUntil(p);
    }
  } catch (e) { /* mai rompere /fx */ }
}
async function linkMissing(t, tid) {
  if (!t || !tid) return t;
  const rows = [...(t.s || []), ...(t.b || [])].filter((p) => p && !p[7] && p[0]);
  if (!rows.length) return t;
  const key = (p) => tid + "|" + p[0] + "|" + (p[1] == null ? "" : p[1]);
  const todo = rows.filter((p) => { const h = LINKED.get(key(p)); return !h || Date.now() - h.t > 600000; });
  if (todo.length) {
    const got = await dlFill({ f: t.f, s: todo, b: [] }, null, tid).catch(() => null);
    todo.forEach((p, i) => {
      const g = got && got.s && got.s[i];
      LINKED.delete(key(p));
      LINKED.set(key(p), { t: Date.now(), v: g && g[7] ? [g[0], g[5], g[7]] : null });
      while (LINKED.size > 600) LINKED.delete(LINKED.keys().next().value);
    });
  }
  const fix = (p) => {
    if (!p || p[7] || !p[0]) return p;
    const h = LINKED.get(key(p));
    if (!h || !h.v) return p;
    const q = p.slice();
    q[0] = h.v[0]; q[5] = q[5] || h.v[1]; q[7] = h.v[2];
    return q;
  };
  return { ...t, s: (t.s || []).map(fix), b: (t.b || []).map(fix) };
}

// ---- Formazioni da ESPN dove FotMob non le ha (verificato il 07/11/2026: ESPN da' modulo, titolari con ruolo e lato, panchina).
// Competizioni FotMob -> ESPN controllate una per una; si aggiungono solo dopo aver visto le formazioni vere.
// 14/11/2026: non piu' solo queste 4. Per ogni altra competizione si cerca la partita nel tabellone generale di ESPN ("all": nazionali, amichevoli,
// Nations League, qualificazioni, coppe e campionati), per orario + nomi; la formazione si legge solo se ESPN ha gia' i 11 titolari (starter).
const ESPN_LU = { 9682: "concacaf.central.american.cup", 137: "sco.tennents", 179: "sco.challenge", 9906: "mex.w.1" };
// profondita' dal ruolo ESPN (G, CD-L, LB, DM, CM, LM, AM, F, CF-R...), lato da L/R: stesse coordinate 0-1 di FotMob
function espnXY(ab) {
  const a = String(ab || "").toUpperCase();
  const core = a.replace(/-(L|R)$/, "");
  const x = core === "G" ? 0.05 : /^(CD|CB|LB|RB|SW|D)$/.test(core) ? 0.25 : /^(LWB|RWB|WB)$/.test(core) ? 0.32 : /^(DM|LDM|RDM)$/.test(core) ? 0.42 : /^(CM|LM|RM|M)$/.test(core) ? 0.55 : /^(AM|LAM|RAM|CAM)$/.test(core) ? 0.68 : 0.85;
  const y = /-L$/.test(a) ? 0.35 : /-R$/.test(a) ? 0.65 : /^L/.test(core) ? 0.12 : /^R/.test(core) ? 0.88 : 0.5;
  return [x, y];
}
// partita ESPN (stessa di FotMob: orario + nomi) e lettore con timeout: usata da formazioni e statistiche
// abbinamento FotMob -> ESPN ricordato 30 minuti (al massimo 400): il calendario ESPN di due giorni e' un file grande e leggerlo a ogni richiesta
// faceva superare al worker il tempo di calcolo (risposte 503 e formazioni mancanti, 18/11/2026)
const ESPN_MEMO = new Map();
async function espnMatch(g2) {
  const mk = String(g2.matchId || "") + "|" + (g2.matchTimeUTCDate || "");
  const hit = ESPN_MEMO.get(mk);
  if (hit && Date.now() - hit.t < 1800000) return hit.v;
  const v = await espnMatch0(g2);
  ESPN_MEMO.delete(mk); ESPN_MEMO.set(mk, { t: Date.now(), v });
  while (ESPN_MEMO.size > 400) ESPN_MEMO.delete(ESPN_MEMO.keys().next().value);
  return v;
}
async function espnMatch0(g2) {
  const lg = ESPN_LU[g2.parentLeagueId] || ESPN_LU[g2.leagueId] || "all";
  const when = g2.matchTimeUTCDate ? new Date(g2.matchTimeUTCDate) : null;
  if (!when || isNaN(when.getTime())) return null;
  const E = "https://site.api.espn.com/apis/site/v2/sports/soccer/" + lg + "/";
  const get = async (u, ttl) => {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 4000);
    try { const r = await fetch(u, { signal: ctl.signal, cf: { cacheTtl: ttl, cacheEverything: true } }); return r.ok ? await r.json() : null; } catch (e) { return null; } finally { clearTimeout(t); }
  };
  // ESPN raggruppa le partite per giorno americano: una gara alle 02:00 UTC sta nel giorno prima
  const day = (d) => d.toISOString().slice(0, 10).replace(/-/g, "");
  const sbs = await Promise.all([day(when), day(new Date(when.getTime() - 86400000))].map((d) => get(E + "scoreboard?limit=1000&dates=" + d, 60)));
  const hn = g2.homeTeam && g2.homeTeam.name, an = g2.awayTeam && g2.awayTeam.name;
  const evs = sbs.flatMap((sb) => (sb && sb.events) || []);
  const sides = (e) => { const c = ((e.competitions || [])[0] || {}).competitors || []; return [c.find((q) => q.homeAway === "home"), c.find((q) => q.homeAway === "away")]; };
  // prima: orario vicino e nomi di casa e ospite uguali; poi: stesso orario esatto (15') e almeno una squadra uguale ("UAE" / "United Arab Emirates")
  let ev = evs.find((e) => { const [H, A] = sides(e); return H && A && Math.abs(new Date(e.date).getTime() - when.getTime()) <= 6 * 3600000 && uSame(H.team && H.team.displayName, hn) && uSame(A.team && A.team.displayName, an); });
  if (!ev) ev = evs.find((e) => { const [H, A] = sides(e); return H && A && Math.abs(new Date(e.date).getTime() - when.getTime()) <= 15 * 60000 && (uSame(H.team && H.team.displayName, hn) || uSame(A.team && A.team.displayName, an)) && !(uNorm(H.team && H.team.displayName) === uNorm(an)); });
  return ev ? { E, ev, get } : null;
}
// Statistiche ESPN (seconda fonte, richiesta utente 16/11/2026: FotMob pubblica statistiche e momentum solo dopo ~4-6 minuti di gioco, ESPN le ha dal 1'):
// solo se FotMob non ne ha. Stesso formato delle righe FotMob [chiave, titolo, casa, ospite, totCasa, totOspite, formato]; solo Totale (nessun tempo).
async function espnStats(out, g2) {
  try {
    const m = await espnMatch(g2);
    if (!m) return;
    const sm = await m.get(m.E + "summary?event=" + m.ev.id, 8);
    const T = (((sm || {}).boxscore || {}).teams || []);
    const th = T.find((q) => q.homeAway === "home"), ta = T.find((q) => q.homeAway === "away");
    if (!th || !ta) return;
    const v = (t, n) => { const x = (t.statistics || []).find((q) => q.name === n); const n2 = x ? parseFloat(x.displayValue) : NaN; return Number.isFinite(n2) ? n2 : null; };
    const row = (key, title, hn, an, fmt) => { const a = v(th, hn), b = v(ta, an || hn); return a == null || b == null ? null : [key, title, a, b, null, null, fmt || "integer"]; };
    const frac = (key, title, okn, totn) => { const a = v(th, okn), b = v(ta, okn), ta2 = v(th, totn), tb = v(ta, totn); return a == null || b == null || !(ta2 || tb) ? null : [key, title, a, b, ta2, tb, "integerWithPercentage"]; };
    const pos = v(th, "possessionPct"), posA = v(ta, "possessionPct");
    const groups = [
      ["top_stats", "Top stats", [pos != null && posA != null ? ["BallPossesion", "Ball possession", Math.round(pos), Math.round(posA), null, null, "integer"] : null, row("total_shots", "Total shots", "totalShots"), row("ShotsOnTarget", "Shots on target", "shotsOnTarget"), row("corners", "Corners", "wonCorners"), row("Offsides", "Offsides", "offsides")]],
      ["shots", "Shots", [row("blocked_shots", "Blocked shots", "blockedShots")]],
      ["passes", "Passes", [row("passes", "Passes", "totalPasses"), frac("accurate_passes", "Accurate passes", "accuratePasses", "totalPasses"), frac("long_balls_accurate", "Long balls", "accurateLongBalls", "totalLongBalls"), frac("accurate_crosses", "Accurate crosses", "accurateCrosses", "totalCrosses")]],
      ["defense", "Defence", [row("matchstats.headers.tackles", "Tackles", "totalTackles"), row("interceptions", "Interceptions", "interceptions"), row("clearances", "Clearances", "totalClearance"), row("keeper_saves", "Keeper saves", "saves")]],
      ["discipline", "Discipline", [row("yellow_cards", "Yellow cards", "yellowCards"), row("red_cards", "Red cards", "redCards"), row("fouls", "Fouls committed", "foulsCommitted")]],
    ].map((g) => [g[0], g[1], g[2].filter(Boolean)]).filter((g) => g[2].length);
    if (!groups.length) return;
    out.stats = { All: groups, FirstHalf: null, SecondHalf: null };
    out.stSrc = "espn";
  } catch (e) { /* mai rompere /fx */ }
}
async function espnLineups(out, g2) {
  try {
    const mt = await espnMatch(g2);
    if (!mt) return;
    const { E, ev, get } = mt;
    const sm = await get(E + "summary?event=" + ev.id, 20);
    const side = (ha) => {
      const r = ((sm && sm.rosters) || []).find((q) => q.homeAway === ha);
      const ro = (r && r.roster) || [];
      const st = ro.filter((p) => p.starter);
      if (st.length !== 11) return null;
      const nm = (p) => (p.athlete && (p.athlete.displayName || p.athlete.fullName)) || "";
      const mk = (p, xy) => [nm(p), p.jersey != null ? +p.jersey || p.jersey : null, xy ? xy[0] : null, xy ? xy[1] : null, false, null, null, null, null];
      return { f: r.formation || null, s: st.map((p) => mk(p, espnXY(p.position && p.position.abbreviation))), b: ro.filter((p) => !p.starter && nm(p)).map((p) => mk(p, null)), co: null };
    };
    const h = side("home"), a = side("away");
    if (h && a) { out.h = h; out.a = a; out.luSrc = "espn"; if (!out.ty) out.ty = "standard"; }
  } catch (e) { /* mai rompere /fx */ }
}

// ---- Formazioni da PitchAPI (14/11/2026): il worker non ha la chiave, le scrive il workflow `formazioni.yml` (formazioni_kv.py) su Cloudflare KV
// `idx:lu/<id partita FotMob>` = { c: 1 se ufficiali, h, a } nello stesso formato di /fx (coordinate PitchAPI = quelle FotMob, verificato il 14/11/2026).
async function pitchLineups(out, fmId, env) {
  try {
    if (!env || !env.ROSE || !fmId) return;
    const v = await env.ROSE.get("idx:lu/" + fmId, "json");
    if (v && v.c && v.h && v.a && (v.h.s || []).length === 11 && (v.a.s || []).length === 11) { out.h = v.h; out.a = v.a; out.luSrc = "pitchapi"; if (!out.ty) out.ty = "standard"; }
  } catch (e) { /* mai rompere /fx */ }
}

// ---- Formazioni da LiveScore dove FotMob ed ESPN non le hanno. Solo il formato completo: modulo (Fo, es. [4,4,2]) e posto in campo di
// ogni titolare (Fp "riga:colonna", riga 1 = portiere). Verificato il 07/11/2026 su 23 partite contro FotMob: modulo uguale 39 volte su 46,
// colonne numerate da destra a sinistra (108 file su 131), quindi y = 1 - colonna/(n+1). Senza Fo/Fp (solo nomi) nessun campo: mai posti inventati.
const LS_MEMO = new Map();
async function lsLineups(out, startIso, started) {
  try {
    if (!out.hi || !out.ai) return;
    const d = startIso ? new Date(startIso) : null;
    if (!d || isNaN(d.getTime())) return;
    const ymd = d.toISOString().slice(0, 10).replace(/-/g, "");
    // abbinamento ricordato 30 minuti (stesso motivo di ESPN_MEMO: il file del giorno di LiveScore e' grande)
    const lk = out.hi + "|" + out.ai + "|" + ymd;
    const lh = LS_MEMO.get(lk);
    let eid = null;
    if (lh && Date.now() - lh.t < 1800000) eid = lh.v;
    else {
      const day = await lsGet(LSB + "date/soccer/" + ymd + "/1?countryCode=GB&locale=en&MD=1", 60);
      for (const st of (day && day.Stages) || []) {
        for (const x of st.Events || []) {
          const a = ((x.T1 || [{}])[0].Img || "").match(/enet\/(\d+)\.png/), b = ((x.T2 || [{}])[0].Img || "").match(/enet\/(\d+)\.png/);
          if (a && b && +a[1] === +out.hi && +b[1] === +out.ai) { eid = x.Eid; break; }
        }
        if (eid) break;
      }
      if (day) { LS_MEMO.delete(lk); LS_MEMO.set(lk, { t: Date.now(), v: eid }); while (LS_MEMO.size > 400) LS_MEMO.delete(LS_MEMO.keys().next().value); }
    }
    if (!eid) return;
    const ln = await lsGet(LSB + "lineups/soccer/" + eid + "?locale=en", 30);
    const nm = (p) => ((p.Fn || "") + " " + (p.Ln || "")).trim() || p.Snm || "";
    const mk = (p, xy) => [nm(p), p.Snu != null ? +p.Snu || p.Snu : null, xy ? xy[0] : null, xy ? xy[1] : null, false, null, null, null, null];
    // solo i nomi ufficiali (niente Fo/Fp): 11 titolari = chi non e' panchina (Pos 5) ne' allenatore (Pos 10); niente posti in campo
    const names = (nb) => {
      const t = ((ln && ln.Lu) || []).find((q) => q.Tnb === nb);
      const ps = (t && t.Ps) || [];
      const st = ps.filter((p) => p.Pos !== 5 && p.Pos !== 10 && nm(p));
      if (st.length !== 11) return null;
      const coach = ps.find((p) => p.Pos === 10);
      return { f: null, l: 1, s: st.map((p) => mk(p, null)), b: ps.filter((p) => p.Pos === 5 && nm(p)).map((p) => mk(p, null)), co: coach && nm(coach) ? { id: null, n: nm(coach), cc: null } : null };
    };
    const side = (nb) => {
      const t = ((ln && ln.Lu) || []).find((q) => q.Tnb === nb);
      if (!t || !Array.isArray(t.Fo) || !t.Fo.length) return null;
      const ps = t.Ps || [];
      const st = ps.filter((p) => /^\d+:\d+$/.test(String(p.Fp || "")));
      if (st.length !== 11 || t.Fo.reduce((a, b) => a + b, 0) !== 10) return null;
      const R = t.Fo.length + 1;
      const per = {};
      st.forEach((p) => { const r = +String(p.Fp).split(":")[0]; per[r] = (per[r] || 0) + 1; });
      if (per[1] !== 1 || t.Fo.some((n, i) => per[i + 2] !== n)) return null;
      const s = st.map((p) => {
        const [r, c] = String(p.Fp).split(":").map(Number);
        return mk(p, [0.05 + ((r - 1) / (R - 1)) * 0.8, 1 - c / (per[r] + 1)]);
      });
      const coach = ps.find((p) => p.Pos === 10);
      return { f: t.Fo.join("-"), s, b: ps.filter((p) => p.Pos === 5 && nm(p)).map((p) => mk(p, null)), co: coach && nm(coach) ? { id: null, n: nm(coach), cc: null } : null };
    };
    // LiveScore non dice se la formazione e' ufficiale: prima del fischio sul suo sito e' "probabile" (21/11/2026, verificato coi campi della risposta:
    // nessun segnale di conferma). Quindi da LiveScore: PROBABILE fino al calcio d'inizio, ufficiale solo a partita iniziata. Mai "ufficiale" per default.
    const lsTy = started ? "standard" : "predicted";
    const h = side(1), a = side(2);
    if (h && a) { out.h = h; out.a = a; out.luSrc = "livescore"; out.ty = lsTy; return; }
    const hl = names(1), al = names(2);
    if (hl && al) { out.h = hl; out.a = al; out.luSrc = "livescore"; out.luList = 1; out.ty = lsTy; }
  } catch (e) { /* mai rompere /fx */ }
}

// Formazione a soli nomi: portiere e numeri di maglia dalla rosa della squadra (rosa/ sul sito, dati FotMob/fonti gia' verificati).
// Portiere segnato (p[8] = 0) solo se tra gli 11 ce n'e' esattamente uno con ruolo GK; numero solo se la fonte non lo da'. Mai indovinati.
const SITE = "https://matteogiampaoletti246-hue.github.io/tiri-dati/";
const nKey = (s) => String(s || "").replace(/ł/gi, "l").replace(/ø/gi, "o").replace(/æ/gi, "ae").replace(/ß/g, "ss").replace(/[đð]/gi, "d").replace(/ı/g, "i").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z ]/g, " ").split(/\s+/).filter(Boolean);
function samePerson(a, b) {
  const x = nKey(a), y = nKey(b);
  if (!x.length || !y.length) return false;
  const X = new Set(x), Y = new Set(y);
  const inn = (A, B) => [...A].every((t) => B.has(t));
  if ((inn(X, Y) || inn(Y, X)) && Math.min(X.size, Y.size) >= 2) return true;
  if (x.join(" ") === y.join(" ")) return true;
  // "R. Teixeira" / "Rui Teixeira": stesso cognome e stessa iniziale
  return x[x.length - 1] === y[y.length - 1] && x[0][0] === y[0][0] && x[x.length - 1].length > 2;
}
async function rosaMark(t, tid) {
  try {
    if (!t || !tid) return t;
    const r = await fetch(SITE + "rosa/" + (Number(tid) % 100) + ".json", { cf: { cacheTtl: 3600, cacheEverything: true } });
    if (!r.ok) return t;
    const rows = (((await r.json()) || {})[String(tid)] || {}).p || [];
    const find = (n) => { const hit = rows.filter((q) => samePerson(q[1], n)); return hit.length === 1 ? hit[0] : null; };
    const fix = (p) => { const q = find(p[0]); const o = p.slice(); if (q && o[1] == null && q[3] != null) o[1] = q[3]; if (q && q[0] > 0 && !o[7]) { o[7] = q[0]; o[5] = o[5] || "https://images.fotmob.com/image_resources/playerimages/" + q[0] + ".png"; } o._r = q ? q[2] : null; return o; };
    const s = t.s.map(fix), b = (t.b || []).map(fix);
    const gks = s.filter((p) => p._r === "GK");
    if (gks.length === 1) gks[0][8] = 0;
    const clean = (p) => p.slice(0, 9);
    return { ...t, s: s.map(clean), b: b.map(clean) };
  } catch (e) { return t; }
}

// ---- Formazioni ufficiali dalla UEFA (Champions, Europa League, Conference League): escono prima che su FotMob.
// Dati pubblici letti al volo e mai salvati. Coordinate verificate su 10 squadre contro FotMob: profondita' = y/1000, laterale = 1 - x/1000.
const UEFA = "https://match.uefa.com/v5/";
const UEFA_COMP = { ucl: 1, uel: 14, uecl: 2019 };
const UH = { "User-Agent": "ScalperLab/1.0", "Accept": "application/json" };
async function uefaGet(path, ttl) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 4000);
  try {
    const r = await fetch(UEFA + path, { headers: UH, signal: ctl.signal, cf: { cacheTtl: ttl, cacheEverything: true } });
    return r.ok ? await r.json() : null;
  } catch (e) { return null; } finally { clearTimeout(t); }
}
const uNorm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\b(fc|ac|as|sc|afc|fk|cf|ssc|us|rc|sk|ks|bk|if|sv|vfl|vfb|tsg|1|ogc|rb|og|de|cd|ca|ud|nk|hnk|fcsb)\b/g, " ").replace(/\s+/g, " ").trim();
const uSame = (a, b) => {
  const x = uNorm(a), y = uNorm(b);
  if (!x || !y) return false;
  if (x === y || x.includes(y) || y.includes(x)) return true;
  const tx = x.split(" ").filter((t) => t.length > 3), ty = y.split(" ");
  return tx.some((t) => ty.includes(t));
};
// Partita UEFA da squadre e data (la lista della competizione si tiene in cache 5 minuti)
async function uefaFind(lg, h, a, koIso) {
  const comp = UEFA_COMP[lg], d = new Date(koIso);
  if (!comp || isNaN(d.getTime())) return null;
  const year = d.getUTCFullYear() + (d.getUTCMonth() >= 6 ? 1 : 0);
  let all = [];
  for (let off = 0; off < 400; off += 200) {
    const part = await uefaGet("matches?competitionId=" + comp + "&seasonYear=" + year + "&limit=200&offset=" + off + "&order=ASC", 300);
    if (!Array.isArray(part)) break;
    all = all.concat(part);
    if (part.length < 200) break;
  }
  const hit = all.find((m) => {
    const t = m.kickOffTime && m.kickOffTime.dateTime ? new Date(m.kickOffTime.dateTime).getTime() : 0;
    return Math.abs(t - d.getTime()) < 6 * 3600000 && uSame(m.homeTeam && m.homeTeam.internationalName, h) && uSame(m.awayTeam && m.awayTeam.internationalName, a);
  });
  return hit ? hit.id : null;
}
// Formazione UEFA -> stessa forma di FotMob ([nome, n., profondita', laterale, capitano, foto, voto, id]); nomi, id e foto di FotMob se il numero di maglia coincide
function uefaTeam(t, fmT) {
  const field = (t && t.field) || [];
  if (field.length !== 11) return null;
  const byNum = {};
  [...((fmT && fmT.starters) || []), ...((fmT && fmT.subs) || [])].forEach((p) => { if (p && p.shirtNumber != null) byNum[String(p.shirtNumber)] = p; });
  const nm = (pl) => (pl.translations && pl.translations.displayName && (pl.translations.displayName.EN || Object.values(pl.translations.displayName)[0])) || pl.internationalName || "";
  const ph = (id) => id ? "https://images.fotmob.com/image_resources/playerimages/" + id + ".png" : null;
  const mk = (e, x, y) => {
    const f = byNum[String(e.jerseyNumber)];
    return [f && f.name ? f.name : nm(e.player), e.jerseyNumber, x, y, e.type === "CAPTAIN", f ? ph(f.id) : null, null, f ? f.id : null];
  };
  // righe: le posizioni UEFA possono essere leggermente sfalsate (4-2-3-1 con y 248/251/252...): si raggruppano le profondita' vicine (< 0.06) e si portano alla media
  const out = field.filter((e) => e.fieldCoordinate.y > 100).map((e) => e.fieldCoordinate.y / 1000).sort((x, y) => x - y);
  const cl = [];
  out.forEach((v) => { const c = cl[cl.length - 1]; if (c && v - c[c.length - 1] < 0.06) c.push(v); else cl.push([v]); });
  const snap = (d) => { if (d <= 0.1) return d; const c = cl.find((q) => d >= q[0] - 1e-9 && d <= q[q.length - 1] + 1e-9); return Math.round((c.reduce((x, y) => x + y, 0) / c.length) * 1000) / 1000; };
  const f = cl.map((c) => c.length).join("-");
  const co = ((t.coaches || [])[0] || {}).person;
  return {
    f, s: field.map((e) => mk(e, snap(e.fieldCoordinate.y / 1000), Math.round((1 - e.fieldCoordinate.x / 1000) * 1000) / 1000)),
    b: (t.bench || []).map((e) => mk(e, 0, 0)),
    co: co ? { id: null, n: nm(co) || co.internationalName || null, cc: co.countryCode || null } : null,
  };
}

function cors(req, extra) {
  const o = req.headers.get("Origin");
  const h = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=" + TTL, ...extra };
  if (o === ORIGIN) { h["Access-Control-Allow-Origin"] = ORIGIN; h["Vary"] = "Origin"; }
  return h;
}

async function espn(path, ttl) {
  const r = await fetch(BASE + path, { headers: { "User-Agent": "Mozilla/5.0" }, cf: { cacheTtl: ttl || TTL, cacheEverything: true } });
  if (!r.ok) throw new Error("ESPN " + r.status);
  return r.json();
}

function scoreboard(j, lg) {
  return (j.events || []).map((e) => {
    const c = (e.competitions || [{}])[0], t = e.status && e.status.type || {};
    const cp = (c.competitors || []).reduce((a, x) => { a[x.homeAway] = x; return a; }, {});
    return {
      lg, id: e.id, d: e.date, st: t.state, nm: t.name, det: t.shortDetail, clk: e.status && e.status.displayClock,
      hl: cp.home && cp.home.team && cp.home.team.logo, al: cp.away && cp.away.team && cp.away.team.logo,
      h: cp.home && cp.home.team && cp.home.team.displayName, a: cp.away && cp.away.team && cp.away.team.displayName,
      sh: cp.home && cp.home.score, sa: cp.away && cp.away.score,
    };
  });
}

function compactRoster(r) {
  return {
    side: r.homeAway, formation: r.formation,
    players: (r.roster || []).map((p) => ({
      n: p.athlete && p.athlete.displayName, id: p.athlete && p.athlete.id, img: p.athlete && p.athlete.headshot && p.athlete.headshot.href, j: p.jersey, st: p.starter, in: p.subbedIn, out: p.subbedOut,
      pos: p.position && p.position.abbreviation, fp: p.formationPlace,
      s: (p.stats || []).reduce((a, x) => { a[x.name] = x.value; return a; }, {}),
    })),
  };
}

function summary(j) {
  const comp = ((j.header || {}).competitions || [{}])[0] || {};
  const cp = (comp.competitors || []).reduce((a, x) => { a[x.homeAway] = x; return a; }, {});
  const teams = ((j.boxscore || {}).teams || []).map((t) => ({
    side: t.homeAway, id: t.team && t.team.id,
    s: (t.statistics || []).reduce((a, x) => { a[x.name] = x.displayValue; return a; }, {}),
  }));
  return {
    status: comp.status, sh: cp.home && cp.home.score, sa: cp.away && cp.away.score,
    hid: cp.home && cp.home.team && cp.home.team.id, aid: cp.away && cp.away.team && cp.away.team.id,
    venue: (j.gameInfo || {}).venue, officials: (j.gameInfo || {}).officials, attendance: (j.gameInfo || {}).attendance,
    form: ((j.boxscore || {}).form || []).map((f) => ({ id: f.team && f.team.id, r: (f.events || []).map((x) => x.gameResult || "").join("") })),
    teams, rosters: (j.rosters || []).map(compactRoster),
    events: (j.keyEvents || []).map((e) => ({
      id: e.id, t: e.type && e.type.type, tx: e.text, min: e.clock && e.clock.displayValue, sec: e.clock && e.clock.value, p: e.period && e.period.number,
      team: e.team && e.team.id, goal: e.scoringPlay, pl: (e.participants || []).map((x) => x.athlete && x.athlete.displayName),
    })),
    comm: (j.commentary || []).slice(-80).map((c) => ({ min: c.time && c.time.displayValue, sec: c.time && c.time.value, tx: c.text, t: c.play && c.play.type && c.play.type.type, team: c.play && c.play.team && c.play.team.displayName, p: c.play && c.play.period && c.play.period.number })),
  };
}

export default {
  async fetch(req, env, ctx) {
    if (req.method === "OPTIONS") return new Response(null, { headers: { ...cors(req), "Access-Control-Allow-Methods": "GET", "Access-Control-Max-Age": "86400" } });
    const u = new URL(req.url);
    try {
      { const pm = u.pathname.match(/^\/pf\/(\d{1,10})\.png$/); if (pm) { // foto giocatore da altre fonti (LiveScore, diretta.it) per chi non l'ha su FotMob: KV idx:ph/<id%100> (foto_extra.py)
        const pid = pm[1], n = Number(pid) % 100;
        let sh = PHMEM.get(n);
        if (!sh || Date.now() - sh.t > 3600000) { let v = null; try { v = env && env.ROSE ? JSON.parse((await env.ROSE.get("idx:ph/" + n)) || "{}") : {}; } catch (e) { v = {}; } sh = { t: Date.now(), v }; PHMEM.set(n, sh); }
        const to = sh.v[pid];
        if (!to || !/^https:\/\//.test(to)) return new Response("", { status: 404, headers: cors(req, { "Cache-Control": "public, max-age=3600" }) });
        return new Response(null, { status: 302, headers: cors(req, { Location: to, "Cache-Control": "public, max-age=86400" }) });
      } }
      if (u.pathname === "/v") { // versione dell'app nativa in uso sul telefono (21/11/2026): ?sha=<commit>&e=start|resume; ?read=1 le ultime 40 (solo versione e ora, niente dati personali)
        if (!env || !env.ROSE) return new Response("[]", { headers: cors(req) });
        const cur = JSON.parse((await env.ROSE.get("diag:app")) || "[]");
        if (u.searchParams.get("read")) return new Response(JSON.stringify(cur), { headers: cors(req, { "Cache-Control": "no-store" }) });
        const sha = String(u.searchParams.get("sha") || "").slice(0, 40), ev = String(u.searchParams.get("e") || "").slice(0, 12);
        if (!/^([0-9a-f]{7,40}|dev)$/.test(sha)) return new Response("{}", { status: 400, headers: cors(req) });
        cur.push({ t: new Date().toISOString(), sha, e: ev });
        await env.ROSE.put("diag:app", JSON.stringify(cur.slice(-40)));
        return new Response("{}", { headers: cors(req, { "Cache-Control": "no-store" }) });
      }
      if (u.pathname === "/r") { // rose da fonti esterne (KV "rose", legato come ROSE): ?k=ls:<id squadra LiveScore> oppure ?k=idx:<paese>/<campionato>
        const k = u.searchParams.get("k") || "";
        if (!env || !env.ROSE || !/^(ls|idx):[a-z0-9\/-]{1,60}$/.test(k)) return new Response("{}", { status: 400, headers: cors(req) });
        const v = await env.ROSE.get(k);
        return new Response(v || "null", { status: v ? 200 : 404, headers: cors(req, { "Cache-Control": "public, max-age=300" }) });
      }
      if (u.pathname === "/s") {
        const all = await Promise.all(LEGHE.map((lg) => espn("/" + lg + "/scoreboard").then((j) => scoreboard(j, lg)).catch(() => [])));
        return new Response(JSON.stringify({ t: Date.now(), ev: all.flat() }), { headers: cors(req) });
      }
      if (u.pathname === "/d") {
        const dt = u.searchParams.get("date");
        if (!/^\d{8}$/.test(dt || "")) return new Response("{}", { status: 400, headers: cors(req) });
        const old = dt < new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10).replace(/-/g, "");
        const all = await Promise.all((u.searchParams.get("dom") === "1" ? LEGHE : CUPS).map((lg) => espn("/" + lg + "/scoreboard?dates=" + dt, old ? 3600 : 60).then((j) => scoreboard(j, lg)).catch(() => [])));
        return new Response(JSON.stringify({ t: Date.now(), ev: all.flat() }), { headers: cors(req, { "Cache-Control": "public, max-age=" + (old ? 3600 : 60) }) });
      }
      if (u.pathname === "/cs") {
        const lg = u.searchParams.get("lg"), dbg = u.searchParams.get("dbg");
        if (!CUPS.includes(lg)) return new Response("{}", { status: 400, headers: cors(req) });
        const n = new Date(), y0 = n.getUTCMonth() + 1 >= 8 ? n.getUTCFullYear() : n.getUTCFullYear() - 1;
        let ev = [], src = "espn", err = null;
        try {
          const j = await espn("/" + lg + "/scoreboard?dates=" + y0 + "0901-" + (y0 + 1) + "0630&limit=400", 300);
          ev = scoreboard(j, lg);
        } catch (e) { err = String(e); }
        const FID = { "uefa.champions": 42, "uefa.europa": 73, "uefa.europa.conf": 10216 };
        if (!ev.length && FID[lg]) {
          try {
            const r = await fetch("https://www.fotmob.com/api/data/leagues?id=" + FID[lg] + "&ccode3=ITA&timezone=Europe%2FRome", { headers: FMH, cf: { cacheTtl: 300, cacheEverything: true } });
            if (!r.ok) throw new Error("FotMob " + r.status);
            const j = await r.json(), fx = (j.fixtures && j.fixtures.allMatches) || [];
            const logo = (id) => id ? "https://images.fotmob.com/image_resources/logo/teamlogo/" + id + ".png" : null;
            ev = fx.filter((x) => x.status && x.status.utcTime && !(x.status.cancelled)).map((x) => {
              const st = x.status, fin = !!st.finished, ini = !!st.started, sc = String(st.scoreStr || "").match(/(\d+)\s*-\s*(\d+)/);
              return { lg, id: "fm" + x.id, fm: x.id, d: st.utcTime, st: fin ? "post" : ini ? "in" : "pre", nm: fin ? "STATUS_FULL_TIME" : ini ? "STATUS_IN_PROGRESS" : "STATUS_SCHEDULED", det: fin ? "FT" : "",
                hl: logo(x.home && x.home.id), al: logo(x.away && x.away.id), h: x.home && (x.home.name || x.home.shortName), a: x.away && (x.away.name || x.away.shortName),
                sh: sc ? sc[1] : null, sa: sc ? sc[2] : null };
            });
            src = "fotmob";
          } catch (e) { err = (err ? err + " | " : "") + String(e); }
        }
        return new Response(JSON.stringify({ t: Date.now(), ev, src, ...(dbg ? { err, n: ev.length } : {}) }), { headers: cors(req, { "Cache-Control": "public, max-age=300" }) });
      }
      if (u.pathname === "/lu") { // formazione ufficiale UEFA: ?lg=ucl|uel|uecl&h=<casa>&a=<ospite>&ko=<ISO>&id=<id FotMob, facoltativo>
        const lg = u.searchParams.get("lg"), h = u.searchParams.get("h"), a = u.searchParams.get("a"), ko = u.searchParams.get("ko"), id = u.searchParams.get("id");
        if (!UEFA_COMP[lg] || !h || !a || !ko) return new Response("{}", { status: 400, headers: cors(req) });
        const uid = await uefaFind(lg, h, a, ko);
        if (!uid) return new Response(JSON.stringify({ t: Date.now(), ok: 0 }), { headers: cors(req, { "Cache-Control": "public, max-age=3" }) });
        const [lu, fmj] = await Promise.all([
          uefaGet("matches/" + uid + "/lineups", 2),
          /^\d{5,10}$/.test(id || "") ? fetch("https://www.fotmob.com/api/data/matchDetails?matchId=" + id, { headers: FMH, cf: { cacheTtl: 3, cacheEverything: true } }).then((r) => (r.ok ? r.json() : null)).catch(() => null) : null,
        ]);
        const fl = (fmj && fmj.content && fmj.content.lineup) || {};
        const hT = lu && lu.lineupStatus !== "NOT_AVAILABLE" ? uefaTeam(lu.homeTeam, fl.homeTeam) : null, aT = lu && lu.lineupStatus !== "NOT_AVAILABLE" ? uefaTeam(lu.awayTeam, fl.awayTeam) : null;
        return new Response(JSON.stringify({ t: Date.now(), ok: hT && aT ? 1 : 0, uid, ty: "standard", h: hT, a: aT }), { headers: cors(req, { "Cache-Control": "public, max-age=2" }) });
      }
      if (u.pathname === "/fx") {
        const id = u.searchParams.get("id");
        if (!/^\d{5,10}$/.test(id || "")) return new Response("{}", { status: 400, headers: cors(req) });
        // partite lontane dal fischio (oltre 1h26): risposta tenuta 5 minuti nella cache di Cloudflare (18/11/2026: con molte partite aperte insieme
        // il worker andava oltre i 10 s e le formazioni sparivano). Dentro la finestra, live e partite finite: sempre fresca.
        const fxKey = new Request("https://fx-cache.scalperlab/fx?id=" + id);
        { const l0 = FXLIVE.get(id); if (l0 && Date.now() - l0.t < 1000) return new Response(l0.b, { headers: cors(req, { "Cache-Control": "no-store", "X-Fx-Cache": "live" }) }); }
        { const m0 = FXMEM.get(id); if (m0 && Date.now() - m0.t < 300000) return new Response(m0.b, { headers: cors(req, { "Cache-Control": "public, max-age=3", "X-Fx-Cache": "mem" }) }); }
        try { const hit = await caches.default.match(fxKey); if (hit) return new Response(hit.body, { headers: cors(req, { "Cache-Control": "public, max-age=3", "X-Fx-Cache": "1" }) }); } catch (e) { /* senza cache si calcola (su workers.dev la cache di Cloudflare puo' non esserci: resta la memoria) */ }
        // Calcolo completo di /fx (FotMob + diretta + altre fonti). Pesante: con molte richieste insieme Cloudflare lo interrompe (limite di CPU,
        // "exceededResources": 22/11/2026 894 interruzioni in 5 minuti), e una richiesta interrotta = nessuna formazione.
        const fxRun = async () => {
          const r = await fetch("https://www.fotmob.com/api/data/matchDetails?matchId=" + id, { headers: FMH, cf: { cacheTtl: 3, cacheEverything: true } });
          if (!r.ok) throw new Error("FotMob " + r.status);
          const j = await r.json(), c = j.content || {}, lu = c.lineup || {}, rf = c.matchFacts && c.matchFacts.infoBox && c.matchFacts.infoBox.Referee;
          const ph = (pid) => pid ? "https://images.fotmob.com/image_resources/playerimages/" + pid + ".png" : null;
          const team = (t) => {
            if (!t || !(t.starters || []).length) return null;
            // [8] = ruolo FotMob (0 portiere, 1 difesa, 2 centrocampo, 3 attacco): le formazioni "simple" dei campionati minori non hanno coordinate
            const mp = (p) => [p.name, p.shirtNumber != null ? +p.shirtNumber || p.shirtNumber : null, p.horizontalLayout ? p.horizontalLayout.x : null, p.horizontalLayout ? p.horizontalLayout.y : null, !!p.isCaptain, ph(p.id), p.performance && p.performance.rating ? p.performance.rating : null, p.id, p.positionId != null ? p.positionId : p.usualPlayingPositionId != null ? p.usualPlayingPositionId : null];
            const cc = t.coach;
            return { f: t.formation, s: t.starters.map(mp), b: (t.subs || []).map(mp), co: cc ? { id: cc.id, n: cc.name, cc: cc.countryCode } : null };
          };
          let ref = null;
          if (rf && rf.text) {
            const g = (k) => { const x = (rf.stats || []).find((q) => q.type === k); return x || null; };
            const y = g("yellowCards"), fo = g("fouls"), mt = g("matches"), rd = g("redCards"), pe = g("penalties");
            ref = { n: rf.text, cc: rf.countryCode, y: y ? y.value : null, ya: y ? y.average : null, fo: fo ? fo.value : null, foa: fo ? fo.average : null, mt: mt ? mt.value : null, r: rd ? rd.value : null, pen: pe ? pe.value : null };
          }
          const g2 = j.general || {}, hd = j.header || {}, stt = hd.status || {}, tm = hd.teams || [];
          const lt = stt.liveTime || {}, hf = stt.halfs || {};
          const clean = (x) => String(x == null ? "" : x).replace(/[\u200e\u200f]/g, "");
          const live = !!(stt.started && !stt.finished && !stt.cancelled);
          const ht = live && !!hf.firstHalfEnded && !hf.secondHalfStarted;
          const mf = (c.matchFacts && c.matchFacts.events && c.matchFacts.events.events) || [];
          const nm = (x) => (x && x.name) || "";
          let ev = mf.filter((e) => ["Goal", "Card", "Substitution"].includes(e.type) || (e.type === "MissedPenalty" && !e.isPenaltyShootoutEvent)).map((e) => {
            const add = e.overloadTime || 0;
            const o = { ty: e.type, t: e.time, a: add, h: !!e.isHome, ts: e.time * 100 + add };
            if (e.type === "Goal") { Object.assign(o, { n: e.player && e.player.name || e.nameStr, id: e.player && e.player.id || e.playerId, as: e.assistInput || null, aid: e.assistPlayerId || null, og: !!e.ownGoal, pen: /pen/i.test(e.goalDescription || "") || /pen/i.test(e.goalDescriptionKey || ""), sc: e.newScore || null }); }
            else if (e.type === "MissedPenalty") { Object.assign(o, { n: e.player && e.player.name || e.nameStr, id: e.player && e.player.id || e.playerId }); }
            else if (e.type === "Card") { Object.assign(o, { n: e.player && e.player.name || e.nameStr, id: e.player && e.player.id || e.playerId, cd: e.card }); }
            else { const sw = e.swap || []; Object.assign(o, { n: nm(sw[0]), id: sw[0] && +sw[0].id || null, o: nm(sw[1]), oid: sw[1] && +sw[1].id || null }); }
            return o;
          });
          // campionati minori: FotMob a volte non da' matchFacts.events ma i marcatori stanno nell'intestazione (header.events)
          if (!ev.some((x) => x.ty === "Goal") && hd.events) {
            ["homeTeamGoals", "awayTeamGoals"].forEach((k, side) => {
              Object.values(hd.events[k] || {}).forEach((arr) => (Array.isArray(arr) ? arr : []).forEach((g) => {
                const add = g.overloadTime || 0, t = parseInt(g.time, 10);
                if (!Number.isFinite(t)) return;
                ev.push({ ty: "Goal", t, a: add, h: side === 0, ts: t * 100 + add, n: (g.player && g.player.name) || g.fullName || "", id: (g.player && g.player.id) || g.playerId || null, as: g.assistStr || null, aid: g.assistPlayerId || null, og: !!g.ownGoal, pen: /pen/i.test(g.goalDescription || g.type || ""), sc: null });
              }));
            });
          }
          ev.sort((x, y) => x.ts - y.ts);
          const per = (P) => {
            if (!P || !P.stats) return null;
            const seen = {}, out = [];
            P.stats.forEach((grp) => {
              const rows = [];
              (grp.stats || []).forEach((s2) => {
                if (!s2 || s2.type === "title" || !s2.rawStats || s2.rawStats.length < 2) return;
                if (seen[s2.key]) return; seen[s2.key] = 1;
                const a = s2.rawStats[0] || {}, b = s2.rawStats[1] || {};
                rows.push([s2.key, s2.title, a.value, b.value, a.total, b.total, s2.format || null]);
              });
              if (rows.length) out.push([grp.key || grp.title, grp.title, rows]);
            });
            return out;
          };
          const sp = (c.stats && c.stats.Periods) || {};
          const stats = { All: per(sp.All), FirstHalf: per(sp.FirstHalf), SecondHalf: per(sp.SecondHalf) };
          const arr = (x) => (Array.isArray(x) ? x : x && typeof x === "object" ? Object.values(x) : []);
          const pl = {};
          arr(c.playerStats).forEach((q) => {
            if (!q || !q.id) return;
            const groups = arr(q.stats).map((grp) => [grp.key || grp.title || "", grp.title || "", Object.entries(grp.stats || {}).map(([lab, e]) => { const st2 = (e && e.stat) || {}; return [e && e.key, lab, st2.value, st2.total, st2.type]; }).filter((x) => x[0] && x[2] != null)]).filter((g3) => g3[2].length);
            pl[q.id] = [q.name, q.teamId, q.isGoalkeeper ? 1 : 0, groups];
          });
          const shs = ((c.shotmap || {}).shots || []).map((x) => [x.min, x.minAdded, x.teamId, x.playerName, x.x, x.y, x.eventType, x.isBlocked ? 1 : 0, x.isOnTarget ? 1 : 0, x.blockedX, x.blockedY, x.goalCrossedY, x.goalCrossedZ, x.expectedGoals, x.expectedGoalsOnTarget, x.shotType, x.situation, x.isOwnGoal ? 1 : 0, x.period]);
          const mo = ((c.momentum || {}).main || {}).data || null;
          const out = { t: Date.now(), hi: g2.homeTeam && g2.homeTeam.id, ai: g2.awayTeam && g2.awayTeam.id, sh: shs, mo: mo && mo.length ? mo.map((q) => ({ minute: q.minute, value: q.value })) : null, ty: lu.lineupType || null, started: !!g2.started, fin: !!g2.finished, st: live, sc: tm.length > 1 ? [tm[0].score, tm[1].score] : null, clk: clean(lt.short), ht, ev, stats, pl, h: team(lu.homeTeam), a: team(lu.awayTeam), ref };
          // Catena formazioni (regola fissa 14/11/2026): vale la prima fonte che ha i DUE undici UFFICIALI. FotMob ufficiale con le coordinate resta com'e'
          // (e' la piu' ricca); altrimenti (FotMob vuota, "probabile", "ultima formazione" o "simple") si prova ESPN, poi PitchAPI, poi LiveScore: appena una
          // pubblica la formazione ufficiale prende il posto di quella probabile. Nome, foto, voto e id restano di FotMob dove coincide lo stesso giocatore.
          const noXY = (t) => !t || (t.s || []).some((p) => p[2] == null);
          const fmOfficial = /^(standard|official|confirm)/i.test(String(lu.lineupType || ""));
          // diretta.it al primo posto (richiesta utente 15/11/2026, `worker/diretta.js`): ufficiali di diretta prima di ogni altra fonte; a partita iniziata
          // con la formazione FotMob completa non si cambia piu' (il live resta com'era). Le probabili di diretta passano davanti a quelle di FotMob e all'ultima formazione,
          // ma mai davanti a una formazione ufficiale di un'altra fonte. Se diretta non risponde o non e' abbinata, la catena resta quella di prima.
          const fm0 = { h: out.h, a: out.a };
          const fmReady = fmOfficial && !noXY(out.h) && !noXY(out.a);
          // le altre fonti partono subito, insieme a diretta (si usano solo se servono)
          const mkAlt = () => ({ hi: out.hi, ai: out.ai });
          const needAlt = noXY(out.h) || noXY(out.a) || (!fmOfficial && !g2.started);
          const altP = needAlt ? (async () => { const [aE, aP, aL] = [mkAlt(), mkAlt(), mkAlt()]; await Promise.all([espnLineups(aE, g2), pitchLineups(aP, id, env), lsLineups(aL, g2.matchTimeUTCDate || stt.utcTime, !!(g2.started || g2.finished))]); return aE.h ? aE : aP.h ? aP : aL.h ? aL : mkAlt(); })() : null;
          const dl = await dlLineups(g2, stt, id, env);
          let dlDone = false;
          if (dl && dl.official && !fmReady) { // ufficiale: vale la prima fonte che la mostra; FotMob con i posti in campo gia' completa resta com'e'
            [out.h, out.a] = await Promise.all([dlFill(dl.h, fm0.h, out.hi), dlFill(dl.a, fm0.a, out.ai)]);
            out.luSrc = "diretta"; out.ty = "standard"; dlDone = true;
            // ufficiale di diretta in solo elenco (senza modulo, 25/11/2026): i posti in campo da FotMob/ESPN/PitchAPI se hanno gli STESSI 11; se no elenco
            if (noXY(out.h) || noXY(out.a)) {
              const alt = altP ? await altP.catch(() => null) : null;
              const pos = (t, src) => {
                if (!t || !src || noXY(src)) return null;
                const rows = (t.s || []).map((p) => { const q = (src.s || []).find((x) => x[2] != null && samePerson(x[0], p[0])); return q ? [p[0], p[1] != null ? p[1] : q[1], q[2], q[3], p[4] || q[4], p[5] || q[5], p[6] || q[6], p[7] || q[7], p[8] != null ? p[8] : q[8]] : null; });
                return rows.length === 11 && rows.every(Boolean) ? { ...t, f: t.f || src.f, s: rows } : null;
              };
              const H = pos(out.h, fm0.h) || pos(out.h, alt && alt.h), A = pos(out.a, fm0.a) || pos(out.a, alt && alt.a);
              if (H && A) { out.h = H; out.a = A; }
              else { [out.h, out.a] = await Promise.all([rosaMark(out.h, out.hi), rosaMark(out.a, out.ai)]); out.luList = 1; }
            }
          }
          if (!dlDone && (noXY(out.h) || noXY(out.a) || (!fmOfficial && !g2.started))) {
            const fmH = out.h, fmA = out.a;
            // ESPN, PitchAPI e LiveScore si leggono INSIEME (18/11/2026: in fila arrivavano a 3-9 secondi e con piu' richieste il sito superava i 10 s:
            // partite senza formazione); vale sempre la prima della gerarchia che ce l'ha (ESPN, poi PitchAPI, poi LiveScore)
            const alt = (altP ? await altP : null) || mkAlt();
            // FotMob gia' UFFICIALE (senza posti in campo) e l'altra fonte solo PROBABILE (21/11/2026): mai i titolari probabili al posto di quelli ufficiali.
            // Dall'altra fonte si prendono solo i posti in campo e solo se tutti gli 11 ufficiali ci sono anche li'; se no restano gli 11 ufficiali in elenco.
            const altOff = /^(standard|official|confirm)/i.test(String(alt.ty || ""));
            if (fmOfficial && !altOff && fmH && fmA && alt.h && alt.a) {
              const pos = (fm, t) => {
                const rows = (fm.s || []).map((p) => { const q = (t.s || []).find((x) => x[2] != null && samePerson(x[0], p[0])); return q ? [p[0], p[1], q[2], q[3], p[4], p[5], p[6], p[7], p[8]] : null; });
                return rows.length === 11 && rows.every(Boolean) ? { ...fm, f: fm.f || t.f, s: rows } : null;
              };
              const H = pos(fmH, alt.h), A = pos(fmA, alt.a);
              if (H && A) { out.h = H; out.a = A; }
              else if (noXY(fmH) || noXY(fmA)) { [out.h, out.a] = await Promise.all([rosaMark(fmH, out.hi), rosaMark(fmA, out.ai)]); out.luList = 1; }
            } else if (alt.h && alt.a && !alt.luList) {
              out.h = fmFill(alt.h, fmH, !fmOfficial); out.a = fmFill(alt.a, fmA, !fmOfficial); out.luSrc = alt.luSrc;
              // il tipo e' quello dei giocatori mostrati: titolari probabili dell'altra fonte = "probabile", anche se FotMob diceva "ufficiale" senza giocatori
              if (!out.ty || out.ty === "unavailable" || !fmOfficial || !altOff) out.ty = alt.ty;
            } else if (alt.h && alt.a && !fmH && !fmA) {
              // soli nomi ufficiali (nessuna fonte con i posti in campo): elenco in colonna
              [out.h, out.a] = await Promise.all([rosaMark(alt.h, out.hi), rosaMark(alt.a, out.ai)]);
              out.luSrc = alt.luSrc; out.luList = 1;
              if (!out.ty || out.ty === "unavailable" || !altOff) out.ty = alt.ty;
            }
          }
          // formazione PROBABILE di diretta.it: davanti a ogni altra probabile; ma non a titolari ufficiali gia' presi da un'altra fonte
          // (16/11/2026: diretta vince su QUALSIASI altra probabile, anche ESPN/PitchAPI/LiveScore/ultima formazione; cede solo a una formazione ufficiale gia' presa da un'altra fonte)
          // qualsiasi ufficiale (anche in solo elenco, senza posti in campo) batte ogni probabile (25/11/2026)
          const otherOfficial = /^(standard|official|confirm)/i.test(String(out.ty || "")) && !!out.h && !!out.a && (out.h.s || []).length >= 11 && (out.a.s || []).length >= 11;
          if (!dlDone && dl && !dl.official && !g2.started && !otherOfficial) {
            [out.h, out.a] = await Promise.all([dlFill(dl.h, fm0.h, out.hi), dlFill(dl.a, fm0.a, out.ai)]);
            out.luSrc = "diretta"; out.ty = "predicted";
          }
          // Nessuna fonte ha ancora la formazione (nazionali, amichevoli, campionati minori a giorni dal fischio): formazione PROBABILE = l'ultima formazione
          // iniziale della squadra (FotMob, pagina squadra `overview.lastLineupStats`, la stessa che FotMob usa per "lastStarting11"). Dati veri, mai inventati;
          // niente voti (sono della partita di allora). Ogni squadra a parte: se una ha la sua probabile e l'altra no, solo l'altra si completa.
          if (!g2.started && !g2.finished && (!out.h || !out.a)) {
            const last = async (tid) => {
              if (!tid) return null;
              try {
                const T = await fmTeam(tid);
                const ll = T && T.ll;
                if (!ll || (ll.starters || []).length !== 11 || ll.starters.some((q) => !q.horizontalLayout)) return null;
                const mp2 = (q) => [q.name, q.shirtNumber != null ? +q.shirtNumber || q.shirtNumber : null, q.horizontalLayout.x, q.horizontalLayout.y, false, ph(q.id), null, q.id, q.positionId != null ? q.positionId : q.usualPlayingPositionId != null ? q.usualPlayingPositionId : null];
                return { f: ll.formation || null, s: ll.starters.map(mp2), b: [], co: null };
              } catch (e) { return null; }
            };
            const [lh, la] = await Promise.all([out.h ? null : last(out.hi), out.a ? null : last(out.ai)]);
            if (lh) out.h = lh;
            if (la) out.a = la;
            if ((lh || la) && out.h && out.a) { out.ty = "lastStarting11"; out.luSrc = "ultima"; }
          }
          await lsMerge(out, g2.matchTimeUTCDate || stt.utcTime);
          // statistiche: FotMob prima; se non le ha ancora (primi minuti) o non le ha mai (campionati minori) ESPN
          if ((out.st || out.fin) && !(out.stats && out.stats.All && out.stats.All.length)) await espnStats(out, g2);
          // diretta.it (richiesta utente 16/11/2026): risultato ed eventi (gol, assist, cartellini) appena li pubblica, davanti a FotMob; FotMob resta dove ha gli id dei giocatori
          if (!out.fin && out.st) {
            const D = await dlEvents(g2, stt);
            if (D) {
              if (D.sc && D.live) { const cur = out.sc && out.sc[0] != null ? [+out.sc[0] || 0, +out.sc[1] || 0] : [0, 0]; out.sc = [Math.max(cur[0], D.sc[0]), Math.max(cur[1], D.sc[1])]; out.dls = 1; }
              if (D.ev.length) {
                const have = out.ev || [], used = new Set();
                const add = [];
                D.ev.forEach((d) => {
                  const k = have.findIndex((e, i) => !used.has(i) && e.ty === d.ty && !!e.h === !!d.h && Math.abs(e.t - d.t) <= 1 && (d.ty !== "Card" || e.cd === d.cd));
                  if (k >= 0) { used.add(k); if (d.ty === "Goal" && !have[k].as && d.as) have[k].as = d.as; } else add.push(d);
                });
                // REGOLA FISSA (22/11/2026): i gol aggiunti da diretta non possono mai superare il punteggio della squadra (FotMob/diretta);
              // un gol in piu' (rigore sbagliato letto come gol, gol annullato) si scarta
              if (out.sc && out.sc[0] != null) {
                const lim = [+out.sc[0] || 0, +out.sc[1] || 0];
                const cnt = [0, 0];
                have.forEach((e) => { if (e.ty === "Goal") cnt[e.h ? 0 : 1] += 1; });
                for (let i = add.length - 1; i >= 0; i--) { const d = add[i]; if (d.ty !== "Goal") continue; const s2 = d.h ? 0 : 1; if (cnt[s2] + 1 > lim[s2]) add.splice(i, 1); else cnt[s2] += 1; }
              }
              if (add.length) { out.ev = have.concat(add).sort((x, y) => x.ts - y.ts); out.dlEv = add.length; }
              }
            }
          }
          // cronometro preciso: secondi veri di FotMob (liveTime.long "mm:ss"), recupero annunciato dall'arbitro (evento AddedTime del tempo in corso);
          // se FotMob non ha i secondi si usa il minuto di LiveScore (meno 30 s: il minuto "47'" copre 46:00-46:59)
          if (out.st && !out.fin) {
            const lm = String(lt.long || "").match(/^(\d+):(\d{2})/);
            const pEnd = hf.secondExtraHalfStarted ? 120 : hf.firstExtraHalfStarted ? 105 : hf.secondHalfStarted ? 90 : 45;
            const aev = mf.filter((e) => e.type === "AddedTime" && Number(e.time) === pEnd).pop();
            let cs = lm ? +lm[1] * 60 + +lm[2] : null, src = "fm";
            if (cs == null) { const cm = String(out.clk || "").match(/^(\d+)(?:\+(\d+))?/); if (cm) { cs = Math.max(0, (+cm[1] + (+cm[2] || 0)) * 60 - 30); src = "ls"; } }
            // diretta.it (richiesta utente 16/11/2026): e' la fonte piu' puntuale (FotMob ritardava di ~4 minuti); vale il piu' alto tra le fonti, mai indietro
            const dk = await dlClock(g2, stt);
            if (dk && dk.ht && !hf.secondHalfStarted) out.ht = true;
            else if (dk && dk.s != null && dk.s <= pEnd * 60 + 20 * 60 && (cs == null || dk.s > cs)) { cs = dk.s; src = "dl"; }
            // Il cronometro non resta mai indietro (richiesta utente 16/11/2026: Kazakhstan-Slovakia a 24:30 con un gol al 29'): le fonti (liveTime, LiveScore) possono ritardare,
            // quindi vale il piu' alto tra (1) secondi dall'inizio del tempo in corso (orari di inizio tempo di FotMob in `halfs`), (2) minuto dell'ultimo evento del tempo in corso.
            // Entrambi non possono mai superare il tempo vero; (1) solo se plausibile (fuso o formato strani vengono scartati).
            if (!out.ht) {
              const tsOf = (v) => { const q = String(v == null ? "" : v).match(/^(\d{4})(\d{2})(\d{2})[ T]?(\d{2}):?(\d{2}):?(\d{2})/); return q ? Date.UTC(+q[1], +q[2] - 1, +q[3], +q[4], +q[5], +q[6]) : (v && Number.isFinite(Date.parse(v)) ? Date.parse(v) : null); };
              const hs0 = hf.secondExtraHalfStarted ? [tsOf(hf.secondExtraHalfStarted), 105 * 60] : hf.firstExtraHalfStarted ? [tsOf(hf.firstExtraHalfStarted), 90 * 60] : hf.secondHalfStarted ? [tsOf(hf.secondHalfStarted), 45 * 60] : hf.firstHalfStarted ? [tsOf(hf.firstHalfStarted), 0] : null;
              if (hs0 && hs0[0]) {
                const est = Math.floor(hs0[1] + (Date.now() - hs0[0]) / 1000);
                if (est >= hs0[1] && est <= pEnd * 60 + 20 * 60 && (cs == null || est > cs + 5)) { cs = est; src = "hs"; }
              }
              const from = { 45: 0, 90: 45, 105: 90, 120: 105 }[pEnd];
              const fl = mf.filter((e) => ["Goal", "Card", "Substitution"].includes(e.type) && !e.isPenaltyShootoutEvent && Number(e.time) > from && Number(e.time) <= pEnd).reduce((a, e) => Math.max(a, Number(e.time) * 60), 0);
              if (fl && (cs == null || cs < fl)) { cs = fl; src = src + "+ev"; }
            }
            // anche il minuto semplice (pagina partita, scheda giocatore) segue il cronometro corretto, con lo stesso formato di FotMob (45+2’)
            if (cs != null && src !== "fm" && !out.ht) { const mn = Math.floor(cs / 60) + 1; out.clk = (mn > pEnd ? pEnd + "+" + (mn - pEnd) : mn) + "\u2019"; }
            if (cs != null || out.ht) out.lc = { s: cs, mx: pEnd, ad: aev ? Number(aev.minutesAddedInput) || 0 : 0, ht: out.ht ? 1 : 0, src };
          }
          if (out.h || out.a) [out.h, out.a] = await Promise.all([out.h ? linkMissing(out.h, out.hi) : out.h, out.a ? linkMissing(out.a, out.ai) : out.a]);
          // REGOLA FISSA (utente 21/11/2026): "Formazione ufficiale" solo da 1h15 prima del fischio in poi. Prima di allora qualunque fonte
          // (LiveScore marcava "standard" la formazione 4 ore e mezza prima di Bournemouth-Forest) vale come probabile.
          { const ko0 = Date.parse(g2.matchTimeUTCDate || (stt && stt.utcTime) || ""); if (!out.st && ko0 && ko0 - Date.now() > 75 * 60000 && /^(standard|official|confirm)/i.test(String(out.ty || ""))) { out.ty = "predicted"; out.tyEarly = 1; } }
          // cartellini rossi per squadra (Home, concept A 17/11/2026): rosso diretto e doppio giallo, dagli eventi gia' uniti (FotMob, LiveScore, diretta.it)
          { const rr = [0, 0]; (out.ev || []).forEach((e) => { if (e.ty === "Card" && (e.cd === "Red" || e.cd === "YellowRed")) rr[e.h ? 0 : 1] += 1; }); if (rr[0] || rr[1]) out.rc = rr; }
          // cartellini (21/11/2026): stesso cartellino da due fonti con 2-3 minuti di differenza = uno solo; allenatore o staff segnati come tali (co: 1 allenatore, 2 staff)
          if (Array.isArray(out.ev) && out.ev.length) {
            const cards = out.ev.filter((e) => e.ty === "Card");
            const drop = new Set();
            cards.forEach((e) => { if (e.id || drop.has(e)) return; const twin = cards.find((x) => x !== e && !drop.has(x) && !!x.h === !!e.h && x.cd === e.cd && Math.abs(x.t - e.t) <= 3 && x.n && e.n && samePerson(x.n, e.n)); if (twin) drop.add(e); });
            if (drop.size) out.ev = out.ev.filter((e) => !drop.has(e));
            const inTeam = (t, n) => !!t && [...(t.s || []), ...(t.b || [])].some((p) => p && p[0] && samePerson(p[0], n));
            out.ev.forEach((e) => {
              if (e.ty !== "Card" || !e.n) return;
              const t = e.h ? out.h : out.a;
              if (t && t.co && t.co.n && ((t.co.id && e.id && String(t.co.id) === String(e.id)) || samePerson(t.co.n, e.n))) e.co = 1;
              else if (t && (t.s || []).length >= 11 && (t.b || []).length >= 5 && !inTeam(out.h, e.n) && !inTeam(out.a, e.n)) e.co = 2;
            });
          }
          // FORMAZIONI PRE-PARTITA MAI PERSE (22/11/2026): se questa lettura arriva senza i due undici (fonte lenta o assente in quel momento)
          // ma il worker li aveva gia' (memoria o KV), restano quelli: anche un telefono appena riaperto li riceve subito
          const pre0 = !out.st && !out.fin && !g2.started ? await fxPreGet(id, env) : null;
          if (pre0 && pre0.lu && !(fxFull(out.h) && fxFull(out.a))) { out.h = pre0.lu.h; out.a = pre0.lu.a; out.ty = pre0.lu.ty; out.luSrc = pre0.lu.luSrc; out.luKeep = 1; }
          const body = JSON.stringify(out);
          fxPreSave(id, env, ctx, out, g2, stt, body);
          const ko = Date.parse(g2.matchTimeUTCDate || stt.utcTime || "");
          if (!out.st && !out.fin && !g2.started && ko && ko - Date.now() > 86 * 60000 && out.h && out.a) {
            FXMEM.delete(id); FXMEM.set(id, { t: Date.now(), b: body });
            while (FXMEM.size > 300) FXMEM.delete(FXMEM.keys().next().value);
            const put = caches.default.put(fxKey, new Response(body, { headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=300" } })).catch(() => {});
            if (ctx && ctx.waitUntil) ctx.waitUntil(put);
          }
          if (out.st && !out.fin) { FXLIVE.delete(id); FXLIVE.set(id, { t: Date.now(), b: body }); while (FXLIVE.size > 100) FXLIVE.delete(FXLIVE.keys().next().value); }
          return new Response(body, { headers: cors(req, { "Cache-Control": out.st && !out.fin ? "no-store" : "public, max-age=3" }) }); // live: mai tenuta dal telefono
        };
        // PARTITE NON INIZIATE (regola fissa 22/11/2026, formazioni sparite dopo il ritorno dal background): si risponde SUBITO con l'ultima
        // risposta completa (memoria del worker o KV `idx:fxpre/<id>`, sopravvive alle interruzioni e ai riavvii) e il calcolo nuovo parte dietro
        // (ctx.waitUntil). Se quel calcolo viene interrotto il telefono ha gia' avuto formazioni e dati; al giro dopo (3 s) riceve quelli nuovi.
        // Ultimo minuto prima del fischio, partite iniziate e risposte piu' vecchie di 6 ore: calcolo normale.
        const pre = await fxPreGet(id, env);
        const now0 = Date.now();
        if (pre && pre.body && pre.ko - now0 > 60000 && now0 - pre.t < 6 * 3600000) {
          if (now0 - pre.t >= 2500 && !FXPRE_RUN.has(id)) {
            FXPRE_RUN.add(id);
            const job = fxRun().catch(() => {}).finally(() => FXPRE_RUN.delete(id));
            if (ctx && ctx.waitUntil) ctx.waitUntil(job); else await job;
          }
          return new Response(pre.body, { headers: cors(req, { "Cache-Control": "no-store", "X-Fx-Cache": "pre" }) });
        }
        try { return await fxRun(); } catch (e) {
          // FotMob non risponde: partita non ancora iniziata con una risposta salvata = si usa quella (mai "nessuna formazione")
          if (pre && pre.body && pre.ko - now0 > -15 * 60000) return new Response(pre.body, { headers: cors(req, { "Cache-Control": "no-store", "X-Fx-Cache": "pre-err" }) });
          throw e;
        }
      }
      if (u.pathname === "/m") {
        const lg = u.searchParams.get("lg"), id = u.searchParams.get("id");
        if (!LEGHE.includes(lg) || !/^\d{5,12}$/.test(id || "")) return new Response("{}", { status: 400, headers: cors(req) });
        const j = await espn("/" + lg + "/summary?event=" + id);
        return new Response(JSON.stringify({ t: Date.now(), ...summary(j) }), { headers: cors(req) });
      }
      if (u.pathname === "/f") {
        const dt = u.searchParams.get("date");
        if (!/^\d{8}$/.test(dt || "")) return new Response("{}", { status: 400, headers: cors(req) });
        const r = await fetch("https://www.fotmob.com/api/data/matches?date=" + dt + "&timezone=Europe%2FRome&ccode3=ITA", { headers: FMH, cf: { cacheTtl: 3, cacheEverything: true } });
        if (!r.ok) throw new Error("FotMob " + r.status);
        const j = await r.json(), OK = [47, 54, 87, 53, 55, 42, 73, 10216];
        const m = [];
        // ?all=1 (22/11/2026): tutte le competizioni del giorno in una risposta sola. La Home nativa lo usa al posto di una richiesta /fx per partita
        // (fino a 36 ogni 3 s: il worker superava il limite di CPU e le richieste delle formazioni venivano interrotte)
        const ALL = u.searchParams.get("all") === "1";
        (j.leagues || []).forEach((l) => { if (!ALL && !OK.includes(l.primaryId || l.id)) return; (l.matches || []).forEach((x) => m.push({ id: x.id, l: l.primaryId || l.id, h: x.home && x.home.name, a: x.away && x.away.name, hi: x.home && x.home.id, ai: x.away && x.away.id, t: x.status && x.status.utcTime, f: !!(x.status && x.status.finished), s: !!(x.status && x.status.started), sc: x.status && x.status.scoreStr || null, lt: x.status && x.status.liveTime ? String(x.status.liveTime.short || "").replace(/[\u200e\u200f]/g, "") : null, rc: (x.home && x.home.redCards) || (x.away && x.away.redCards) ? [(x.home && x.home.redCards) || 0, (x.away && x.away.redCards) || 0] : undefined })); });
        return new Response(JSON.stringify({ t: Date.now(), m }), { headers: cors(req, { "Cache-Control": "public, max-age=3" }) });
      }
      if (u.pathname === "/lt") { // classifica FotMob della competizione (aggiornata ogni 5 s) + partite in corso: ?id=<id FotMob della lega>
        const id = u.searchParams.get("id");
        if (!/^\d{1,6}$/.test(id || "")) return new Response("{}", { status: 400, headers: cors(req) });
        const r = await fetch("https://www.fotmob.com/api/data/leagues?id=" + id + "&ccode3=ITA", { headers: FMH, cf: { cacheTtl: 5, cacheEverything: true } });
        if (!r.ok) throw new Error("FotMob " + r.status);
        const j = await r.json();
        const cut = (x) => (x || []).map((q) => ({ id: q.id, name: q.name, shortName: q.shortName, idx: q.idx, played: q.played, wins: q.wins, draws: q.draws, losses: q.losses, scoresStr: q.scoresStr, goalConDiff: q.goalConDiff, pts: q.pts, qualColor: q.qualColor, og: q.ongoing || null }));
        const groups = [];
        (j.table || []).forEach((tb) => {
          const d = tb.data || {};
          if (d.table && d.table.all) groups.push({ n: d.leagueName || "", t: { all: cut(d.table.all), home: cut(d.table.home), away: cut(d.table.away) } });
          (d.tables || []).forEach((g) => { const t = g.table || {}; if (t.all) groups.push({ n: g.leagueName || "", t: { all: cut(t.all), home: cut(t.home), away: cut(t.away) } }); });
        });
        const live = [];
        ((j.fixtures && j.fixtures.allMatches) || []).forEach((m) => {
          const st = m.status || {};
          if (!st.started || st.finished || st.cancelled) return;
          const sc = String(st.scoreStr || "").split("-").map((v) => parseInt(v, 10));
          if (sc.length !== 2 || sc.some(isNaN)) return;
          const lt = st.liveTime || {};
          live.push([m.id, m.home && m.home.id, m.away && m.away.id, sc[0], sc[1], lt.short || lt.long || ""]);
        });
        // FotMob durante la diretta mette gia' la partita in corso nella tabella (Venezia 11 partite invece di 10, 6 nov) e lo segna con `ongoing`
        // (id, risultato usato, fase "Clausura - Round 16"). L'app la aggiunge col risultato provvisorio (`applyLive`), quindi qui si toglie da ogni
        // riga che la contiene gia', e ogni gruppo riceve solo le sue partite live (`g.live`): Apertura/Clausura, gironi. Vale per ogni competizione
        // e per le tabelle totale, casa e trasferta: la partita live si conta una volta sola e solo nella fase giusta.
        if (live.length) {
          const fin = { all: {}, home: {}, away: {} };
          ((j.fixtures && j.fixtures.allMatches) || []).forEach((m) => {
            const st = m.status || {};
            if (!st.finished || st.cancelled) return;
            const h = String(m.home && m.home.id), a = String(m.away && m.away.id);
            fin.all[h] = (fin.all[h] || 0) + 1; fin.all[a] = (fin.all[a] || 0) + 1;
            fin.home[h] = (fin.home[h] || 0) + 1; fin.away[a] = (fin.away[a] || 0) + 1;
          });
          const stage = {};
          groups.forEach((g) => ["all", "home", "away"].forEach((md) => (g.t[md] || []).forEach((r) => { if (r.og && r.og.id && r.og.stage) stage[String(r.og.id)] = String(r.og.stage); })));
          const norm = (x) => String(x || "").toLowerCase().replace(/\s+/g, " ").trim();
          // gruppo della partita: quello il cui nome e' l'inizio della fase FotMob (il piu' lungo); senza fase, ogni gruppo con le due squadre
          const owner = {};
          live.forEach((m) => {
            const sg = norm(stage[String(m[0])]);
            let best = null;
            if (sg) groups.forEach((g, gi) => { const n = norm(g.n); if (n && sg.startsWith(n) && (best === null || n.length > norm(groups[best].n).length)) best = gi; });
            owner[String(m[0])] = best;
          });
          const mine = (g, gi, m) => {
            const ids = new Set((g.t.all || []).map((r) => String(r.id)));
            if (!ids.has(String(m[1])) || !ids.has(String(m[2]))) return false;
            const o = owner[String(m[0])];
            return o === null || o === undefined || o === gi;
          };
          const sub = (rows, md, gl) => (rows || []).forEach((r) => {
            const tid = String(r.id);
            const lm = gl.find((x) => (md !== "away" && String(x[1]) === tid) || (md !== "home" && String(x[2]) === tid));
            if (!lm) return;
            const og = r.og && String(r.og.id) === String(lm[0]) ? r.og : null;
            // dentro se FotMob la segna (`ongoing`); se il campo manca, se le partite giocate superano quelle finite
            const inside = r.og !== undefined && r.og !== null ? !!og : (r.played || 0) > (fin[md][tid] || 0);
            if (!inside) return;
            const home = String(lm[1]) === tid;
            const hs = og && og.hScore != null ? Number(og.hScore) : lm[3], as = og && og.aScore != null ? Number(og.aScore) : lm[4];
            const us = home ? hs : as, them = home ? as : hs;
            const sc = /^(\d+)\D+(\d+)$/.exec(String(r.scoresStr || ""));
            const gf = sc ? Number(sc[1]) - us : 0, ga = sc ? Number(sc[2]) - them : 0;
            r.played -= 1;
            if (us > them) { r.wins -= 1; r.pts -= 3; } else if (us === them) { r.draws -= 1; r.pts -= 1; } else r.losses -= 1;
            if (sc) { r.scoresStr = gf + "-" + ga; r.goalConDiff = gf - ga; }
          });
          const cmp = (a, b) => (b.pts || 0) - (a.pts || 0) || (b.goalConDiff || 0) - (a.goalConDiff || 0) || (parseInt(b.scoresStr, 10) || 0) - (parseInt(a.scoresStr, 10) || 0) || (a.idx || 0) - (b.idx || 0);
          groups.forEach((g, gi) => {
            g.live = live.filter((m) => mine(g, gi, m));
            ["all", "home", "away"].forEach((md) => {
              const rows = g.t[md];
              if (!rows || !rows.length) return;
              sub(rows, md, g.live);
              const zones = rows.slice().sort((a, b) => (a.idx || 0) - (b.idx || 0)).map((r) => r.qualColor);
              rows.sort(cmp).forEach((r, i) => { r.idx = i + 1; r.qualColor = zones[i]; });
            });
          });
        }
        groups.forEach((g) => ["all", "home", "away"].forEach((md) => (g.t[md] || []).forEach((r) => { delete r.og; })));
        return new Response(JSON.stringify({ t: Date.now(), groups, live }), { headers: cors(req, { "Cache-Control": "public, max-age=5" }) });
      }
      if (u.pathname === "/fs") {
        const id = u.searchParams.get("id");
        if (!/^\d{5,10}$/.test(id || "")) return new Response("{}", { status: 400, headers: cors(req) });
        const r = await fetch("https://www.fotmob.com/api/data/matchDetails?matchId=" + id, { headers: FMH, cf: { cacheTtl: 15, cacheEverything: true } });
        if (!r.ok) throw new Error("FotMob " + r.status);
        const j = await r.json(), g = j.general || {}, sm = ((j.content || {}).shotmap) || {};
        const sh = (sm.shots || []).map((s) => [s.min, s.minAdded, s.teamId, s.playerName, s.x, s.y, s.eventType, s.isBlocked ? 1 : 0, s.isOnTarget ? 1 : 0, s.blockedX, s.blockedY, s.goalCrossedY, s.goalCrossedZ, s.expectedGoals, s.expectedGoalsOnTarget, s.shotType, s.situation, s.isOwnGoal ? 1 : 0, s.period]);
        const lu = ((j.content || {}).lineup) || {};
        const coach = (t) => { const c = t && t.coach; if (!c) return null; return { id: c.id, n: c.name || c.fullName || null, cc: c.countryCode || c.ccode || c.country || null }; };
        return new Response(JSON.stringify({ t: Date.now(), hi: g.homeTeam && g.homeTeam.id, ai: g.awayTeam && g.awayTeam.id, fin: !!g.finished, st: !!g.started, sh, co: [coach(lu.homeTeam), coach(lu.awayTeam)] }), { headers: cors(req) });
      }
      if (u.pathname === "/fp") {
        const id = u.searchParams.get("id");
        if (!/^\d{5,10}$/.test(id || "")) return new Response("{}", { status: 400, headers: cors(req) });
        const r = await fetch("https://www.fotmob.com/api/data/matchDetails?matchId=" + id, { headers: FMH, cf: { cacheTtl: 15, cacheEverything: true } });
        if (!r.ok) throw new Error("FotMob " + r.status);
        const j = await r.json(), g = j.general || {}, ps = ((j.content || {}).playerStats) || {};
        const arr = (x) => (Array.isArray(x) ? x : x && typeof x === "object" ? Object.values(x) : []);
        const p = arr(ps).map((q) => ({
          i: q.id, n: q.name, t: q.teamId, gk: !!q.isGoalkeeper,
          g: arr(q.stats).map((grp) => [grp.title || grp.key || "", Object.entries(grp.stats || {}).map(([lab, e]) => { const st = (e && e.stat) || {}; return [lab, e && e.key, st.value, st.total, st.type]; })]),
        }));
        return new Response(JSON.stringify({ t: Date.now(), hi: g.homeTeam && g.homeTeam.id, ai: g.awayTeam && g.awayTeam.id, fin: !!g.finished, p }), { headers: cors(req) });
      }
      if (u.pathname === "/diag4") {
        const out = {};
        const H = { "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile Safari/604.1", "Accept": "application/json,*/*", "Accept-Language": "en-US,en;q=0.9" };
        const d = u.searchParams.get("date") || new Date().toISOString().slice(0, 10).replace(/-/g, "");
        try {
          const r = await fetch("https://www.fotmob.com/api/data/matches?date=" + d + "&timezone=Europe%2FRome&ccode3=ITA", { headers: H });
          const j = await r.json();
          const L = (j.leagues || []).filter((l) => [47, 55, 87, 54, 53, 42, 73, 77].includes(l.primaryId || l.id));
          out.leghe = (j.leagues || []).length; out.top = L.map((l) => l.name + ":" + (l.matches || []).length);
          let all = []; (L.length ? L : j.leagues || []).forEach((l) => (l.matches || []).forEach((m) => all.push({ l: l.name, m })));
          const fin = all.filter((x) => x.m.status && x.m.status.finished), live = all.filter((x) => x.m.status && x.m.status.started && !x.m.status.finished);
          out.n_finite = fin.length; out.n_live = live.length;
          const pick = (live[0] || fin[0] || all[0]);
          if (pick) {
            out.partita = pick.l + " " + (pick.m.home && pick.m.home.name) + " - " + (pick.m.away && pick.m.away.name) + " id " + pick.m.id + (live[0] ? " LIVE" : "");
            for (const [k, url] of [["det_data", "https://www.fotmob.com/api/data/matchDetails?matchId="], ["det_api", "https://www.fotmob.com/api/matchDetails?matchId="]]) {
              try {
                const r2 = await fetch(url + pick.m.id, { headers: H }); const x = await r2.text();
                out[k] = { status: r2.status, bytes: x.length, shotmap: x.indexOf('"shotmap"') >= 0, head: x.slice(0, 120) };
                const i = x.indexOf('"shotmap"'); if (i >= 0) out[k].sample = x.slice(i, i + 1100);
              } catch (e) { out[k] = { errore: String(e).slice(0, 100) }; }
            }
          }
        } catch (e) { out.errore = String(e).slice(0, 150); }
        return new Response(JSON.stringify(out, null, 1), { headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
      }
      if (u.pathname === "/diag3") {
        const out = {};
        const H = { "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile Safari/604.1", "Accept": "text/html,application/json,*/*", "Accept-Language": "en-US,en;q=0.9" };
        const d = u.searchParams.get("date") || new Date().toISOString().slice(0, 10).replace(/-/g, "");
        const get = async (k, url) => { try { const r = await fetch(url, { headers: H }); const x = await r.text(); out[k] = { status: r.status, bytes: x.length, head: x.slice(0, 160) }; return x; } catch (e) { out[k] = { errore: String(e).slice(0, 100) }; return ""; } };
        const page = await get("home", "https://www.fotmob.com/?date=" + d);
        const nd = page.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
        if (nd) { try { const j = JSON.parse(nd[1]); out.next_keys = Object.keys(j.props.pageProps || {}); out.fallback_keys = Object.keys((j.props.pageProps || {}).fallback || {}).slice(0, 12); out.buildId = j.buildId; } catch (e) { out.next_errore = String(e).slice(0, 80); } }
        out.cont_matchId = (page.match(/matchId/g) || []).length; out.cont_pageUrl = (page.match(/pageUrl/g) || []).length;
        const ix = page.indexOf("matchId"); out.snip_matchId = ix >= 0 ? page.slice(Math.max(0, ix - 200), ix + 400) : null;
        await get("api_data_matches", "https://www.fotmob.com/api/data/matches?date=" + d + "&timezone=Europe%2FRome&ccode3=ITA");
        await get("api_matches", "https://www.fotmob.com/api/matches?date=" + d + "&timezone=Europe%2FRome&ccode3=ITA");
        return new Response(JSON.stringify(out, null, 1), { headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
      }
      if (u.pathname === "/diag2") {
        const out = {};
        const H = { "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile Safari/604.1", "Accept": "text/html,application/json,*/*", "Accept-Language": "en-US,en;q=0.9" };
        const d = u.searchParams.get("date") || new Date().toISOString().slice(0, 10).replace(/-/g, "");
        try {
          const r = await fetch("https://www.fotmob.com/?date=" + d, { headers: H });
          const x = await r.text();
          out.giorno = { status: r.status, bytes: x.length, nextdata: x.indexOf("__NEXT_DATA__") >= 0 };
          const m = [...x.matchAll(/"pageUrl":"(\/matches\/[^"]+)"/g)].map((q) => q[1]);
          out.n_partite = m.length; out.esempi = m.slice(0, 5);
          const pick = m.find((q) => /torino|inter|milan|juventus|napoli|roma|lazio/.test(q)) || m[0];
          if (pick) {
            const r2 = await fetch("https://www.fotmob.com" + pick, { headers: H });
            const y = await r2.text();
            out.partita = { url: pick, status: r2.status, bytes: y.length, shotmap: y.indexOf('"shotmap"') >= 0, xg: (y.match(/"expectedGoals":/g) || []).length };
            const i = y.indexOf('"shotmap"');
            out.shotmap_sample = i >= 0 ? y.slice(i, i + 900) : null;
            const k = y.indexOf('"onGoalShot"');
            out.shot_sample = k >= 0 ? y.slice(Math.max(0, k - 500), k + 500) : null;
          }
        } catch (e) { out.errore = String(e).slice(0, 150); }
        return new Response(JSON.stringify(out, null, 1), { headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
      }
      if (u.pathname === "/diag") {
        const out = {};
        const H = { "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15", "Accept": "application/json,text/plain,*/*" };
        const tryf = async (k, url, hd) => {
          try {
            const r = await fetch(url, { headers: { ...H, ...(hd || {}) } });
            const x = await r.text();
            out[k] = { status: r.status, bytes: x.length, head: x.slice(0, 260), coord: /fieldPosition|coordinate|shotmap|"x":\s*\d/i.test(x), sample: (x.match(/.{60}(fieldPosition|shotmap|expectedGoals).{120}/i) || [""])[0] };
            return x;
          } catch (e) { out[k] = { errore: String(e).slice(0, 100) }; return ""; }
        };
        const d = new Date().toISOString().slice(0, 10);
        const sb = await tryf("sofa_oggi", "https://api.sofascore.com/api/v1/sport/football/scheduled-events/" + d);
        let sid = null; try { const e = (JSON.parse(sb).events || []).find((q) => q.status && q.status.type === "finished") || (JSON.parse(sb).events || [])[0]; sid = e && e.id; out.sofa_evento = e && (e.homeTeam.name + " - " + e.awayTeam.name); } catch (e) {}
        if (sid) { await tryf("sofa_shotmap", "https://api.sofascore.com/api/v1/event/" + sid + "/shotmap"); }
        await tryf("fotmob_giorno", "https://www.fotmob.com/api/matches?date=" + d.replace(/-/g, ""));
        let eid = null, elg = "ita.1";
        for (const lg of ["ita.1", "eng.1", "esp.1", "ger.1", "fra.1", "uefa.champions"]) {
          try { const j = await espn("/" + lg + "/scoreboard"); const e = (j.events || []).find((q) => q.status.type.state !== "pre"); if (e) { eid = e.id; elg = lg; break; } } catch (e) {}
        }
        if (eid) { out.espn_evento = elg + " " + eid; await tryf("espn_summary", BASE + "/" + elg + "/summary?event=" + eid); await tryf("espn_plays", "https://site.api.espn.com/apis/site/v2/sports/soccer/" + elg + "/summary?event=" + eid + "&enable=plays"); await tryf("espn_core_plays", "https://sports.core.api.espn.com/v2/sports/soccer/leagues/" + elg + "/events/" + eid + "/competitions/" + eid + "/plays?limit=300"); }
        return new Response(JSON.stringify(out, null, 1), { headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
      }
      if (u.pathname === "/t") {
        const lg = u.searchParams.get("lg");
        if (!CUPS.includes(lg)) return new Response("{}", { status: 400, headers: cors(req) });
        const r = await fetch("https://site.api.espn.com/apis/v2/sports/soccer/" + lg + "/standings", { headers: { "User-Agent": "Mozilla/5.0" }, cf: { cacheTtl: 600, cacheEverything: true } });
        if (!r.ok) throw new Error("ESPN " + r.status);
        const j = await r.json();
        const st = (e, n) => { const x = (e.stats || []).find((q) => q.name === n); return x ? x.value : null; };
        const groups = (j.children && j.children.length ? j.children : [j]).map((c) => ({
          n: c.name || c.abbreviation || "",
          rows: (((c.standings || {}).entries) || []).map((e) => ({
            t: e.team && (e.team.displayName || e.team.name), id: e.team && e.team.id, l: e.team && e.team.logos && e.team.logos[0] && e.team.logos[0].href,
            rk: st(e, "rank"), p: st(e, "gamesPlayed"), w: st(e, "wins"), d: st(e, "ties"), s: st(e, "losses"),
            gf: st(e, "pointsFor"), ga: st(e, "pointsAgainst"), gd: st(e, "pointDifferential"), pt: st(e, "points"),
          })).sort((a, b) => (a.rk || 99) - (b.rk || 99)),
        }));
        return new Response(JSON.stringify({ t: Date.now(), groups }), { headers: cors(req, { "Cache-Control": "public, max-age=600" }) });
      }
      return new Response("{}", { status: 404, headers: cors(req) });
    } catch (e) {
      return new Response(JSON.stringify({ errore: String(e).slice(0, 120) }), { status: 502, headers: cors(req) });
    }
  },
};
