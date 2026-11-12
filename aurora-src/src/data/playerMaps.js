// Mappe del campo di un giocatore: tiri, tiri in porta, falli commessi e subiti, per competizione e stagione.
// Tiri: `sx` delle partite (`partite.py`, stesso formato del worker `/sh` + id giocatore in coda), poi `mapShots` come nella pagina partita.
// Falli: coppie `p` di ESPN [chi commette, chi subisce, X, Y, minuto]; X/Y dal punto di vista di chi subisce (X=0 sulla porta che attacca, 0-100;
// Y alto = fascia destra). Tutto e' riportato in coordinate campo (x 0-105 verso la porta attaccata dal giocatore, y 0-68 dall'alto).
import { useEffect, useState } from 'react';
import { loadSeasonMatches, loadSeason, loadFalliFile, currentSeason, pastSeasons } from './archive';
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

const teamInfo = (fid, names) => {
  const t = teamByFm(fid);
  return { fid: Number(fid), name: (t && t.name) || (names && names[fid]) || '', colors: t && t.colors ? t.colors : null };
};

async function loadOne(pid, fm, sk, name) {
  const ck = `${pid}|${fm}|${sk}`;
  const hit = lruGet(CACHE, ck);
  if (hit) return hit;
  const run = (async () => {
    const [d, fl, arch] = await Promise.all([
      loadSeasonMatches(fm, sk).catch(() => null),
      loadFalliFile(fm, sk).catch(() => null),
      loadSeason(fm, sk).catch(() => null),
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
          const who = inLu(m)[1] || name;
          m.sx = ((j && j.sh) || []).filter((x) => !x[17] && x[4] != null && x[5] != null).map((x) => [...x.slice(0, 3), x[3], ...x.slice(4, 19), (sameName(x[3], who) ? pid : null)]);
          m.sx.forEach((x) => { if (x[19] != null) x[3] = pid; });
        } catch (e) { /* la partita resta senza tiri */ }
      }));
    }
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
      mapShots(mine, null).forEach((s) => { if (s.px != null && s.py != null) shots.push({ ...s, playerName: name || s.playerName, ...meta }); });
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
        const X = r[2]; const Y = r[3];
        const e = { ...base(mid, m, ownId), min: r[4] || 0, other: { id: otherId, name: op ? op[1] : '' },
          oppTeam: oside ? teamInfo(oside === 'h' ? m.h.id : m.a.id, names) : null,
          // chi subisce: campo dal suo punto di vista (attacca verso destra); chi commette: dal suo, cioe' il campo girato
          px: f ? X * 1.05 : 105 - X * 1.05, py: f ? (100 - Y) * 0.68 : Y * 0.68 };
        (f ? fouls : fouls).push({ ...e, kind: f ? 'fc' : 'fs' });
      });
    });
    return { shots, fouls };
  })().catch(() => ({ shots: [], fouls: [] }));
  lruSet(CACHE, ck, run, 60);
  return run;
}

// unione di piu' competizioni/stagioni
export async function loadPlayerMaps({ pid, name, fms, seasonSel }) {
  const jobs = [];
  for (const fm of fms) {
    let ss;
    if (seasonSel === 'all') ss = await mapSeasons(fm);
    else if (seasonSel === 'prev') { const l = await mapSeasons(fm); ss = l.slice(1, 2); } else if (seasonSel === 'cur') { const l = await mapSeasons(fm); ss = l.slice(0, 1); } else ss = [seasonSel];
    ss.forEach((sk) => jobs.push(loadOne(pid, fm, sk, name)));
  }
  const rs = await Promise.all(jobs);
  const shots = []; const fouls = [];
  rs.forEach((r) => { shots.push(...r.shots); fouls.push(...r.fouls); });
  const by = (a, b) => String(b.ts || '').localeCompare(String(a.ts || ''));
  return { shots: shots.sort(by), fouls: fouls.sort(by) };
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
