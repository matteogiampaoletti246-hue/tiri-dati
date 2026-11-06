import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import LiveScorePill from './LiveScorePill';
import { useLiveTable, applyLive } from '@/data/liveTable';
import { FM_ID } from '@/data/archive';
import Crest from './Crest';
import FormDots from './FormDots';
import { teamById, teamByFm, teamByName } from '@/data/teams';
import { sameSquad } from '@/data/teamMatch';
import { standings, zoneOf } from '@/data/standings';

const COLS = { table: '18px 1fr 22px 20px 20px 20px 36px 28px', forma: '18px 1fr 92px 30px' };

export default function StandingsTable({ leagueId, mode = 'total', highlight = [] }) {
  const base = standings(leagueId, mode);
  const fm = FM_ID[leagueId];
  const lt = useLiveTable(fm, !!fm && mode !== 'forma');
  // classifica FotMob fresca + partite live (stesso calcolo delle classifiche d'archivio, `data/liveTable.js`); se una squadra non si abbina resta quella calcolata
  const rows = useMemo(() => {
    if (!lt || mode === 'forma' || !lt.groups || lt.groups.length !== 1) return base;
    const md = mode === 'total' ? 'all' : mode;
    const src = lt.groups[0].t[md];
    if (!src || !src.length) return base;
    const out = [];
    for (const r of applyLive(src, lt.groups[0].live || lt.live, md)) {
      const t = teamByFm(r.id) || teamByName(r.name) || teamByName(r.shortName) || base.map((x) => teamById(x.teamId)).find((x) => x && sameSquad(x.name, r.name));
      if (!t) return base;
      const b = base.find((x) => x.teamId === t.id);
      const m = /^(\d+)\D+(\d+)$/.exec(String(r.scoresStr || ''));
      const gf = m ? Number(m[1]) : 0;
      const ga = m ? Number(m[2]) : 0;
      out.push({ teamId: t.id, played: r.played, won: r.wins, drawn: r.draws, lost: r.losses, gf, ga, points: r.pts, dr: gf - ga, rank: r.idx, form: b ? b.form : [], formPoints: b ? b.formPoints : 0, lv: r.lv, mv: r.mv });
    }
    return out;
  }, [lt, base, mode]);
  if (!rows.length) return null;
  const forma = mode === 'forma';
  const cols = forma ? COLS.forma : COLS.table;
  const head = forma ? ['#', 'Squadra', 'Ultime 5', 'Pt'] : ['#', 'Squadra', 'PG', 'V', 'N', 'P', 'GF:GS', 'Pt'];
  const legend = [];
  if (!forma && mode === 'total') {
    rows.forEach((r) => {
      const z = zoneOf(leagueId, r.rank);
      if (z && !legend.find((l) => l.label === z.label)) legend.push(z);
    });
  }

  return (
    <div>
      <div className="grid items-center gap-2 px-4 pb-2 text-[9.5px] font-bold uppercase tracking-[.1em]" style={{ gridTemplateColumns: cols, color: 'var(--ink-3)' }}>
        {head.map((h, i) => (
          <span key={h} className={i === 1 ? '' : 'text-right'}>{h}</span>
        ))}
      </div>

      {rows.map((row) => {
        const team = teamById(row.teamId);
        const on = highlight.includes(row.teamId);
        const z = !forma && mode === 'total' ? zoneOf(leagueId, row.rank) : null;
        const pts = forma ? row.formPoints : row.points;
        return (
          <Link
            key={row.teamId}
            to={`/squadra/${row.teamId}`}
            className="press relative grid items-center gap-2 px-4 py-2.5"
            style={{ gridTemplateColumns: cols, borderTop: '1px solid var(--hair-2)', background: !forma && row.lv ? 'var(--live-soft)' : on ? 'var(--accent-soft)' : 'transparent' }}
          >
            {z ? <span aria-hidden="true" className="absolute left-0 top-1.5 bottom-1.5 w-[3.5px] rounded-r-full" style={{ background: z.color }} /> : null}
            <span className="tnum text-right text-[11.5px]" style={{ color: 'var(--ink-3)' }}>{row.rank}{!forma && row.mv ? <span className="block text-[9px] font-bold leading-none" style={{ color: row.mv > 0 ? 'var(--good)' : 'var(--bad)' }}>{row.mv > 0 ? '▲' : '▼'}{Math.abs(row.mv)}</span> : null}</span>
            <span className="flex min-w-0 items-center gap-2">
              <Crest team={team} size={22} />
              <span className="truncate text-[13px] font-semibold">{team ? team.name : '—'}</span>
              {!forma ? <LiveScorePill lv={row.lv} /> : null}
            </span>
            {forma ? (
              <span className="flex justify-end"><FormDots form={row.form} size={15} /></span>
            ) : (
              <>
                <span className="tnum text-right text-[11.5px]" style={{ color: 'var(--ink-2)' }}>{row.played}</span>
                <span className="tnum text-right text-[11.5px]" style={{ color: 'var(--ink-2)' }}>{row.won}</span>
                <span className="tnum text-right text-[11.5px]" style={{ color: 'var(--ink-2)' }}>{row.drawn}</span>
                <span className="tnum text-right text-[11.5px]" style={{ color: 'var(--ink-2)' }}>{row.lost}</span>
                <span className="tnum text-right text-[11px]" style={{ color: 'var(--ink-2)' }}>{row.gf}:{row.ga}</span>
              </>
            )}
            <span className="tnum text-right text-[13.5px] font-extrabold" style={!forma && row.lv ? { color: 'var(--live)' } : undefined}>{pts}</span>
          </Link>
        );
      })}

      {legend.length ? (
        <div className="flex flex-wrap gap-x-4 gap-y-2 px-5 pb-6 pt-4">
          {legend.map((l) => (
            <span key={l.label} className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--ink-3)' }}>
              <span className="h-[9px] w-[9px] rounded-full" style={{ background: l.color }} />
              {l.label}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
