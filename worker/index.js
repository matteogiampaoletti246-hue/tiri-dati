// ScalperLab - ponte Live (Cloudflare Worker). Legge ESPN e lo restituisce al sito con una cache di pochi secondi.
const ORIGIN = "https://matteogiampaoletti246-hue.github.io";
const BASE = "https://site.api.espn.com/apis/site/v2/sports/soccer";
const DOM = ["ita.1", "eng.1", "esp.1", "ger.1", "fra.1"];
const CUPS = ["uefa.champions", "uefa.europa", "uefa.europa.conf", "uefa.nations", "fifa.friendly"];
const LEGHE = DOM.concat(CUPS);
const TTL = 8;
const FMH = { "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile Safari/604.1", "Accept": "application/json,*/*", "Accept-Language": "en-US,en;q=0.9" };

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
  async fetch(req) {
    if (req.method === "OPTIONS") return new Response(null, { headers: { ...cors(req), "Access-Control-Allow-Methods": "GET", "Access-Control-Max-Age": "86400" } });
    const u = new URL(req.url);
    try {
      if (u.pathname === "/s") {
        const all = await Promise.all(LEGHE.map((lg) => espn("/" + lg + "/scoreboard").then((j) => scoreboard(j, lg)).catch(() => [])));
        return new Response(JSON.stringify({ t: Date.now(), ev: all.flat() }), { headers: cors(req) });
      }
      if (u.pathname === "/d") {
        const dt = u.searchParams.get("date");
        if (!/^\d{8}$/.test(dt || "")) return new Response("{}", { status: 400, headers: cors(req) });
        const old = dt < new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10).replace(/-/g, "");
        const all = await Promise.all(CUPS.map((lg) => espn("/" + lg + "/scoreboard?dates=" + dt, old ? 3600 : 60).then((j) => scoreboard(j, lg)).catch(() => [])));
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
      if (u.pathname === "/fx") {
        const id = u.searchParams.get("id");
        if (!/^\d{5,10}$/.test(id || "")) return new Response("{}", { status: 400, headers: cors(req) });
        const r = await fetch("https://www.fotmob.com/api/data/matchDetails?matchId=" + id, { headers: FMH, cf: { cacheTtl: 5, cacheEverything: true } });
        if (!r.ok) throw new Error("FotMob " + r.status);
        const j = await r.json(), c = j.content || {}, lu = c.lineup || {}, rf = c.matchFacts && c.matchFacts.infoBox && c.matchFacts.infoBox.Referee;
        const ph = (pid) => pid ? "https://images.fotmob.com/image_resources/playerimages/" + pid + ".png" : null;
        const team = (t) => {
          if (!t || !(t.starters || []).length) return null;
          const mp = (p) => [p.name, p.shirtNumber != null ? +p.shirtNumber || p.shirtNumber : null, p.horizontalLayout ? p.horizontalLayout.x : null, p.horizontalLayout ? p.horizontalLayout.y : null, !!p.isCaptain, ph(p.id), p.performance && p.performance.rating ? p.performance.rating : null, p.id];
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
        return new Response(JSON.stringify({ t: Date.now(), ty: lu.lineupType || null, started: !!g2.started, fin: !!g2.finished, st: live, sc: tm.length > 1 ? [tm[0].score, tm[1].score] : null, clk: clean(lt.short), ht, ev, stats, pl, h: team(lu.homeTeam), a: team(lu.awayTeam), ref }), { headers: cors(req, { "Cache-Control": "public, max-age=5" }) });
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
        const r = await fetch("https://www.fotmob.com/api/data/matches?date=" + dt + "&timezone=Europe%2FRome&ccode3=ITA", { headers: FMH, cf: { cacheTtl: 8, cacheEverything: true } });
        if (!r.ok) throw new Error("FotMob " + r.status);
        const j = await r.json(), OK = [47, 54, 87, 53, 55, 42, 73, 10216];
        const m = [];
        (j.leagues || []).forEach((l) => { if (!OK.includes(l.primaryId || l.id)) return; (l.matches || []).forEach((x) => m.push({ id: x.id, l: l.primaryId || l.id, h: x.home && x.home.name, a: x.away && x.away.name, hi: x.home && x.home.id, ai: x.away && x.away.id, t: x.status && x.status.utcTime, f: !!(x.status && x.status.finished), s: !!(x.status && x.status.started), sc: x.status && x.status.scoreStr || null, lt: x.status && x.status.liveTime ? String(x.status.liveTime.short || "").replace(/[\u200e\u200f]/g, "") : null })); });
        return new Response(JSON.stringify({ t: Date.now(), m }), { headers: cors(req, { "Cache-Control": "public, max-age=8" }) });
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
