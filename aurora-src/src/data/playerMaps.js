// Mappe del campo di un giocatore: tiri, tiri in porta, falli commessi e subiti, per competizione e stagione.
// Tiri: `sx` delle partite (`partite.py`, stesso formato del worker `/sh` + id giocatore in coda), poi `mapShots` come nella pagina partita.
// Falli: coppie `p` di ESPN [chi commette, chi subisce, X, Y, minuto]; X/Y dal punto di vista di chi subisce (X=0 sulla sua porta, X=100 su quella che attacca, 0-100;
// Y alto = fascia destra). Tutto e' riportato in coordinate campo (x 0-105 verso la porta attaccata dal giocatore, y 0-68 dall'alto).
import { useEffect, useState } from 'react';
import { loadSeasonMatches, loadSeason, loadFalliFile, loadSxeFile, currentSeason, pastSeasons } from './archive';
import { mapShots } from './fotmob';
import { teamByFm } from './teams';
import { WORKER } from './load';
import { lruGet, lruSet } from '@/lib/lru';

export const SX_FROM = 2019; // le posizioni dei tiri si scaricano dalle stagioni 2019-20
const CACHE = new Map();
const nm = (x) => String(x || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const sameName = (a, b) => { const x = nm(a); const y = nm(b); return !!x && !!y && (x === y || x.includes(y) || y.includes(x)); };

// stagioni di una competizione con dati (la piu' recente per prima)
export async function mapSeasons(fm) {
  const cur = await currentSeason(fm);
  if (!cur) return [];
  return [cur, ...(await pastSeasons(fm))].filter((s) => Number(String(s).slice(0, 4)) >= SX_FROM);
}

// righe del worker `/fs` -> stesso formato di `sx` (id giocatore in coda), solo i tiri di `pid` (riconosciuto per nome)
function fsToSx(j, who, pid) {
  const rows = ((j && j.sh) || []).filter((x) => !x[17] && x[4] != null && x[5] != null).map((x) => [...x.slice(0, 3), x[3], ...x.slice(4, 19), (sameName(x[3], who) ? pid : null)]);
  rows.forEach((x) => { if (x[19] != null) x[3] = pid; });
  return rows;
}

const teamInfo = (fid, names) => {
  const t = teamByFm(fid);
  return { fid: Number(fid), name: (t && t.name) || (names && names[fid]) || '', colors: t && t.colors ? t.colors : null };
};

async function loadOne(pid, fm, sk, name) {
  const ck = `${pid}|${fm}|${sk}`;
  const hit = lruGet(CACHE, ck);
  if (hit) return hit;
  const run = (async () => {
    const [d, fl, arch, ex] = await Promise.all([
      loadSeasonMatches(fm, sk).catch(() => null),
      loadFalliFile(fm, sk).catch(() => null),
      loadSeason(fm, sk).catch(() => null),
      loadSxeFile(fm, sk).catch(() => null),
    ]);
    const ms = (d && d.m) || {};
    const when = {};
    ((arch && arch.fix) || []).forEach((r) => { when[String(r[0])] = r[4]; });
    const names = (arch && arch.teams) || {};
    const shots = [];
    const fouls = [];
    // stagione in corso: le partite non ancora passate nell'archivio (`sx` assente) si prendono dalla partita stessa (stesso formato)
    if ((await currentSeason(fm)) === sk) {
      const inLu = (m) => [...((m.h && m.h.st) || []), ...((m.h && m.h.sb) || []), ...((m.a && m.a.st) || []), ...((m.a && m.a.sb) || [])].find((p) => String(p[0]) === String(pid));
      await Promise.all(Object.entries(ms).filter(([, m]) => m && !Array.isArray(m.sx) && inLu(m)).map(async ([mid, m]) => {
        try {
          const r = await fetch(`${WORKER}/fs?id=${mid}`);
          const j = r.ok ? await r.json() : null;
          m.sx = fsToSx(j, inLu(m)[1] || name, pid);
        } catch (e) { /* la partita resta senza tiri */ }
      }));
    }
    // dove FotMob non ha la mappa tiri della partita (sx vuota) si vedono i tiri di ESPN (`sxe/`, `tiri_espn.py`): la seconda fonte prende il posto della prima solo quando la prima non arriva
    const espn = (mid) => (ex && Array.isArray(ex[mid]) && ex[mid].length ? ex[mid] : null);
    Object.entries(ms).forEach(([mid, m]) => { if (m && !(Array.isArray(m.sx) && m.sx.length) && espn(mid)) { m.sx = espn(mid); m.sxE = true; } });
    const sidesOf = (m) => {
      const hs = [...((m.h && m.h.st) || []), ...((m.h && m.h.sb) || [])];
      const as = [...((m.a && m.a.st) || []), ...((m.a && m.a.sb) || [])];
      return { h: hs, a: as };
    };
    const base = (mid, m, ownId) => {
      const hid = m.h && m.h.id; const aid = m.a && m.a.id;
      const oppId = ownId === hid ? aid : ownId === aid ? hid : null;
      return { mid, fm, sk, ts: when[mid] || null, home: ownId === hid, own: ownId ? teamInfo(ownId, names) : null, opp: oppId ? teamInfo(oppId, names) : null };
    };
    Object.entries(ms).forEach(([mid, m]) => {
      if (!m || !Array.isArray(m.sx)) return;
      const mine = m.sx.filter((r) => String(r[19]) === String(pid));
      if (!mine.length) return;
      const own = mine[0][2];
      const meta = base(mid, m, own);
      mapShots(mine, null).forEach((s) => { if (s.px != null && s.py != null) shots.push({ ...s, playerName: name || s.playerName, ...meta, ...(m.sxE ? { src: 'e' } : {}) }); });
    });
    // partite giocate (almeno 50', in formazione) = quelle dell'Hit Rate; `nosx` = di queste, le partite senza posizioni dei tiri nell'archivio
    // (stagioni passate non ancora scaricate): per le ultime 5 i tiri si prendono dalla partita stessa, cosi' mappa e grafico coincidono
    const played = [];
    const nosx = [];
    Object.entries(ms).forEach(([mid, m]) => {
      const pl = m && m.p && m.p[pid];
      if (!pl || !(pl.minutes_played >= 50)) return;
      const sd = sidesOf(m);
      const inH = sd.h.some((r) => String(r[0]) === String(pid));
      const inA = sd.a.some((r) => String(r[0]) === String(pid));
      if (!inH && !inA) return;
      const ownId = inH ? m.h.id : m.a.id;
      played.push({ mid, ts: when[mid] || null });
      if (!Array.isArray(m.sx) && Number(pl.total_shots) > 0) {
        let run = null;
        const who = (sd.h.concat(sd.a).find((r) => String(r[0]) === String(pid)) || [])[1] || name;
        nosx.push({ mid, ts: when[mid] || null, fill: () => {
          if (!run) {
            run = fetch(`${WORKER}/fs?id=${mid}`).then((r) => (r.ok ? r.json() : null)).then((j) => {
              let mine = fsToSx(j, who, pid).filter((x) => String(x[19]) === String(pid));
              const fromE = !mine.length && espn(mid); // FotMob senza tiri per questa partita: ESPN
              if (fromE) mine = fromE.filter((x) => String(x[19]) === String(pid));
              const meta = base(mid, m, mine.length ? mine[0][2] : ownId);
              return mapShots(mine, null).filter((x) => x.px != null && x.py != null).map((x) => ({ ...x, playerName: name || x.playerName, ...meta, ...(fromE ? { src: 'e' } : {}) }));
            }).catch(() => []);
          }
          return run;
        } });
      }
    });
    Object.entries(fl || {}).forEach(([mid, v]) => {
      const m = ms[mid];
      ((v && v.p) || []).forEach((r) => {
        if (r.length < 4) return;
        const f = String(r[0]) === String(pid); const s = String(r[1]) === String(pid);
        if (!f && !s) return;
        if (!m) return;
        const sd = sidesOf(m);
        const side = (id) => (sd.h.some((p) => String(p[0]) === String(id)) ? 'h' : sd.a.some((p) => String(p[0]) === String(id)) ? 'a' : null);
        const me = side(pid);
        if (!me) return;
        const otherId = f ? r[1] : r[0];
        const oside = side(otherId);
        const op = (oside === 'h' ? sd.h : sd.a).find((p) => String(p[0]) === String(otherId));
        const ownId = me === 'h' ? m.h.id : m.a.id;
        // ESPN ha cambiato sistema di coordinate dal 1 giugno 2026 (verificato sui ruoli: attaccanti subiscono falli vicino alla porta che attaccano, terzini destri a destra):
        // fino al 31 maggio X alta = verso la porta che attacca chi SUBISCE e Y bassa = destra di chi subisce (si specchia Y);
        // dal 1 giugno il campo e' dal punto di vista di chi COMMETTE (si girano X e Y rispetto a chi subisce, che poi vale come prima). Qui tutto torna al sistema dell'app:
        // X alta = porta che attacca chi subisce, Y alta = sua destra; subiti = (X, Y), commessi = campo girato di 180 gradi (anche lui attacca a destra).
        const A = (when[mid] || '') >= '2026-06-01';
        const X = A ? 100 - r[2] : r[2]; const Y = A ? r[3] : 100 - r[3];
        const e = { ...base(mid, m, ownId), min: r[4] || 0, other: { id: otherId, name: op ? op[1] : '' },
          oppTeam: oside ? teamInfo(oside === 'h' ? m.h.id : m.a.id, names) : null,
          // ESPN: X=0 sulla porta di chi subisce, X=100 su quella che attacca (verificato sui ruoli: attaccanti fermati ad X alta, difensori bassa).
          // Chi subisce: campo dal suo punto di vista (attacca verso destra, x = X). Chi commette: dal suo, cioe' il campo girato di 180 gradi
          // (anche lui attacca verso destra): cosi' tutte e 4 le mappe sono orientate come se la squadra del giocatore attaccasse sempre a destra.
          px: f ? 105 - X * 1.05 : X * 1.05, py: f ? (100 - Y) * 0.68 : Y * 0.68 };
        (f ? fouls : fouls).push({ ...e, kind: f ? 'fc' : 'fs' });
      });
    });
    return { shots, fouls, played, nosx };
  })().catch(() => ({ shots: [], fouls: [], played: [], nosx: [] }));
  lruSet(CACHE, ck, run, 60);
  return run;
}

// "Stagione attuale" = partite da agosto in poi (1 agosto dell'anno in corso, o dell'anno scorso se siamo prima di agosto); "precedente" = l'agosto prima.
// Vale per ogni competizione (anche le nazionali, la cui "stagione" nell'archivio puo' essere un'edizione vecchia) e per tutte e 4 le mappe.
const seasonStart = (now = new Date()) => { const y = now.getUTCFullYear() - (now.getUTCMonth() < 7 ? 1 : 0); return Date.UTC(y, 7, 1); };
const inRange = (ts, a, b) => { const t = ts ? Date.parse(ts) : NaN; return !Number.isNaN(t) && t >= a && t < b; };

// unione di piu' competizioni/stagioni
export async function loadPlayerMaps({ pid, name, fms, seasonSel }) {
  const jobs = [];
  const start = seasonStart();
  const prevStart = Date.UTC(new Date(start).getUTCFullYear() - 1, 7, 1);
  for (const fm of fms) {
    let ss;
    if (seasonSel === 'all') ss = await mapSeasons(fm);
    else if (seasonSel === 'l5') ss = (await mapSeasons(fm)).slice(0, 2); // come il grafico Hit Rate: stagione in corso, poi la passata
    else if (/^y\d{4}$/.test(String(seasonSel))) {
      // stagione "AAAA/BB" = dal 1 agosto AAAA al 31 luglio dopo, per ogni competizione: le stagioni AAAA-BBBB di quell'anno e quelle a anno solare (AAAA e AAAA+1) che la coprono
      const y = Number(String(seasonSel).slice(1));
      ss = (await mapSeasons(fm)).filter((sk) => { const a = Number(String(sk).slice(0, 4)); return /^\d{4}-\d{4}$/.test(String(sk)) ? a === y : a === y || a === y + 1; });
    } else if (seasonSel === 'prev' || seasonSel === 'cur') {
      // solo le stagioni che possono contenere partite del periodo (una stagione AAAA-BBBB va da agosto AAAA a giugno BBBB): la piu' recente c'e' sempre
      // (edizioni vecchie delle nazionali), le altre solo se iniziano nell'anno giusto; prima si caricavano sempre 3 stagioni per ogni competizione
      const from = new Date(seasonSel === 'cur' ? start : prevStart).getUTCFullYear();
      ss = (await mapSeasons(fm)).filter((sk, i) => i === 0 || Number(String(sk).slice(0, 4)) >= from);
    } else ss = [seasonSel];
    ss.forEach((sk) => jobs.push(loadOne(pid, fm, sk, name)));
  }
  const rs = await Promise.all(jobs);
  const shots = []; const fouls = [];
  if (seasonSel === 'l5') {
    // le ultime 5 partite (almeno 50') del giocatore nelle competizioni scelte: le stesse colonne del grafico Hit Rate
    const by0 = (a, b) => String(b.ts || '').localeCompare(String(a.ts || ''));
    const last = rs.flatMap((r) => r.played).sort(by0).slice(0, 5);
    const set = new Set(last.map((x) => x.mid));
    const extra = await Promise.all(rs.flatMap((r) => r.nosx).filter((x) => set.has(x.mid)).map((x) => x.fill()));
    rs.forEach((r) => { shots.push(...r.shots.filter((e) => set.has(e.mid))); fouls.push(...r.fouls.filter((e) => set.has(e.mid))); });
    extra.forEach((l) => shots.push(...l));
    const by = (a, b) => String(b.ts || '').localeCompare(String(a.ts || ''));
    return { shots: shots.sort(by), fouls: fouls.sort(by) };
  }
  const ySel = /^y\d{4}$/.test(String(seasonSel)) ? Number(String(seasonSel).slice(1)) : null;
  const keep = seasonSel === 'cur' ? (e) => inRange(e.ts, start, Infinity) : seasonSel === 'prev' ? (e) => inRange(e.ts, prevStart, start)
    : ySel ? (e) => inRange(e.ts, Date.UTC(ySel, 7, 1), Date.UTC(ySel + 1, 7, 1)) : () => true;
  rs.forEach((r) => { shots.push(...r.shots.filter(keep)); fouls.push(...r.fouls.filter(keep)); });
  // una stagione passata scelta a mano, non ancora scaricata nell'archivio: i tiri delle sue partite si prendono dalle partite stesse (tutte insieme, al massimo 60)
  if (seasonSel !== 'all' && seasonSel !== 'cur' && seasonSel !== 'prev') {
    // tutte insieme (prima 6 alla volta: 10-15 s per una stagione); ogni risposta resta in memoria, la seconda volta e' istantaneo
    const need = rs.flatMap((r) => r.nosx).filter((x) => keep({ ts: x.ts })).slice(0, 60);
    (await Promise.all(need.map((x) => x.fill()))).forEach((l) => shots.push(...l.filter(keep)));
  }
  const by = (a, b) => String(b.ts || '').localeCompare(String(a.ts || ''));
  return { shots: shots.sort(by), fouls: fouls.sort(by) };
}

// pre-carica le mappe della stagione attuale (tutte le competizioni) appena si apre la scheda giocatore: aprendo Statistiche i dati sono gia' in cache
export function warmPlayerMaps({ pid, name, fms }) {
  if (!pid || !fms || !fms.length) return;
  loadPlayerMaps({ pid, name, fms, seasonSel: 'cur' }).catch(() => {});
}

export function usePlayerMaps(args) {
  const sig = args ? `${args.pid}|${args.fms.join(',')}|${args.seasonSel}` : '';
  const [v, setV] = useState(undefined);
  useEffect(() => {
    if (!args || !args.pid || !args.fms.length) { setV(null); return undefined; }
    let on = true;
    setV(undefined);
    loadPlayerMaps(args).then((r) => { if (on) setV(r); }).catch(() => { if (on) setV(null); });
    return () => { on = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);
  return v;
}
