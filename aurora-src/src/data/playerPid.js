// id FotMob di un giocatore (usato dal sito e dall'app nativa): carriere.json, id dell'archivio, rosa della squadra, statistiche in corso.
import { carriereOf, loadCarriere } from './carriere';
import { loadRose, roseOf, rosaOf } from './rose';
import { loadPlayerStats, currentSeason, FM_ID } from './archive';
import { teamById } from './teams';

export const nm = (s) => String(s || '').toLowerCase().replace(/ı/g, 'i').replace(/ø/g, 'o').replace(/ł/g, 'l').replace(/đ/g, 'd').replace(/ß/g, 'ss').replace(/æ/g, 'ae').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

// id FotMob del giocatore: carriere.json, poi id dell'archivio, poi rosa della squadra, poi statistiche della stagione in corso
const PID = {};
export const resolvePid = (player) => {
  if (!player) return Promise.resolve(null);
  if (!PID[player.id]) {
    PID[player.id] = (async () => {
      // id FotMob gia' collegato dai dati (profili.py): niente ricerca per nome
      if (player.fmId) return String(player.fmId);
      await Promise.all([loadCarriere(), loadRose()]);
      const c = carriereOf(player.id);
      if (c && c.fm) return String(c.fm);
      const m = /^fm~\d+~[^~]+~(\d+)$/.exec(player.id || '');
      if (m) return m[1];
      const team = teamById(player.teamId);
      const n = nm(player.nick || player.name);
      const ro = team ? roseOf(team) : null;
      const hit = ro && (ro.p || []).find((r) => nm(r[1]) === n);
      if (hit) return String(hit[0]);
      // rose.json puo' avere la squadra vuota (o senza di lui): rosa completa della squadra (rosa/<id%100>.json)
      const full = team ? await rosaOf(team).catch(() => null) : null;
      let hit2 = full && (full.p || []).find((r) => nm(r[1]) === n);
      if (!hit2 && full) {
        // nome scritto in modo diverso (Kim Min-Jae / Min-jae Kim): stesse parole in qualsiasi ordine, oppure cognome unico nella rosa
        const w = n.split(' ').sort().join(' ');
        hit2 = (full.p || []).find((r) => nm(r[1]).split(' ').sort().join(' ') === w);
        if (!hit2) { const last = n.split(' ').pop(); const c = (full.p || []).filter((r) => nm(r[1]).split(' ').includes(last)); if (c.length === 1 && last.length > 3) hit2 = c[0]; }
      }
      if (hit2 && hit2[0] > 0) return String(hit2[0]);
      const fm = FM_ID[(team && team.leagueId) || player.leagueId];
      if (fm) {
        const sk = await currentSeason(fm);
        const st = sk ? await loadPlayerStats(fm, sk) : null;
        const L = (st && st.players) || {};
        for (const k of Object.keys(L)) {
          if (k.startsWith('_')) continue;
          const r = (L[k] || []).find((x) => nm(x[1]) === n);
          if (r) return String(r[0]);
        }
      }
      return null;
    })();
  }
  return PID[player.id];
};
