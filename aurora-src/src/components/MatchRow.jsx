import { Link } from 'react-router-dom';
import Crest from './Crest';
import { teamById } from '@/data/teams';
import { viewMatch } from '@/data/matches';

const RC = { V: '#1FA45B', S: '#8A93A6', P: '#E0443A' };
const conceptRes = () => { try { return localStorage.getItem('sl-concept-rowres') || 'a'; } catch { return 'a'; } };

export default function MatchRow({ match, teamId = null, concept = 'c' }) {
  const m = viewMatch(match);
  const home = teamById(m.homeId);
  const away = teamById(m.awayId);
  const live = m.status === 'live';
  const finished = m.status === 'finished';
  const played = live || finished;
  const hasScore = !!m.score;
  let res = null;
  if (teamId && finished && hasScore) {
    const gf = m.homeId === teamId ? m.score[0] : m.score[1];
    const ga = m.homeId === teamId ? m.score[1] : m.score[0];
    res = gf > ga ? 'V' : gf === ga ? 'S' : 'P';
  }
  const rc = res ? RC[res] : null;
  const rowStyle = !rc ? undefined : concept === 'b'
    ? { background: `linear-gradient(90deg, ${rc}33, ${rc}0F 70%, transparent)`, borderRadius: 16, margin: '2px 10px' }
    : concept === 'a' ? { boxShadow: `inset 4px 0 0 ${rc}`, background: `linear-gradient(90deg, ${rc}14, transparent 40%)` } : undefined;

  return (
    <Link to={m.href || `/match/${m.id}`} className="press flex items-center gap-2 px-4 py-3" style={rowStyle}>
      <div className="flex min-w-0 flex-1 items-center justify-end gap-2.5">
        <span className="truncate text-right text-[14px] font-semibold" style={{ color: 'var(--ink)' }}>
          {home ? home.name : '—'}
        </span>
        <Crest team={home} size={24} />
      </div>

      <div className="w-[64px] shrink-0 text-center">
        {played && hasScore ? (
          <span className="tnum text-[15.5px] font-extrabold" style={{ color: live ? 'var(--live)' : rc && concept === 'c' ? rc : 'var(--ink)' }}>
            {m.score[0]}
            <span className="mx-0.5 font-medium" style={{ color: 'var(--ink-3)' }}>–</span>
            {m.score[1]}
          </span>
        ) : finished ? (
          <span className="text-[12px] font-semibold" style={{ color: 'var(--ink-3)' }}>Finita</span>
        ) : (
          <span className="tnum text-[13.5px] font-semibold" style={{ color: 'var(--ink-3)' }}>{m.timeKnown === false ? '—' : m.kickoff}</span>
        )}
        {finished && m.timeKnown !== false ? <span className="tnum mt-[2px] block text-[10.5px]" style={{ color: 'var(--ink-3)' }}>{m.kickoff}</span> : null}
        {live ? (
          <span className="mt-[3px] flex items-center justify-center gap-1">
            <span className="live-dot" style={{ width: 5, height: 5 }} />
            <span className="tnum text-[10px] font-bold" style={{ color: 'var(--live)' }}>
              {m.liveHalf ? 'Int.' : `${m.minute}'`}
            </span>
          </span>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <Crest team={away} size={24} />
        <span className="truncate text-[14px] font-semibold" style={{ color: 'var(--ink)' }}>
          {away ? away.name : '—'}
        </span>
      </div>
      {concept === 'c' && teamId ? (
        <span className="flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full text-[10.5px] font-extrabold" style={{ background: rc ? rc : 'transparent', color: '#fff' }}>{res || ''}</span>
      ) : null}
    </Link>
  );
}
