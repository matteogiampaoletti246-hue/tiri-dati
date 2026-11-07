// ScalperLab - ponte Live (Cloudflare Worker). Legge ESPN e lo restituisce al sito con una cache di pochi secondi.
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
function fmFill(t, fm) {
  if (!fm) return t;
  const byNum = {};
  [...(fm.s || []), ...(fm.b || [])].forEach((p) => { if (p[1] != null) byNum[String(p[1])] = p; });
  const fix = (p) => { const f = p[1] != null ? byNum[String(p[1])] : null; return f ? [f[0], p[1], p[2], p[3], f[4], f[5], f[6], f[7], f[8]] : p; };
  return { f: t.f, s: t.s.map(fix), b: (t.b || []).map(fix), co: fm.co || t.co };
}

// ---- Formazioni da ESPN dove FotMob non le ha (verificato il 07/11/2026: ESPN da' modulo, titolari con ruolo e lato, panchina).
// Competizioni FotMob -> ESPN controllate una per una; si aggiungono solo dopo aver visto le formazioni vere.
const ESPN_LU = { 9682: "concacaf.central.american.cup", 137: "sco.tennents", 179: "sco.challenge", 9906: "mex.w.1" };
// profondita' dal ruolo ESPN (G, CD-L, LB, DM, CM, LM, AM, F, CF-R...), lato da L/R: stesse coordinate 0-1 di FotMob
function espnXY(ab) {
  const a = String(ab || "").toUpperCase();
  const core = a.replace(/-(L|R)$/, "");
  const x = core === "G" ? 0.05 : /^(CD|CB|LB|RB|SW|D)$/.test(core) ? 0.25 : /^(LWB|RWB|WB)$/.test(core) ? 0.32 : /^(DM|LDM|RDM)$/.test(core) ? 0.42 : /^(CM|LM|RM|M)$/.test(core) ? 0.55 : /^(AM|LAM|RAM|CAM)$/.test(core) ? 0.68 : 0.85;
  const y = /-L$/.test(a) ? 0.35 : /-R$/.test(a) ? 0.65 : /^L/.test(core) ? 0.12 : /^R/.test(core) ? 0.88 : 0.5;
  return [x, y];
}
async function espnLineups(out, g2) {
  try {
    const lg = ESPN_LU[g2.parentLeagueId] || ESPN_LU[g2.leagueId];
    const when = g2.matchTimeUTCDate ? new Date(g2.matchTimeUTCDate) : null;
    if (!lg || !when || isNaN(when.getTime())) return;
    const E = "https://site.api.espn.com/apis/site/v2/sports/soccer/" + lg + "/";
    const get = async (u, ttl) => {
      const ctl = new AbortController();
      const t = setTimeout(() => ctl.abort(), 4000);
      try { const r = await fetch(u, { signal: ctl.signal, cf: { cacheTtl: ttl, cacheEverything: true } }); return r.ok ? await r.json() : null; } catch (e) { return null; } finally { clearTimeout(t); }
    };
    // ESPN raggruppa le partite per giorno americano: una gara alle 02:00 UTC sta nel giorno prima
    const day = (d) => d.toISOString().slice(0, 10).replace(/-/g, "");
    const sbs = await Promise.all([day(when), day(new Date(when.getTime() - 86400000))].map((d) => get(E + "scoreboard?dates=" + d, 60)));
    const hn = g2.homeTeam && g2.homeTeam.name, an = g2.awayTeam && g2.awayTeam.name;
    const ev = sbs.flatMap((sb) => (sb && sb.events) || []).find((e) => {
      if (Math.abs(new Date(e.date).getTime() - when.getTime()) > 6 * 3600000) return false;
      const c = ((e.competitions || [])[0] || {}).competitors || [];
      const H = c.find((q) => q.homeAway === "home"), A = c.find((q) => q.homeAway === "away");
      return H && A && uSame(H.team && H.team.displayName, hn) && uSame(A.team && A.team.displayName, an);
    });
    if (!ev) return;
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

// ---- Formazioni da LiveScore dove FotMob ed ESPN non le hanno. Solo il formato completo: modulo (Fo, es. [4,4,2]) e posto in campo di
// ogni titolare (Fp "riga:colonna", riga 1 = portiere). Verificato il 07/11/2026 su 23 partite contro FotMob: modulo uguale 39 volte su 46,
// colonne numerate da destra a sinistra (108 file su 131), quindi y = 1 - colonna/(n+1). Senza Fo/Fp (solo nomi) nessun campo: mai posti inventati.
async function lsLineups(out, startIso) {
  try {
    if (!out.hi || !out.ai) return;
    const d = startIso ? new Date(startIso) : null;
    if (!d || isNaN(d.getTime())) return;
    const ymd = d.toISOString().slice(0, 10).replace(/-/g, "");
    const day = await lsGet(LSB + "date/soccer/" + ymd + "/1?countryCode=GB&locale=en&MD=1", 60);
    let eid = null;
    for (const st of (day && day.Stages) || []) {
      for (const x of st.Events || []) {
        const a = ((x.T1 || [{}])[0].Img || "").match(/enet\/(\d+)\.png/), b = ((x.T2 || [{}])[0].Img || "").match(/enet\/(\d+)\.png/);
        if (a && b && +a[1] === +out.hi && +b[1] === +out.ai) { eid = x.Eid; break; }
      }
      if (eid) break;
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
    const h = side(1), a = side(2);
    if (h && a) { out.h = h; out.a = a; out.luSrc = "livescore"; if (!out.ty) out.ty = "standard"; return; }
    const hl = names(1), al = names(2);
    if (hl && al) { out.h = hl; out.a = al; out.luSrc = "livescore"; out.luList = 1; if (!out.ty) out.ty = "standard"; }
  } catch (e) { /* mai rompere /fx */ }
}

// Formazione a soli nomi: portiere e numeri di maglia dalla rosa della squadra (rosa/ sul sito, dati FotMob/fonti gia' verificati).
// Portiere segnato (p[8] = 0) solo se tra gli 11 ce n'e' esattamente uno con ruolo GK; numero solo se la fonte non lo da'. Mai indovinati.
const SITE = "https://matteogiampaoletti246-hue.github.io/tiri-dati/";
const nKey = (s) => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z ]/g, " ").split(/\s+/).filter(Boolean);
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
  async fetch(req, env) {
    if (req.method === "OPTIONS") return new Response(null, { headers: { ...cors(req), "Access-Control-Allow-Methods": "GET", "Access-Control-Max-Age": "86400" } });
    const u = new URL(req.url);
    try {
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
        let ev = mf.filter((e) => ["Goal", "Card", "Substitution"].includes(e.type)).map((e) => {
          const add = e.overloadTime || 0;
          const o = { ty: e.type, t: e.time, a: add, h: !!e.isHome, ts: e.time * 100 + add };
          if (e.type === "Goal") { Object.assign(o, { n: e.player && e.player.name || e.nameStr, id: e.player && e.player.id || e.playerId, as: e.assistInput || null, aid: e.assistPlayerId || null, og: !!e.ownGoal, pen: /pen/i.test(e.goalDescription || "") || /pen/i.test(e.goalDescriptionKey || ""), sc: e.newScore || null }); }
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
        // indisponibili di FotMob (infortunati, squalificati...): a parte, valgono qualunque sia la fonte del campo. [nome, id, tipo, rientro]
        const una = (t) => ((t && t.unavailable) || []).filter((p) => p && p.name).map((p) => [p.name, p.id || null, (p.unavailability && p.unavailability.type) || null, (p.unavailability && p.unavailability.expectedReturn) || null]);
        out.hu = una(lu.homeTeam); out.au = una(lu.awayTeam);
        // FotMob senza formazioni o con la sola versione "simple" (ruoli, niente posti in campo): ESPN, poi LiveScore; se una delle due
        // ha il campo completo prende il posto di FotMob, tenendo di FotMob nome, foto, voto e id (stesso numero di maglia)
        const noXY = (t) => !t || (t.s || []).some((p) => p[2] == null);
        if (noXY(out.h) || noXY(out.a)) {
          const fmH = out.h, fmA = out.a;
          const alt = { hi: out.hi, ai: out.ai };
          await espnLineups(alt, g2);
          if (!alt.h) await lsLineups(alt, g2.matchTimeUTCDate || stt.utcTime);
          if (alt.h && alt.a && !alt.luList) {
            out.h = fmFill(alt.h, fmH); out.a = fmFill(alt.a, fmA); out.luSrc = alt.luSrc;
            if (!out.ty || out.ty === "unavailable") out.ty = alt.ty;
          } else if (alt.h && alt.a && !fmH && !fmA) {
            // soli nomi ufficiali (nessuna fonte con i posti in campo): elenco in colonna
            [out.h, out.a] = await Promise.all([rosaMark(alt.h, out.hi), rosaMark(alt.a, out.ai)]);
            out.luSrc = alt.luSrc; out.luList = 1;
            if (!out.ty || out.ty === "unavailable") out.ty = alt.ty;
          }
        }
        await lsMerge(out, g2.matchTimeUTCDate || stt.utcTime);
        return new Response(JSON.stringify(out), { headers: cors(req, { "Cache-Control": "public, max-age=3" }) });
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
        (j.leagues || []).forEach((l) => { if (!OK.includes(l.primaryId || l.id)) return; (l.matches || []).forEach((x) => m.push({ id: x.id, l: l.primaryId || l.id, h: x.home && x.home.name, a: x.away && x.away.name, hi: x.home && x.home.id, ai: x.away && x.away.id, t: x.status && x.status.utcTime, f: !!(x.status && x.status.finished), s: !!(x.status && x.status.started), sc: x.status && x.status.scoreStr || null, lt: x.status && x.status.liveTime ? String(x.status.liveTime.short || "").replace(/[\u200e\u200f]/g, "") : null })); });
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
