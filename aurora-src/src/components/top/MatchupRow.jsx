import { memo } from 'react';
import { Link } from 'react-router-dom';
import Crest from '@/components/Crest';
import TeamLink from '@/components/TeamLink';
import { teamById } from '@/data/teams';
import { matchesByDate } from '@/data/matches';
import { comma } from '@/lib/format';
import { matchColors, shown } from '@/lib/tint';

const GOLD = '#F5C84C';

function Side({ team, name, value }) {
  return (
    <div className="flex min-w-0 flex-col items-center">
      <TeamLink team={team} className="flex flex-col items-center">
        <Crest team={team} size={46} />
      </TeamLink>
      <span className="mt-1.5 line-clamp-2 w-full text-center text-[12.5px] font-extrabold leading-tight" style={{ color: 'var(--ink)' }}>{name}</span>
      <span className="tnum mt-1 text-[18px] font-extrabold leading-none" style={{ color: 'var(--ink)' }}>{value == null ? '\u00a0' : comma(value, 1)}</span>
    </div>
  );
}

// Scheda del matchup: bordi nei colori delle due squadre, divario in oro al centro.
export default memo(function MatchupRow({ row, both }) {
  const home = teamById(row.homeId);
  const away = teamById(row.awayId);
  // la partita si trova prima per id FotMob (le nazionali non sempre hanno gli stessi id squadra), poi per le due squadre;
  // senza partita in Home si apre quella d'archivio (Nations League: fm + stagione dal file)
  const day = matchesByDate(row.date);
  const found = day.find((m) => m.fmId && String(m.fmId) === String(row.id)) || day.find((m) => m.homeId === row.homeId && m.awayId === row.awayId);
  const to = found ? `/match/${found.id}` : row.fm && row.sk ? `/match/a-${row.fm}-${row.sk}-${row.id}` : null;
  const Wrap = to ? Link : 'div';
  const props = to ? { to } : {};

  return (
    <Wrap
      {...props}
      data-cas=""
      className="halo-card press relative mx-4 mb-2.5 mt-2 block rounded-[24px] px-3 pb-3 pt-2.5"
      style={{
        boxShadow: both ? '0 0 20px rgba(245,200,76,.28)' : undefined,
        background: `linear-gradient(90deg, color-mix(in srgb, ${matchColors(home, away)[0]} 55%, transparent) 0%, transparent 40%, transparent 60%, color-mix(in srgb, ${matchColors(home, away)[1]} 50%, transparent) 100%), var(--glass-bg)`,
        '--ring-c': both ? GOLD : shown(matchColors(home, away)[0]),
        '--ring-c2': both ? '#FFE9A8' : shown(matchColors(home, away)[1]),
      }}
    >
      {both ? (
        <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full px-2.5 py-[3px] text-[9.5px] font-extrabold uppercase tracking-[.08em]" style={{ background: GOLD, color: '#1a1405' }}>
          {both}
        </span>
      ) : null}
      <p className="mb-2 truncate text-center text-[10.5px] font-bold uppercase tracking-[.08em]" style={{ color: 'var(--ink-3)' }}>
        {row.league}{found ? ` · ${found.kickoff}` : ''}
      </p>
      <div className="grid items-start" style={{ gridTemplateColumns: '1fr 88px 1fr' }}>
        <Side team={home} name={row.homeName} value={row.home} />
        <div className="flex flex-col items-center pt-2">
          <span className="text-[9.5px] font-bold uppercase tracking-[.12em]" style={{ color: 'var(--ink-3)' }}>{row.centerLabel}</span>
          <span className="tnum text-[30px] font-extrabold leading-none" style={{ color: GOLD }}>{comma(row.center, 1)}</span>
          {row.referee ? (
            <span className="mt-1.5 line-clamp-2 w-full text-center text-[10px] font-bold leading-tight" style={{ color: 'var(--ink-2, var(--ink-3))' }}>{row.referee.name}</span>
          ) : (
            <span className="mt-2 text-[10px]" style={{ color: 'var(--ink-3)' }}>{row.type.label}</span>
          )}
        </div>
        <Side team={away} name={row.awayName} value={row.away} />
      </div>
      <p className="tnum mt-2 text-center text-[10px]" style={{ color: 'var(--ink-3)' }}>
        {row.referee ? `Gare arbitro ${row.referee.n}` : `Partite usate ${row.playedHome ?? '—'} / ${row.playedAway ?? '—'}`}
      </p>
    </Wrap>
  );
});
