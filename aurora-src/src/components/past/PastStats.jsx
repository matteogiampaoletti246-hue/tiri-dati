import useAsync from '@/hooks/useAsync';
import { noStats, loadSeason, loadPlayerStats, loadSeasonStats, teamPartStats, teamIdByName, PLAYER_STAT_IT, SEASON_STAT_IT, STAT_IT, prettyKey, seasonLabel } from '@/data/archive';
import { useTeamColors } from '@/components/archive/parts';
import { groupOf, fmtVal, ORDER } from '@/components/archive/ArchiveLeague';
import { TeamLogo } from '@/components/FmImg';
import { CARD, BarRow, standingOf } from './PastBits';

// categorie come nella stagione attuale: Attacco / Difesa / Disciplina / Gioco
const catOfMatchKey = (k) => (/yellow|red_cards|fouls|Offsides/.test(k) ? 'Disciplina' : /tackles|interceptions|shot_blocks|clearances|keeper_saves/.test(k) ? 'Difesa' : /expected_goals|shots|ShotsOn|ShotsOff|big_chance|corners|touches_opp_box|woodwork/.test(k) ? 'Attacco' : 'Gioco');
const catOfSeasonGroup = (g) => (['Attacco', 'Difesa', 'Disciplina'].includes(g) ? g : 'Gioco');
const GROUP_ORDER = ['Attacco', 'Difesa', 'Disciplina', 'Gioco'];

const Msg = ({ children }) => <p className="px-5 py-14 text-center text-[13px]" style={{ color: 'var(--ink-3)' }}>{children}</p>;

// Statistiche di una stagione passata, con lo stesso aspetto della stagione attuale:
// riquadri a pillola col colore della squadra, valori colorati per posizione, barre con la media del campionato.
export default function PastStats({ kind, id, fm, sk, current = false, teamName = '', part = 'tot', cat = 'all' }) {
  const wantMatch = kind === 'teams' && part !== 'tot';
  const col = useTeamColors();
  const { data: res, loading } = useAsync(async () => ({ byMatch: wantMatch, stats: await (kind === 'players' ? loadPlayerStats(fm, sk) : wantMatch ? teamPartStats(fm, sk, part) : loadSeasonStats(fm, sk)) }), [fm, sk, kind, part]);
  // finche' arrivano i dati nuovi restano visibili quelli di prima (con la loro modalita'): nessun salto
  const stats = res ? res.stats : undefined;
  const byMatch = res ? res.byMatch : wantMatch;
  const { data: season } = useAsync(() => loadSeason(fm, sk), [fm, sk]);
  // cambiando Casa/Trasferta il contenuto resta al suo posto e le barre scorrono ai nuovi valori (niente scomparsa e riapparizione)
  if (loading && !stats) return <Msg>Carico la stagione {seasonLabel(sk)}…</Msg>;
  const lists = stats && stats[kind];
  if (!lists) return <Msg>{byMatch ? `Dati partita per partita del ${seasonLabel(sk)} non disponibili` : noStats(fm, sk) ? `Statistiche non disponibili per la stagione ${seasonLabel(sk)}` : `Statistiche della stagione ${seasonLabel(sk)} in arrivo`}</Msg>;
  const isP = kind === 'players';
  const names = (season && season.teams) || {};
  const groups = {};
  let me = null;
  Object.keys(lists).forEach((k) => {
    if (k.startsWith('_')) return;
    const list = lists[k];
    const idx = list.findIndex((r) => String(isP ? r[0] : r[2]) === String(id));
    if (idx < 0) return;
    me = me || list[idx];
    const g = byMatch ? catOfMatchKey(k) : kind === 'teams' ? catOfSeasonGroup(groupOf(k.replace(/_team$/, ''))) : groupOf(k.replace(/_team$/, ''));
    if (kind === 'teams' && cat !== 'all' && g !== cat) return;
    (groups[g] = groups[g] || []).push({ k, st: standingOf(list, idx, k), title: byMatch ? (STAT_IT[k] || prettyKey(k)) : (SEASON_STAT_IT[k] || PLAYER_STAT_IT[k] || prettyKey(k)) });
  });
  if (!me) return <Msg>Nessuna presenza in questa stagione</Msg>;
  const tid = isP ? (me[2] || (teamName ? teamIdByName(names, teamName) : null)) : id;
  const tname = names[tid] || '';
  const club = col(tid, tname).colors[0];
  const order = Object.keys(groups).sort((a, b) => (kind === 'teams' ? GROUP_ORDER.indexOf(a) - GROUP_ORDER.indexOf(b) : ORDER.indexOf(a) - ORDER.indexOf(b)));
  return (
    <div className="club-scope flex flex-col gap-4 px-5 pb-10 pt-4" style={{ '--club': club, '--club-a': '24%' }}>
      {isP ? (
        <div className="club-card flex items-center gap-3 rounded-2xl px-4 py-3.5" style={CARD}>
          <TeamLogo id={tid} name={tname} size={30} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-semibold">{tname}</p>
            <p className="text-[11px]" style={{ color: 'var(--ink-3)' }}>{current ? 'Stagione attuale' : `Stagione ${seasonLabel(sk)}`}</p>
          </div>
          <div className="text-right">
            <p className="tnum text-[17px] font-semibold">{me[5] || 0}</p>
            <p className="text-[9px] uppercase tracking-[.08em]" style={{ color: 'var(--ink-3)' }}>presenze</p>
          </div>
          <div className="text-right">
            <p className="tnum text-[17px] font-semibold">{me[4] || 0}&apos;</p>
            <p className="text-[9px] uppercase tracking-[.08em]" style={{ color: 'var(--ink-3)' }}>minuti</p>
          </div>
        </div>
      ) : null}
      {order.map((g) => (
        <section key={g}>
          <div className="club-card overflow-hidden rounded-2xl" style={CARD}>
            <div className="px-4 pb-1.5 pt-3.5"><span className="text-[14px] font-semibold">{g}</span></div>
            {groups[g].map((r, i) => (
              <BarRow
                key={r.k}
                first={i === 0}
                label={r.title}
                value={r.st.v}
                fmt={(v) => (byMatch ? (/BallPossesion/.test(r.k) ? `${Math.round(v)}%` : Number(v).toFixed(Number.isInteger(v) ? 0 : 2).replace('.', ',')) : fmtVal(r.k, v))}
                frac={r.st.frac}
                width={r.st.width}
                avgPos={r.st.avgPos}
                avgText={byMatch ? Number(r.st.avg).toFixed(2).replace('.', ',') : fmtVal(r.k, r.st.avg)}
                rank={r.st.rank}
                delay={Math.min(i, 8) * 40}
              />
            ))}
          </div>
        </section>
      ))}
      <p className="px-1 text-[10.5px]" style={{ color: 'var(--ink-3)' }}>La lineetta con il numero è la media del campionato. Colori: rosso = parte bassa della classifica, giallo = metà, verde = parte alta.</p>
    </div>
  );
}
