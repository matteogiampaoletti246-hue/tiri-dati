// Stadio da ESPN, SOLO per le partite che non hanno gia' lo stadio dalle altre fonti. Nessuna chiave; un file per giorno, ricordato (capienza fissa).
import { teamById } from '@/data/teams';
import { lruGet, lruSet } from '@/lib/lru';

const DAYS = new Map();
const nrm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
const dayOf = (m) => String(m.date || '').replace(/-/g, '');

function day(ymd) {
  const hit = lruGet(DAYS, ymd);
  if (hit) return hit;
  const p = fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/all/scoreboard?dates=${ymd}&limit=500`)
    .then((r) => (r.ok ? r.json() : null)).then((j) => (j && j.events) || []).catch(() => []);
  lruSet(DAYS, ymd, p, 14);
  return p;
}

export async function loadEspnStadium(match) {
  if (!match || match.stadium || !match.date) return false;
  const h = teamById(match.homeId); const a = teamById(match.awayId);
  if (!h || !a) return false;
  const hn = nrm(h.name); const an = nrm(a.name);
  const ev = await day(dayOf(match));
  const f = ev.find((e) => {
    const c = (e.competitions && e.competitions[0] && e.competitions[0].competitors) || [];
    const names = c.map((x) => nrm((x.team && (x.team.displayName || x.team.name)) || ''));
    const has = (n) => names.some((x) => x && (x === n || x.includes(n) || n.includes(x)));
    return names.length === 2 && has(hn) && has(an);
  });
  const v = f && f.competitions[0].venue;
  if (!v || !v.fullName || match.stadium) return false;
  match.stadium = v.fullName;
  if (v.address && v.address.city && !match.stadiumCity) match.stadiumCity = v.address.city;
  return true;
}
