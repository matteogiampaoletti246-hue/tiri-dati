// ScalperLab - ponte Live (Cloudflare Worker). Legge ESPN e lo restituisce al sito con una cache di pochi secondi.
const ORIGIN = "https://matteogiampaoletti246-hue.github.io";
const BASE = "https://site.api.espn.com/apis/site/v2/sports/soccer";
const DOM = ["ita.1", "eng.1", "esp.1", "ger.1", "fra.1"];
const CUPS = ["uefa.champions", "uefa.europa", "uefa.europa.conf", "uefa.nations", "fifa.friendly"];
const LEGHE = DOM.concat(CUPS);
const TTL = 15;

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
      if (u.pathname === "/m") {
        const lg = u.searchParams.get("lg"), id = u.searchParams.get("id");
        if (!LEGHE.includes(lg) || !/^\d{5,12}$/.test(id || "")) return new Response("{}", { status: 400, headers: cors(req) });
        const j = await espn("/" + lg + "/summary?event=" + id);
        return new Response(JSON.stringify({ t: Date.now(), ...summary(j) }), { headers: cors(req) });
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
