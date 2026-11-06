// Classifica sempre fresca e classifica live (regola fissa, ogni competizione): la classifica viene da FotMob (worker `/lt`, ogni 5 s se in
// quella competizione c'e' una partita in corso, altrimenti ogni minuto) e sopra si applicano le partite live col risultato provvisorio:
// 3 punti a chi vince, 1 a chi pareggia, 0 a chi perde; se il risultato cambia i punti cambiano. Righe live: `lv` = {us, them, min, mid, home}.
import { useEffect, useState } from 'react';
import { WORKER } from './load';

const CACHE = new Map(); // fm -> { data, at }
const SUBS = new Map();  // fm -> Set(callback)
const TIMER = new Map(); // fm -> id
const BUSY = new Set();

const pull = async (fm) => {
  if (BUSY.has(fm)) return;
  BUSY.add(fm);
  try {
    const r = await fetch(`${WORKER}/lt?id=${fm}`, { cache: 'no-store' });
    const d = r.ok ? await r.json() : null;
    if (d && Array.isArray(d.groups)) {
      CACHE.set(fm, { data: d, at: Date.now() });
      (SUBS.get(fm) || new Set()).forEach((cb) => cb(d));
    }
  } catch (e) { /* senza rete resta la classifica dell'archivio */ } finally { BUSY.delete(fm); }
};
const tick = (fm) => {
  pull(fm).finally(() => {
    if (!(SUBS.get(fm) || new Set()).size) { TIMER.delete(fm); return; }
    const c = CACHE.get(fm);
    const live = c && c.data.live && c.data.live.length;
    TIMER.set(fm, setTimeout(() => tick(fm), live ? 5000 : 60000));
  });
};

// dati FotMob freschi della competizione (null finche' non arrivano o se il worker non e' aggiornato)
export function useLiveTable(fm, on = true) {
  const [d, setD] = useState(() => (fm && CACHE.get(fm) ? CACHE.get(fm).data : null));
  useEffect(() => {
    if (!fm || !on) return undefined;
    const c = CACHE.get(fm);
    setD(c ? c.data : null);
    const set = SUBS.get(fm) || new Set();
    SUBS.set(fm, set);
    set.add(setD);
    if (!TIMER.has(fm)) { TIMER.set(fm, 0); tick(fm); } else if (!c || Date.now() - c.at > 4000) pull(fm);
    return () => { set.delete(setD); if (!set.size) { clearTimeout(TIMER.get(fm)); TIMER.delete(fm); } };
  }, [fm, on]);
  return d;
}

const scoreOf = (r) => { const m = /^(\d+)\D+(\d+)$/.exec(String(r.scoresStr || '')); return m ? [Number(m[1]), Number(m[2])] : [0, 0]; };
const cmp = (a, b) => (b.pts || 0) - (a.pts || 0) || ((scoreOf(b)[0] - scoreOf(b)[1]) - (scoreOf(a)[0] - scoreOf(a)[1])) || scoreOf(b)[0] - scoreOf(a)[0];

// gruppo FotMob con le stesse squadre della tabella dell'app (un campionato, o un girone)
export function freshGroup(lt, t) {
  if (!lt || !t || !t.all || !t.all.length) return null;
  const ids = new Set(t.all.map((r) => String(r.id)));
  return (lt.groups || []).find((g) => g.t && g.t.all && g.t.all.length === t.all.length && g.t.all.every((r) => ids.has(String(r.id)))) || null;
}

// Il worker toglie gia' dalla tabella FotMob la partita in corso (FotMob la include durante la diretta) e da' a ogni gruppo le sue partite
// live (`g.live`, fase giusta per Apertura/Clausura e gironi): qui si passa sempre `g.live` se c'e', cosi' la partita si conta una volta sola.
// righe FotMob + partite live -> righe con `lv` (partita in corso), `mv` (posti guadagnati/persi), `dp` (punti provvisori)
export function applyLive(rows, live, mode = 'all') {
  const base = rows.map((r) => ({ ...r }));
  if (!live || !live.length) return base;
  const by = new Map(base.map((r) => [String(r.id), r]));
  let any = false;
  live.forEach(([mid, hid, aid, hs, as, min]) => {
    [[hid, hs, as, true], [aid, as, hs, false]].forEach(([tid, us, them, home]) => {
      if (mode === 'home' && !home) return;
      if (mode === 'away' && home) return;
      const r = by.get(String(tid));
      if (!r) return;
      const [gf, ga] = scoreOf(r);
      const win = us > them ? 1 : 0;
      const dr = us === them ? 1 : 0;
      r.played = (r.played || 0) + 1;
      r.wins = (r.wins || 0) + win;
      r.draws = (r.draws || 0) + dr;
      r.losses = (r.losses || 0) + (us < them ? 1 : 0);
      r.scoresStr = `${gf + us}-${ga + them}`;
      r.pts = (r.pts || 0) + win * 3 + dr;
      r.dp = win * 3 + dr;
      r.lv = { us, them, min, mid, home };
      any = true;
    });
  });
  if (!any) return base;
  const before = new Map(base.map((r, i) => [String(r.id), r.idx || i + 1]));
  const out = [...base].sort((a, b) => cmp(a, b) || (before.get(String(a.id)) - before.get(String(b.id)))).map((r, i) => ({ ...r, idx: i + 1, mv: (before.get(String(r.id)) || i + 1) - (i + 1) }));
  // le zone (Champions, retrocessione...) appartengono alla posizione, non alla squadra
  return out.map((r, i) => ({ ...r, qualColor: base.slice().sort((a, b) => (a.idx || 0) - (b.idx || 0))[i].qualColor }));
}
