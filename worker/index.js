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
      return new Response("{}", { status: 404, headers: cors(req) });
    } catch (e) {
      return new Response(JSON.stringify({ errore: String(e).slice(0, 120) }), { status: 502, headers: cors(req) });
    }
  },
};
