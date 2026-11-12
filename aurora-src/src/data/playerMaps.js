// Mappe del campo di un giocatore: posizione di tiri, tiri in porta, falli commessi e subiti sommati su tutte le sue partite
// (stagione in corso e scorsa di ogni sua competizione). Tiri: `sh` delle partite (FotMob, [giocatore, x, y, esito, minuto], x 0-105 verso la porta a 105, y 0-68, specchiato come in mapShots).
// Falli: coppie `p` di ESPN [chi commette, chi subisce, X, Y, minuto]; X/Y sono dal punto di vista di chi subisce (X=0 sulla porta che attacca, Y alto = fascia destra).
// Uscita in coordinate campo (x 0-105 verso la porta attaccata dal giocatore, y 0-68 dall'alto): tiri e falli hanno la stessa forma.
import { useEffect, useState } from 'react';
import { loadSeasonMatches, currentSeason, pastSeasons } from './archive';
import { loadFalli, ROLE_KEYS } from './calcRoles';
import { fmOfKey } from './calcFouls';
import { lruGet, lruSet } from '@/lib/lru';

const CACHE = new Map();

export async function loadPlayerMaps(fmPid, fms) {
  const pid = String(fmPid || '');
  const list = [...new Set((fms || []).filter(Boolean).map(Number))];
  if (!pid || !list.length) return null;
  const ck = `${pid}|${list.join(',')}`;
  const hit = lruGet(CACHE, ck);
  if (hit) return hit;
  const run = (async () => {
    const tiri = [];
    const fc = [];
    const fs = [];
    let nShots = 0;
    await Promise.all(list.map(async (fm) => {
      const cur = await currentSeason(fm);
      const past = cur ? (await pastSeasons(fm))[0] : null;
      for (const sk of [cur, past].filter(Boolean)) {
        const d = await loadSeasonMatches(fm, sk).catch(() => null);
        Object.values((d && d.m) || {}).forEach((m) => {
          if (!m || !Array.isArray(m.sh)) return;
          let any = false;
          m.sh.forEach((r) => { if (String(r[0]) === pid) { tiri.push([r[1], 68 - r[2], r[3]]); any = true; } });
          if (any) nShots += 1;
        });
      }
    }));
    const keys = ROLE_KEYS.filter((k) => list.includes(fmOfKey(k)));
    const fl = await Promise.all(keys.map((k) => loadFalli(k)));
    fl.forEach((x) => {
      Object.values((x && x.m) || {}).forEach((m) => {
        ((m && m.p) || []).forEach((r) => {
          if (r.length < 4) return;
          const X = r[2];
          const Y = r[3];
          // chi subisce: campo dal suo punto di vista (attacca verso destra); chi commette: dal suo, cioe' il campo girato
          if (String(r[1]) === pid) fs.push([105 - X * 1.05, Y * 0.68, 0]);
          if (String(r[0]) === pid) fc.push([X * 1.05, (100 - Y) * 0.68, 0]);
        });
      });
    });
    const porta = tiri.filter((t) => t[2] === 1 || t[2] === 2);
    return { tiri, porta, fc, fs, nShots };
  })().catch(() => null);
  lruSet(CACHE, ck, run, 30);
  return run;
}

export function usePlayerMaps(fmPid, fms) {
  const sig = `${fmPid}|${(fms || []).join(',')}`;
  const [v, setV] = useState(undefined);
  useEffect(() => {
    let on = true;
    setV(undefined);
    loadPlayerMaps(fmPid, fms).then((r) => { if (on) setV(r); });
    return () => { on = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);
  return v;
}
